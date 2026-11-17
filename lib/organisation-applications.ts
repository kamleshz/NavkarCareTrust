import { getDatabase } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import type {
  OrganisationApplicationDocument,
  OrganisationApplicationStatus,
  OrganisationApplicationType,
  OrganisationApplicationView,
} from "@/lib/types";
import type { OrganisationApplicationInput } from "@/lib/validation";

/** Generates a stable, human-readable registration reference. */
function generateReference(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OA-${stamp}-${rand}`;
}

function normalise(value?: string): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export interface CreateApplicationResult {
  reference: string;
  created: boolean;
  existingId?: string;
}

/**
 * Saves a new organisation application. Prevents duplicates by organisation
 * identity (name) or contact details (email/mobile) within the same type,
 * while still allowing different organisations to share a contact person.
 */
export async function createOrganisationApplication(
  input: OrganisationApplicationInput,
): Promise<CreateApplicationResult> {
  const db = await getDatabase();
  const now = new Date();

  const normalisedName = normalise(input.organisationName);
  const normalisedEmail = normalise(input.email);
  const normalisedMobile = normalise(input.mobile);

  // Duplicate match: same type + (same name OR same email OR same mobile).
  const duplicateConditions: Record<string, unknown>[] = [
    { normalisedName, organisationType: input.organisationType },
  ];
  if (normalisedEmail) {
    duplicateConditions.push({ normalisedEmail, organisationType: input.organisationType });
  }
  if (normalisedMobile) {
    duplicateConditions.push({ normalisedMobile, organisationType: input.organisationType });
  }

  const existing = await db
    .collection<OrganisationApplicationDocument & {
      normalisedName?: string;
      normalisedEmail?: string;
      normalisedMobile?: string;
    }>("organisationApplications")
    .findOne({ $or: duplicateConditions });

  if (existing?._id) {
    return { reference: existing.reference, created: false, existingId: existing._id.toHexString() };
  }

  const reference = generateReference();
  const document: OrganisationApplicationDocument & {
    normalisedName: string;
    normalisedEmail: string;
    normalisedMobile: string;
  } = {
    reference,
    organisationType: input.organisationType,
    source: "common_qr",
    status: "pending",
    organisationName: input.organisationName,
    contactPerson: input.contactPerson,
    mobile: input.mobile,
    email: input.email,
    address: input.address,
    city: input.city,
    state: input.state,
    pinCode: input.pinCode,
    serviceAreas: input.serviceAreas,
    supportOffered: input.supportOffered,
    description: input.description,
    details: input.details,
    consentAt: now,
    createdAt: now,
    updatedAt: now,
    normalisedName,
    normalisedEmail,
    normalisedMobile,
  };

  await db.collection("organisationApplications").insertOne(document);
  return { reference, created: true };
}

export interface ApplicationFilters {
  organisationType?: OrganisationApplicationType;
  city?: string;
  status?: OrganisationApplicationStatus;
}

/** Lists organisation applications for the admin panel, with optional filters. */
export async function listOrganisationApplications(
  filters: ApplicationFilters = {},
): Promise<OrganisationApplicationView[]> {
  const db = await getDatabase();
  const query: Record<string, unknown> = {};
  if (filters.organisationType) query.organisationType = filters.organisationType;
  if (filters.status) query.status = filters.status;
  if (filters.city) {
    query.city = { $regex: new RegExp(normalise(filters.city).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") };
  }

  const applications = await db
    .collection<OrganisationApplicationDocument>("organisationApplications")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();

  return applications.map((application) => toApplicationView(application));
}

export async function getOrganisationApplication(
  id: string,
): Promise<OrganisationApplicationView | null> {
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const db = await getDatabase();
  const application = await db
    .collection<OrganisationApplicationDocument>("organisationApplications")
    .findOne({ _id: objectId });
  return application ? toApplicationView(application) : null;
}

export type ApplicationReviewAction = "approve" | "return" | "reject";

/** Updates the review status of an application. */
export async function reviewOrganisationApplication(
  id: string,
  action: ApplicationReviewAction,
  reason: string,
  reviewerUserId: string,
): Promise<OrganisationApplicationView | null> {
  const objectId = toObjectId(id);
  if (!objectId) return null;
  const db = await getDatabase();

  const statusMap: Record<ApplicationReviewAction, OrganisationApplicationStatus> = {
    approve: "approved",
    return: "returned",
    reject: "rejected",
  };

  const status = statusMap[action];
  const update: Partial<OrganisationApplicationDocument> = {
    status,
    updatedAt: new Date(),
    reviewedAt: new Date(),
    reviewedByUserId: toObjectId(reviewerUserId) ?? undefined,
  };
  if (action !== "approve") update.reviewNote = reason;
  else update.reviewNote = undefined;

  const result = await db
    .collection<OrganisationApplicationDocument>("organisationApplications")
    .findOneAndUpdate({ _id: objectId }, { $set: update }, { returnDocument: "after" });

  return result ? toApplicationView(result) : null;
}

function toApplicationView(
  application: OrganisationApplicationDocument & { _id: import("mongodb").ObjectId },
): OrganisationApplicationView {
  return {
    id: application._id.toHexString(),
    reference: application.reference,
    organisationType: application.organisationType,
    status: application.status,
    reviewNote: application.reviewNote,
    organisationName: application.organisationName,
    contactPerson: application.contactPerson,
    mobile: application.mobile,
    email: application.email,
    city: application.city,
    state: application.state,
    pinCode: application.pinCode,
    serviceAreas: application.serviceAreas,
    supportOffered: application.supportOffered,
    description: application.description,
    details: application.details ?? {},
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
