"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { recordAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/dal";
import { publishListing, returnListing, reviewClaim } from "@/lib/listings";
import { getDatabase } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import { adminReviewSchema, listingSchema } from "@/lib/validation";
import type { AdminFormState } from "@/lib/action-state";
import type { OrganisationDocument, ResourceDocument } from "@/lib/types";
import { isMumbaiSubRegion } from "@/lib/types";

async function requireAdminContext() {
  const user = await getCurrentUser();
  if (!user?.isPlatformAdmin) return null;
  return user;
}

function fields(formData: FormData, names: string[]): Record<string, unknown> {
  return Object.fromEntries(names.map((name) => [name, formData.get(name)]));
}

export type OrganisationReviewAction =
  | "approve"
  | "reject"
  | "verify"
  | "unverify"
  | "confirm-partnership"
  | "remove-partnership";

export async function reviewOrganisationAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdminContext();
  if (!admin) return { success: false, message: "Administrator access required." };

  const organisationId = toObjectId(String(formData.get("organisationId") ?? ""));
  const action = String(formData.get("action") ?? "") as OrganisationReviewAction;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!organisationId) return { success: false, message: "Organisation not found." };

  const update: Partial<OrganisationDocument> = { updatedAt: new Date() };
  let summary = "";

  switch (action) {
    case "approve":
      update.registrationStatus = "approved";
      summary = "Organisation registration approved.";
      break;
    case "reject":
      if (reason.length < 3) return { success: false, message: "Add a reason for returning this registration." };
      update.registrationStatus = "rejected";
      update.reviewNote = reason;
      summary = "Organisation registration returned to the applicant.";
      break;
    case "verify":
      update.verificationStatus = "verified";
      summary = "Organisation marked as verified.";
      break;
    case "unverify":
      update.verificationStatus = "unverified";
      summary = "Organisation verification removed.";
      break;
    case "confirm-partnership":
      update.partnershipStatus = "confirmed";
      summary = "Partnership confirmed.";
      break;
    case "remove-partnership":
      update.partnershipStatus = "none";
      summary = "Partnership confirmation removed.";
      break;
    default:
      return { success: false, message: "Unknown review action." };
  }

  if (action !== "reject") update.reviewNote = undefined;

  const db = await getDatabase();
  await db.collection<OrganisationDocument>("organisations").updateOne({ _id: organisationId }, { $set: update });

  await recordAudit({
    actorUserId: toObjectId(admin.id) ?? undefined,
    actorEmail: admin.email,
    action: `organisation.${action}`,
    entityType: "organisation",
    entityId: organisationId.toHexString(),
    summary,
    metadata: reason ? { reason } : undefined,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/organisations");
  return { success: true, message: summary };
}

export async function publishListingAction(formData: FormData): Promise<void> {
  const admin = await requireAdminContext();
  if (!admin) return;

  const listingId = String(formData.get("listingId") ?? "");
  const published = await publishListing(listingId);
  if (!published) return;

  await recordAudit({
    actorUserId: toObjectId(admin.id) ?? undefined,
    actorEmail: admin.email,
    action: "listing.published",
    entityType: "listing",
    entityId: listingId,
    summary: "Listing approved and published.",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/support");
  revalidatePath("/");
}

export async function returnListingAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdminContext();
  if (!admin) return { success: false, message: "Administrator access required." };

  const parsed = adminReviewSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const listingId = String(formData.get("listingId") ?? "");
  const returned = await returnListing(listingId, parsed.data.reason);
  if (!returned) return { success: false, message: "Listing not found." };

  await recordAudit({
    actorUserId: toObjectId(admin.id) ?? undefined,
    actorEmail: admin.email,
    action: "listing.returned",
    entityType: "listing",
    entityId: listingId,
    summary: "Submission returned to the organisation with a reason.",
    metadata: { reason: parsed.data.reason },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  return { success: true, message: "Submission returned with your reason." };
}

export async function reviewClaimAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdminContext();
  if (!admin) return { success: false, message: "Administrator access required." };

  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected") {
    return { success: false, message: "Choose approve or reject." };
  }

  const claim = await reviewClaim({
    claimId: String(formData.get("claimId") ?? ""),
    decision,
    note: String(formData.get("note") ?? "").trim() || undefined,
    actorUserId: toObjectId(admin.id) ?? new ObjectId(),
  });

  if (!claim) return { success: false, message: "Claim not found." };

  await recordAudit({
    actorUserId: toObjectId(admin.id) ?? undefined,
    actorEmail: admin.email,
    action: `listing.claim.${decision}`,
    entityType: "listing",
    entityId: claim.listingId,
    summary: `Ownership claim for "${claim.listingName}" ${decision}.`,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/claims");
  return { success: true, message: `Claim ${decision}.` };
}

export async function assignRegionAction(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdminContext();
  if (!admin) return { success: false, message: "Administrator access required." };

  const listingId = toObjectId(String(formData.get("listingId") ?? ""));
  const regionInput = String(formData.get("region") ?? "").trim();
  if (!listingId) return { success: false, message: "Listing not found." };

  const region = isMumbaiSubRegion(regionInput) ? regionInput : undefined;

  const db = await getDatabase();
  await db.collection<ResourceDocument>("resources").updateOne(
    { _id: listingId },
    region
      ? { $set: { region, updatedAt: new Date() } }
      : { $set: { updatedAt: new Date() }, $unset: { region: "" } },
  );

  await recordAudit({
    actorUserId: toObjectId(admin.id) ?? undefined,
    actorEmail: admin.email,
    action: "listing.region.updated",
    entityType: "listing",
    entityId: listingId.toHexString(),
    summary: region ? `Browsing region set to ${region}.` : "Browsing region cleared.",
  });

  revalidatePath("/admin/directory");
  revalidatePath("/support");
  return { success: true, message: "Region updated." };
}

export async function updateListingAsAdmin(
  _previousState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdminContext();
  if (!admin) return { success: false, message: "Administrator access required." };

  const listingId = toObjectId(String(formData.get("listingId") ?? ""));
  if (!listingId) return { success: false, message: "Listing not found." };

  const parsed = listingSchema.safeParse({
    ...fields(formData, [
      "name",
      "category",
      "organisationType",
      "description",
      "specialty",
      "services",
      "locality",
      "city",
      "state",
      "region",
      "pinCode",
      "phone",
      "email",
      "address",
      "officialUrl",
      "eligibilitySummary",
      "branchId",
    ]),
    enquiriesEnabled: formData.get("enquiriesEnabled"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const db = await getDatabase();
  const result = await db.collection<ResourceDocument>("resources").updateOne(
    { _id: listingId },
    {
      $set: {
        name: data.name,
        category: data.category,
        organisationType: data.organisationType,
        description: data.description,
        specialty: data.specialty,
        services: data.services ?? [],
        locality: data.locality,
        city: data.city,
        state: data.state,
        region: data.region,
        pinCode: data.pinCode,
        "contactDetails.phone": data.phone,
        "contactDetails.email": data.email,
        "contactDetails.address": data.address,
        officialUrl: data.officialUrl,
        eligibilitySummary: data.eligibilitySummary,
        enquiriesEnabled: data.enquiriesEnabled === "on",
        lastReviewedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  if (!result.matchedCount) return { success: false, message: "Listing not found." };

  await recordAudit({
    actorUserId: toObjectId(admin.id) ?? undefined,
    actorEmail: admin.email,
    action: "listing.edited",
    entityType: "listing",
    entityId: listingId.toHexString(),
    summary: `Directory listing "${data.name}" edited by an administrator.`,
  });

  revalidatePath("/admin/directory");
  revalidatePath("/support");
  return { success: true, message: "Listing updated." };
}
