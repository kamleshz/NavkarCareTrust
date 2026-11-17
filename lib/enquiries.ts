import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import type {
  EnquiryDocument,
  EnquiryStatus,
  EnquiryType,
  PublicEnquiry,
  SessionUser,
} from "@/lib/types";

export const ENQUIRY_CONSENT_VERSION = "enquiry-share-v1";

type StoredEnquiry = EnquiryDocument & { _id: ObjectId };

function reference() {
  return `NKT-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function appointmentConfirmed(enquiry: EnquiryDocument) {
  return enquiry.type === "appointment" && (enquiry.status === "accepted" || enquiry.status === "completed");
}

export function toPublicEnquiry(
  enquiry: StoredEnquiry,
  organisationName?: string,
): PublicEnquiry {
  return {
    id: enquiry._id.toHexString(),
    reference: enquiry.reference,
    type: enquiry.type,
    listingName: enquiry.listingName,
    organisationId: enquiry.organisationId?.toHexString(),
    organisationName,
    patientName: enquiry.patientName,
    contactMethod: enquiry.contactMethod,
    email: enquiry.email,
    phone: enquiry.phone,
    requestedService: enquiry.requestedService,
    preferredDate: enquiry.preferredDate,
    message: enquiry.message,
    status: enquiry.status,
    appointmentConfirmed: appointmentConfirmed(enquiry),
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
  };
}

async function organisationNames(ids: ObjectId[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const db = await getDatabase();
  const organisations = await db
    .collection("organisations")
    .find({ _id: { $in: ids } })
    .toArray();
  return new Map(organisations.map((organisation) => [String(organisation._id), String(organisation.name)]));
}

export interface CreateEnquiryInput {
  type: EnquiryType;
  listingId?: string;
  listingSlug?: string;
  listingName?: string;
  organisationId?: string;
  patientUserId?: ObjectId;
  patientName: string;
  contactMethod: "phone" | "email";
  email?: string;
  phone?: string;
  requestedService?: string;
  preferredDate?: string;
  message?: string;
}

export async function createEnquiry(input: CreateEnquiryInput): Promise<PublicEnquiry> {
  const db = await getDatabase();
  const now = new Date();
  const document: EnquiryDocument = {
    reference: reference(),
    type: input.type,
    listingId: toObjectId(input.listingId) ?? undefined,
    listingSlug: input.listingSlug,
    listingName: input.listingName,
    organisationId: toObjectId(input.organisationId) ?? undefined,
    patientUserId: input.patientUserId,
    patientName: input.patientName,
    contactMethod: input.contactMethod,
    email: input.email,
    phone: input.phone,
    requestedService: input.requestedService,
    preferredDate: input.preferredDate,
    message: input.message,
    consentVersion: ENQUIRY_CONSENT_VERSION,
    consentAt: now,
    status: "requested",
    statusHistory: [{ status: "requested", at: now, byUserId: input.patientUserId }],
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<EnquiryDocument>("enquiries").insertOne(document);

  let organisationName: string | undefined;
  if (document.organisationId) {
    const names = await organisationNames([document.organisationId]);
    organisationName = names.get(document.organisationId.toHexString());
  }

  return toPublicEnquiry({ ...document, _id: result.insertedId }, organisationName);
}

export async function listPatientEnquiries(userId: ObjectId): Promise<PublicEnquiry[]> {
  const db = await getDatabase();
  const enquiries = await db
    .collection<EnquiryDocument>("enquiries")
    .find({ patientUserId: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const names = await organisationNames(
    enquiries
      .map((enquiry) => enquiry.organisationId)
      .filter((value): value is ObjectId => Boolean(value)),
  );

  return enquiries.map((enquiry) =>
    toPublicEnquiry(
      enquiry as StoredEnquiry,
      enquiry.organisationId ? names.get(enquiry.organisationId.toHexString()) : undefined,
    ),
  );
}

export async function listOrganisationEnquiries(organisationId: ObjectId): Promise<PublicEnquiry[]> {
  const db = await getDatabase();
  const enquiries = await db
    .collection<EnquiryDocument>("enquiries")
    .find({ organisationId })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return enquiries.map((enquiry) => toPublicEnquiry(enquiry as StoredEnquiry));
}

export async function listAllEnquiries(): Promise<PublicEnquiry[]> {
  const db = await getDatabase();
  const enquiries = await db
    .collection<EnquiryDocument>("enquiries")
    .find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  const names = await organisationNames(
    enquiries
      .map((enquiry) => enquiry.organisationId)
      .filter((value): value is ObjectId => Boolean(value)),
  );
  return enquiries.map((enquiry) =>
    toPublicEnquiry(
      enquiry as StoredEnquiry,
      enquiry.organisationId ? names.get(enquiry.organisationId.toHexString()) : undefined,
    ),
  );
}

export type EnquiryDecision = Extract<EnquiryStatus, "accepted" | "declined" | "completed">;

export async function updateEnquiryStatus(params: {
  enquiryId: string | ObjectId;
  status: EnquiryStatus;
  actorUserId: ObjectId;
  note?: string;
  organisationId?: ObjectId;
}): Promise<PublicEnquiry | null> {
  const id = toObjectId(params.enquiryId);
  if (!id) return null;

  const db = await getDatabase();
  const query: Record<string, unknown> = { _id: id };
  // When provided, scope the update to the receiving organisation.
  if (params.organisationId) query.organisationId = params.organisationId;

  const enquiry = await db.collection<EnquiryDocument>("enquiries").findOne(query);
  if (!enquiry) return null;

  const now = new Date();
  await db.collection<EnquiryDocument>("enquiries").updateOne(
    { _id: id },
    {
      $set: { status: params.status, updatedAt: now },
      $push: {
        statusHistory: {
          status: params.status,
          at: now,
          byUserId: params.actorUserId,
          note: params.note,
        },
      },
    },
  );

  let organisationName: string | undefined;
  if (enquiry.organisationId) {
    const names = await organisationNames([enquiry.organisationId]);
    organisationName = names.get(enquiry.organisationId.toHexString());
  }

  return toPublicEnquiry(
    { ...enquiry, status: params.status, updatedAt: now },
    organisationName,
  );
}

/** Patients may access their own requests; staff of the receiving organisation may access theirs. */
export async function canAccessEnquiry(
  enquiryId: string | ObjectId,
  user: SessionUser,
): Promise<boolean> {
  if (user.isPlatformAdmin) return true;
  const id = toObjectId(enquiryId);
  if (!id) return false;

  const db = await getDatabase();
  const enquiry = await db.collection<EnquiryDocument>("enquiries").findOne({ _id: id });
  if (!enquiry) return false;

  if (enquiry.patientUserId && enquiry.patientUserId.toHexString() === user.id) return true;
  if (!enquiry.organisationId) return false;

  const membership = await db.collection("organisationMemberships").findOne({
    organisationId: enquiry.organisationId,
    userId: toObjectId(user.id) ?? new ObjectId(user.id),
    status: "active",
  });
  return Boolean(membership);
}
