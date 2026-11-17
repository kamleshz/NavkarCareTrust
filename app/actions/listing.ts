"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { recordAudit } from "@/lib/audit";
import { getOrganisationContext } from "@/lib/auth/guards";
import {
  createListingForOrganisation,
  submitListingForReview,
  updateListingFields,
  type ListingInput,
} from "@/lib/listings";
import { getDatabase } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import { slugify } from "@/lib/slug";
import { listingSchema, type ListingInput as ListingFormInput } from "@/lib/validation";
import type { ListingFormState } from "@/lib/action-state";
import type { ProposedListingChange, ResourceDocument } from "@/lib/types";

function organisationIdFrom(formData: FormData): ObjectId | null {
  return toObjectId(String(formData.get("organisationId") ?? ""));
}

function parseListing(formData: FormData) {
  return listingSchema.safeParse({
    ...Object.fromEntries(
      [
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
      ].map((name) => [name, formData.get(name)]),
    ),
    enquiriesEnabled: formData.get("enquiriesEnabled"),
  });
}

function toListingInput(data: ListingFormInput): ListingInput {
  return {
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
    contactDetails: {
      phone: data.phone,
      email: data.email,
      address: data.address,
    },
    officialUrl: data.officialUrl,
    eligibilitySummary: data.eligibilitySummary,
    branchId: toObjectId(data.branchId) ?? undefined,
    enquiriesEnabled: data.enquiriesEnabled === "on",
  };
}

export async function createListing(
  _previousState: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const organisationId = organisationIdFrom(formData);
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId) return { success: false, message: "Organisation not found." };

  const context = await getOrganisationContext(organisationId, "createListings");
  if (!context) return { success: false, message: "You do not have permission to create listings." };

  const parsed = parseListing(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const listingSlug = `${slugify(parsed.data.name)}-${randomBytes(2).toString("hex")}`;
  const created = await createListingForOrganisation(
    organisationId,
    listingSlug,
    toListingInput(parsed.data),
  );

  await recordAudit({
    actorUserId: context.userId,
    actorEmail: context.user.email,
    action: "listing.created",
    entityType: "listing",
    entityId: created.id,
    summary: `${context.organisation.name} created draft listing "${parsed.data.name}".`,
  });

  if (slug) revalidatePath(`/organisation/${slug}`);
  return { success: true, message: "Draft listing created. Submit it for review when ready." };
}

export async function updateListing(
  _previousState: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const organisationId = organisationIdFrom(formData);
  const listingId = String(formData.get("listingId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId) return { success: false, message: "Organisation not found." };

  const context = await getOrganisationContext(organisationId, "createListings");
  if (!context) return { success: false, message: "You do not have permission to update listings." };

  const parsed = parseListing(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = toListingInput(parsed.data);
  const proposedFields: ProposedListingChange["fields"] = {
    name: input.name,
    description: input.description,
    organisationType: input.organisationType,
    specialty: input.specialty,
    services: input.services,
    locality: input.locality,
    city: input.city,
    state: input.state,
    pinCode: input.pinCode,
    region: input.region,
    contactDetails: input.contactDetails,
    officialUrl: input.officialUrl,
    eligibilitySummary: input.eligibilitySummary,
  };

  const result = await updateListingFields({
    organisationId,
    listingId,
    fields: proposedFields,
    userId: context.userId,
  });

  if (!result.ok) return { success: false, message: "Listing not found." };

  await recordAudit({
    actorUserId: context.userId,
    actorEmail: context.user.email,
    action: result.pendingReview ? "listing.change.submitted" : "listing.updated",
    entityType: "listing",
    entityId: listingId,
    summary: result.pendingReview
      ? `Changes submitted for review by ${context.organisation.name}.`
      : `Listing updated and sent for review by ${context.organisation.name}.`,
  });

  if (slug) revalidatePath(`/organisation/${slug}`);
  return {
    success: true,
    message: result.pendingReview
      ? "Changes submitted. The published version stays visible until an administrator approves them."
      : "Listing updated and submitted for review.",
  };
}

export async function submitListing(formData: FormData): Promise<void> {
  const organisationId = organisationIdFrom(formData);
  const listingId = String(formData.get("listingId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId) return;

  const context = await getOrganisationContext(organisationId, "createListings");
  if (!context) return;

  await submitListingForReview(organisationId, listingId);
  if (slug) revalidatePath(`/organisation/${slug}`);
}

export async function archiveListing(formData: FormData): Promise<void> {
  const organisationId = organisationIdFrom(formData);
  const listingId = toObjectId(String(formData.get("listingId") ?? ""));
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId || !listingId) return;

  const context = await getOrganisationContext(organisationId, "createListings");
  if (!context) return;

  const db = await getDatabase();
  await db.collection<ResourceDocument>("resources").updateOne(
    { _id: listingId, organisationId },
    { $set: { publicationStatus: "archived", updatedAt: new Date() } },
  );
  if (slug) revalidatePath(`/organisation/${slug}`);
}
