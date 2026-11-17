"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { recordAudit } from "@/lib/audit";
import { getOrganisationContext } from "@/lib/auth/guards";
import { createListingClaim } from "@/lib/listings";
import { getDatabase } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import { branchSchema, memberInviteSchema, organisationProfileSchema } from "@/lib/validation";
import type { OrganisationFormState } from "@/lib/action-state";
import type {
  BranchDocument,
  OrganisationDocument,
  OrganisationMembershipDocument,
  UserDocument,
} from "@/lib/types";

function fields(formData: FormData, names: string[]): Record<string, unknown> {
  return Object.fromEntries(names.map((name) => [name, formData.get(name)]));
}

function organisationIdFrom(formData: FormData): ObjectId | null {
  return toObjectId(String(formData.get("organisationId") ?? ""));
}

export async function updateOrganisationProfile(
  _previousState: OrganisationFormState,
  formData: FormData,
): Promise<OrganisationFormState> {
  const organisationId = organisationIdFrom(formData);
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId) return { success: false, message: "Organisation not found." };

  const context = await getOrganisationContext(organisationId, "editProfile");
  if (!context) return { success: false, message: "You do not have permission to edit this profile." };

  const parsed = organisationProfileSchema.safeParse({
    ...fields(formData, ["name", "description", "email", "phone", "website"]),
    enquiriesEnabled: formData.get("enquiriesEnabled"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const db = await getDatabase();
  await db.collection<OrganisationDocument>("organisations").updateOne(
    { _id: organisationId },
    {
      $set: {
        name: parsed.data.name,
        description: parsed.data.description,
        email: parsed.data.email,
        phone: parsed.data.phone,
        website: parsed.data.website,
        enquiriesEnabled: parsed.data.enquiriesEnabled === "on",
        updatedAt: new Date(),
      },
    },
  );

  await recordAudit({
    actorUserId: context.userId,
    actorEmail: context.user.email,
    action: "organisation.profile.updated",
    entityType: "organisation",
    entityId: organisationId.toHexString(),
    summary: `Profile updated for ${parsed.data.name}.`,
  });

  if (slug) revalidatePath(`/organisation/${slug}`);
  return { success: true, message: "Profile saved." };
}

export async function createBranch(
  _previousState: OrganisationFormState,
  formData: FormData,
): Promise<OrganisationFormState> {
  const organisationId = organisationIdFrom(formData);
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId) return { success: false, message: "Organisation not found." };

  const context = await getOrganisationContext(organisationId, "manageBranches");
  if (!context) return { success: false, message: "You do not have permission to manage branches." };

  const parsed = branchSchema.safeParse(
    fields(formData, ["name", "address", "locality", "city", "state", "region", "pinCode", "phone", "email"]),
  );

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const now = new Date();
  const db = await getDatabase();
  await db.collection<BranchDocument>("branches").insertOne({
    organisationId,
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  });

  if (slug) revalidatePath(`/organisation/${slug}`);
  return { success: true, message: "Branch added." };
}

export async function deleteBranch(formData: FormData): Promise<void> {
  const organisationId = organisationIdFrom(formData);
  const branchId = toObjectId(String(formData.get("branchId") ?? ""));
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId || !branchId) return;

  const context = await getOrganisationContext(organisationId, "manageBranches");
  if (!context) return;

  const db = await getDatabase();
  await db.collection<BranchDocument>("branches").deleteOne({ _id: branchId, organisationId });
  await db
    .collection("resources")
    .updateMany({ organisationId, branchId }, { $set: { branchId: undefined } });

  if (slug) revalidatePath(`/organisation/${slug}`);
}

export async function inviteMember(
  _previousState: OrganisationFormState,
  formData: FormData,
): Promise<OrganisationFormState> {
  const organisationId = organisationIdFrom(formData);
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId) return { success: false, message: "Organisation not found." };

  const context = await getOrganisationContext(organisationId, "manageMembers");
  if (!context) return { success: false, message: "You do not have permission to manage members." };

  const parsed = memberInviteSchema.safeParse(fields(formData, ["email", "role"]));
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const db = await getDatabase();
  const existingUser = await db.collection<UserDocument>("users").findOne({ email: parsed.data.email });

  const duplicate = existingUser
    ? await db
        .collection<OrganisationMembershipDocument>("organisationMemberships")
        .findOne({ organisationId, userId: existingUser._id })
    : await db
        .collection<OrganisationMembershipDocument>("organisationMemberships")
        .findOne({ organisationId, invitedEmail: parsed.data.email });

  if (duplicate) {
    return { success: false, message: "That person is already part of this organisation." };
  }

  const now = new Date();
  await db.collection<OrganisationMembershipDocument>("organisationMemberships").insertOne({
    organisationId,
    userId: existingUser?._id ?? new ObjectId(),
    role: parsed.data.role,
    status: existingUser ? "active" : "invited",
    invitedEmail: parsed.data.email,
    createdAt: now,
    updatedAt: now,
  });

  await recordAudit({
    actorUserId: context.userId,
    actorEmail: context.user.email,
    action: "organisation.member.added",
    entityType: "organisation",
    entityId: organisationId.toHexString(),
    summary: `${parsed.data.email} added as ${parsed.data.role}.`,
  });

  if (slug) revalidatePath(`/organisation/${slug}`);
  return {
    success: true,
    message: existingUser
      ? "Team member added."
      : "Invitation recorded. They will gain access once they register with this email.",
  };
}

export async function updateMemberRole(formData: FormData): Promise<void> {
  const organisationId = organisationIdFrom(formData);
  const membershipId = toObjectId(String(formData.get("membershipId") ?? ""));
  const role = String(formData.get("role") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId || !membershipId) return;
  if (role !== "owner" && role !== "administrator" && role !== "staff") return;

  const context = await getOrganisationContext(organisationId, "manageMembers");
  if (!context) return;

  const db = await getDatabase();
  await db
    .collection<OrganisationMembershipDocument>("organisationMemberships")
    .updateOne({ _id: membershipId, organisationId }, { $set: { role, updatedAt: new Date() } });

  if (slug) revalidatePath(`/organisation/${slug}`);
}

export async function removeMember(formData: FormData): Promise<void> {
  const organisationId = organisationIdFrom(formData);
  const membershipId = toObjectId(String(formData.get("membershipId") ?? ""));
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId || !membershipId) return;

  const context = await getOrganisationContext(organisationId, "manageMembers");
  if (!context) return;

  const db = await getDatabase();
  const membership = await db
    .collection<OrganisationMembershipDocument>("organisationMemberships")
    .findOne({ _id: membershipId, organisationId });
  if (!membership) return;

  // Never leave an organisation without an owner.
  if (membership.role === "owner") {
    const owners = await db
      .collection<OrganisationMembershipDocument>("organisationMemberships")
      .countDocuments({ organisationId, role: "owner", status: "active" });
    if (owners <= 1) return;
  }

  await db
    .collection<OrganisationMembershipDocument>("organisationMemberships")
    .deleteOne({ _id: membershipId, organisationId });

  if (slug) revalidatePath(`/organisation/${slug}`);
}

export async function updateStockLevel(
  _previousState: OrganisationFormState,
  formData: FormData,
): Promise<OrganisationFormState> {
  const organisationId = organisationIdFrom(formData);
  const listingId = toObjectId(String(formData.get("listingId") ?? ""));
  const level = String(formData.get("level") ?? "").trim();
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId || !listingId) return { success: false, message: "Listing not found." };

  const context = await getOrganisationContext(organisationId, "manageServices");
  if (!context) return { success: false, message: "You do not have permission to update stock." };
  if (!level) return { success: false, message: "Enter the current stock level." };

  const db = await getDatabase();
  const now = new Date();
  const result = await db.collection("resources").updateOne(
    { _id: listingId, organisationId },
    { $set: { stockStatus: { level, updatedAt: now }, updatedAt: now } },
  );

  if (!result.matchedCount) return { success: false, message: "Listing not found." };

  if (slug) revalidatePath(`/organisation/${slug}`);
  return { success: true, message: `Stock updated for ${level}.` };
}

export async function requestListingClaim(
  _previousState: OrganisationFormState,
  formData: FormData,
): Promise<OrganisationFormState> {
  const organisationId = organisationIdFrom(formData);
  const listingId = String(formData.get("listingId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId) return { success: false, message: "Organisation not found." };

  const context = await getOrganisationContext(organisationId, "createListings");
  if (!context) return { success: false, message: "You do not have permission to claim listings." };

  const outcome = await createListingClaim({ listingId, organisationId, userId: context.userId });

  if (outcome === "not-found") return { success: false, message: "Listing not found." };
  if (outcome === "duplicate") {
    return { success: false, message: "A claim for this listing is already pending or approved." };
  }

  await recordAudit({
    actorUserId: context.userId,
    actorEmail: context.user.email,
    action: "listing.claim.requested",
    entityType: "listing",
    entityId: listingId,
    summary: `${context.organisation.name} requested ownership of an imported listing.`,
  });

  if (slug) revalidatePath(`/organisation/${slug}`);
  return { success: true, message: "Claim submitted for administrator review." };
}
