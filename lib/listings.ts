import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import type {
  ListingClaimDocument,
  ListingStatus,
  MumbaiSubRegion,
  ProposedListingChange,
  PublicResource,
  ResourceCategory,
  ResourceDocument,
} from "@/lib/types";

export interface ManagedListing {
  id: string;
  slug?: string;
  name: string;
  category: ResourceCategory;
  organisationType: string;
  description: string;
  locality?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  region?: MumbaiSubRegion;
  specialty?: string;
  services: string[];
  contactDetails: ResourceDocument["contactDetails"];
  officialUrl?: string;
  eligibilitySummary?: string;
  publicationStatus: ListingStatus;
  claimStatus: ResourceDocument["claimStatus"];
  reviewPending: boolean;
  reviewNote?: string;
  organisationId?: string;
  branchId?: string;
  enquiriesEnabled: boolean;
  stockLevel?: string;
  stockUpdatedAt?: string;
  lastReviewedAt: string;
}

type StoredListing = ResourceDocument & { _id: ObjectId };

export function normalizeListingStatus(document: ResourceDocument): ListingStatus {
  return document.publicationStatus ?? "draft";
}

export function toManagedListing(document: StoredListing): ManagedListing {
  return {
    id: document._id.toHexString(),
    slug: document.slug,
    name: document.name,
    category: document.category,
    organisationType: document.organisationType,
    description: document.description,
    locality: document.locality,
    city: document.city,
    state: document.state,
    pinCode: document.pinCode,
    region: document.region,
    specialty: document.specialty,
    services: document.services ?? [],
    contactDetails: document.contactDetails ?? {},
    officialUrl: document.officialUrl,
    eligibilitySummary: document.eligibilitySummary,
    publicationStatus: normalizeListingStatus(document),
    claimStatus: document.claimStatus ?? "unclaimed",
    reviewPending: Boolean(document.proposedChanges),
    reviewNote: document.reviewNote,
    organisationId: document.organisationId?.toHexString(),
    branchId: document.branchId?.toHexString(),
    enquiriesEnabled: Boolean(document.enquiriesEnabled),
    stockLevel: document.stockStatus?.level,
    stockUpdatedAt: document.stockStatus?.updatedAt?.toISOString(),
    lastReviewedAt: (document.lastReviewedAt ?? document.updatedAt ?? new Date()).toISOString(),
  };
}

export function toPublicResource(document: StoredListing): PublicResource {
  return {
    id: document._id.toHexString(),
    slug: document.slug,
    name: document.name,
    category: document.category,
    organisationType: document.organisationType,
    description: document.description,
    locality: document.locality,
    city: document.city,
    state: document.state,
    pinCode: document.pinCode,
    region: document.region,
    coverage: document.coverage,
    coverageType: document.coverageType,
    actionLabel: document.actionLabel,
    specialty: document.specialty,
    services: document.services ?? [],
    affiliation: document.affiliation,
    contactDetails: document.contactDetails ?? {},
    officialUrl: document.officialUrl,
    referenceUrl: document.referenceUrl,
    eligibilitySummary: document.eligibilitySummary,
    publicationStatus: normalizeListingStatus(document),
    claimStatus: document.claimStatus ?? "unclaimed",
    enquiriesEnabled: Boolean(document.enquiriesEnabled),
    stockStatus: document.stockStatus
      ? { level: document.stockStatus.level, updatedAt: document.stockStatus.updatedAt.toISOString() }
      : null,
    lastReviewedAt: (document.lastReviewedAt ?? document.updatedAt ?? new Date()).toISOString(),
    isDemo: document.isDemo,
  };
}

export async function listOrganisationListings(organisationId: ObjectId): Promise<ManagedListing[]> {
  const db = await getDatabase();
  const documents = await db
    .collection<ResourceDocument>("resources")
    .find({ organisationId })
    .sort({ updatedAt: -1 })
    .toArray();
  return documents.map((document) => toManagedListing(document as StoredListing));
}

export async function getManagedListing(
  organisationId: ObjectId,
  listingId: string | ObjectId,
): Promise<ManagedListing | null> {
  const id = toObjectId(listingId);
  if (!id) return null;
  const db = await getDatabase();
  const document = await db
    .collection<ResourceDocument>("resources")
    .findOne({ _id: id, organisationId });
  return document ? toManagedListing(document as StoredListing) : null;
}

export async function listListingsByStatus(status: ListingStatus): Promise<ManagedListing[]> {
  const db = await getDatabase();
  const documents = await db
    .collection<ResourceDocument>("resources")
    .find({ publicationStatus: status, isDemo: { $ne: true } })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();
  return documents.map((document) => toManagedListing(document as StoredListing));
}

export async function listListingsWithProposedChanges(): Promise<ManagedListing[]> {
  const db = await getDatabase();
  const documents = await db
    .collection<ResourceDocument>("resources")
    .find({ "proposedChanges.submittedAt": { $exists: true }, isDemo: { $ne: true } })
    .sort({ "proposedChanges.submittedAt": 1 })
    .limit(200)
    .toArray();
  return documents.map((document) => toManagedListing(document as StoredListing));
}

/** Imported listings that no organisation has claimed yet. */
export async function listUnclaimedListings(term = ""): Promise<ManagedListing[]> {
  const db = await getDatabase();
  const trimmed = term.trim();
  const query: Record<string, unknown> = { claimStatus: "unclaimed", isDemo: { $ne: true } };
  if (trimmed) {
    const pattern = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: pattern, $options: "i" } },
      { city: { $regex: pattern, $options: "i" } },
      { locality: { $regex: pattern, $options: "i" } },
    ];
  }
  const documents = await db
    .collection<ResourceDocument>("resources")
    .find(query)
    .sort({ name: 1 })
    .limit(100)
    .toArray();
  return documents.map((document) => toManagedListing(document as StoredListing));
}

export async function searchListingsForAdmin(term: string): Promise<ManagedListing[]> {
  const db = await getDatabase();
  const trimmed = term.trim();
  const query: Record<string, unknown> = { isDemo: { $ne: true } };
  if (trimmed) {
    const pattern = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: pattern, $options: "i" } },
      { city: { $regex: pattern, $options: "i" } },
      { locality: { $regex: pattern, $options: "i" } },
      { slug: { $regex: pattern, $options: "i" } },
    ];
  }
  const documents = await db
    .collection<ResourceDocument>("resources")
    .find(query)
    .sort({ updatedAt: -1 })
    .limit(100)
    .toArray();
  return documents.map((document) => toManagedListing(document as StoredListing));
}

export interface ListingInput {
  name: string;
  category: ResourceCategory;
  organisationType: string;
  description: string;
  locality?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  region?: MumbaiSubRegion;
  specialty?: string;
  services?: string[];
  contactDetails: ResourceDocument["contactDetails"];
  officialUrl?: string;
  eligibilitySummary?: string;
  branchId?: ObjectId;
  enquiriesEnabled?: boolean;
}

export async function createListingForOrganisation(
  organisationId: ObjectId,
  slug: string,
  input: ListingInput,
): Promise<{ id: string; slug: string }> {
  const db = await getDatabase();
  const now = new Date();
  const result = await db.collection<ResourceDocument>("resources").insertOne({
    ...input,
    slug,
    publicationStatus: "draft",
    claimStatus: "claimed",
    organisationId,
    branchId: input.branchId,
    stockStatus: null,
    proposedChanges: null,
    lastReviewedAt: now,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toHexString(), slug };
}

export type ListingMutationResult =
  | { ok: true; status: ListingStatus; pendingReview: boolean }
  | { ok: false; reason: "not-found" };

/**
 * Applies organisation edits. Published listings keep their live version and
 * only store the proposed change until an administrator reviews it.
 */
export async function updateListingFields(params: {
  organisationId: ObjectId;
  listingId: string | ObjectId;
  fields: ProposedListingChange["fields"];
  userId: ObjectId;
}): Promise<ListingMutationResult> {
  const id = toObjectId(params.listingId);
  if (!id) return { ok: false, reason: "not-found" };

  const db = await getDatabase();
  const listing = await db
    .collection<ResourceDocument>("resources")
    .findOne({ _id: id, organisationId: params.organisationId });
  if (!listing) return { ok: false, reason: "not-found" };

  const now = new Date();

  if (normalizeListingStatus(listing) === "published") {
    const proposed: ProposedListingChange = {
      submittedAt: now,
      submittedByUserId: params.userId,
      fields: { ...(listing.proposedChanges?.fields ?? {}), ...params.fields },
    };
    await db.collection<ResourceDocument>("resources").updateOne(
      { _id: id },
      { $set: { proposedChanges: proposed, updatedAt: now } },
    );
    return { ok: true, status: "published", pendingReview: true };
  }

  await db.collection<ResourceDocument>("resources").updateOne(
    { _id: id },
    {
      $set: {
        ...params.fields,
        publicationStatus: "pending-review",
        reviewNote: undefined,
        updatedAt: now,
      },
    },
  );
  return { ok: true, status: "pending-review", pendingReview: false };
}

export async function submitListingForReview(
  organisationId: ObjectId,
  listingId: string | ObjectId,
): Promise<ListingMutationResult> {
  const id = toObjectId(listingId);
  if (!id) return { ok: false, reason: "not-found" };
  const db = await getDatabase();
  const result = await db.collection<ResourceDocument>("resources").updateOne(
    { _id: id, organisationId, publicationStatus: { $in: ["draft", "archived"] } },
    { $set: { publicationStatus: "pending-review", reviewNote: undefined, updatedAt: new Date() } },
  );
  if (!result.matchedCount) return { ok: false, reason: "not-found" };
  return { ok: true, status: "pending-review", pendingReview: false };
}

export async function updateListingStock(
  organisationId: ObjectId,
  listingId: string | ObjectId,
  level: string,
): Promise<boolean> {
  const id = toObjectId(listingId);
  if (!id) return false;
  const db = await getDatabase();
  const now = new Date();
  const result = await db.collection<ResourceDocument>("resources").updateOne(
    { _id: id, organisationId },
    { $set: { stockStatus: { level, updatedAt: now }, updatedAt: now } },
  );
  return result.matchedCount > 0;
}

/* ------------------------------------------------------------------ */
/* Administrative review                                               */
/* ------------------------------------------------------------------ */

export async function publishListing(listingId: string | ObjectId): Promise<boolean> {
  const id = toObjectId(listingId);
  if (!id) return false;
  const db = await getDatabase();
  const now = new Date();
  const listing = await db.collection<ResourceDocument>("resources").findOne({ _id: id });
  if (!listing) return false;

  const proposed = listing.proposedChanges?.fields ?? {};
  await db.collection<ResourceDocument>("resources").updateOne(
    { _id: id },
    {
      $set: {
        ...proposed,
        proposedChanges: null,
        publicationStatus: "published",
        reviewNote: undefined,
        lastReviewedAt: now,
        updatedAt: now,
      },
    },
  );
  return true;
}

export async function returnListing(
  listingId: string | ObjectId,
  reason: string,
): Promise<boolean> {
  const id = toObjectId(listingId);
  if (!id) return false;
  const db = await getDatabase();
  const now = new Date();
  const listing = await db.collection<ResourceDocument>("resources").findOne({ _id: id });
  if (!listing) return false;

  const wasPublished = normalizeListingStatus(listing) === "published";
  await db.collection<ResourceDocument>("resources").updateOne(
    { _id: id },
    {
      $set: {
        proposedChanges: null,
        // A published listing stays live; only the proposal is returned.
        publicationStatus: wasPublished ? "published" : "draft",
        reviewNote: reason,
        updatedAt: now,
      },
    },
  );
  return true;
}

/* ------------------------------------------------------------------ */
/* Listing claims                                                      */
/* ------------------------------------------------------------------ */

export interface ClaimView {
  id: string;
  listingId: string;
  listingName: string;
  organisationId: string;
  organisationName?: string;
  status: ListingClaimDocument["status"];
  reviewNote?: string;
  createdAt: string;
}

export async function createListingClaim(params: {
  listingId: string | ObjectId;
  organisationId: ObjectId;
  userId: ObjectId;
}): Promise<"created" | "duplicate" | "not-found"> {
  const id = toObjectId(params.listingId);
  if (!id) return "not-found";

  const db = await getDatabase();
  const listing = await db.collection<ResourceDocument>("resources").findOne({ _id: id });
  if (!listing) return "not-found";
  if (listing.organisationId && listing.claimStatus === "claimed") return "duplicate";

  const existing = await db.collection<ListingClaimDocument>("listingClaims").findOne({
    listingId: id,
    organisationId: params.organisationId,
    status: { $in: ["pending", "approved"] },
  });
  if (existing) return "duplicate";

  await db.collection<ListingClaimDocument>("listingClaims").insertOne({
    listingId: id,
    listingSlug: listing.slug,
    listingName: listing.name,
    organisationId: params.organisationId,
    requestedByUserId: params.userId,
    status: "pending",
    createdAt: new Date(),
  });
  return "created";
}

export async function listPendingClaims(): Promise<ClaimView[]> {
  const db = await getDatabase();
  const claims = await db
    .collection<ListingClaimDocument>("listingClaims")
    .find({ status: "pending" })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray();

  const organisations = await db
    .collection("organisations")
    .find({ _id: { $in: claims.map((claim) => claim.organisationId) } })
    .toArray();
  const nameById = new Map(
    organisations.map((organisation) => [
      String(organisation._id),
      String((organisation as { name?: string }).name ?? ""),
    ]),
  );

  return claims.map((claim) => ({
    id: claim._id!.toHexString(),
    listingId: claim.listingId.toHexString(),
    listingName: claim.listingName,
    organisationId: claim.organisationId.toHexString(),
    organisationName: nameById.get(claim.organisationId.toHexString()),
    status: claim.status,
    reviewNote: claim.reviewNote,
    createdAt: claim.createdAt.toISOString(),
  }));
}

export async function reviewClaim(params: {
  claimId: string | ObjectId;
  decision: "approved" | "rejected";
  note?: string;
  actorUserId: ObjectId;
}): Promise<ClaimView | null> {
  const id = toObjectId(params.claimId);
  if (!id) return null;
  const db = await getDatabase();
  const claim = await db.collection<ListingClaimDocument>("listingClaims").findOne({ _id: id });
  if (!claim) return null;

  const now = new Date();
  await db.collection<ListingClaimDocument>("listingClaims").updateOne(
    { _id: id },
    {
      $set: {
        status: params.decision,
        reviewNote: params.note,
        reviewedAt: now,
        reviewedByUserId: params.actorUserId,
      },
    },
  );

  if (params.decision === "approved") {
    await db.collection<ResourceDocument>("resources").updateOne(
      { _id: claim.listingId },
      { $set: { organisationId: claim.organisationId, claimStatus: "claimed", updatedAt: now } },
    );
  }

  return {
    id: claim._id!.toHexString(),
    listingId: claim.listingId.toHexString(),
    listingName: claim.listingName,
    organisationId: claim.organisationId.toHexString(),
    status: params.decision,
    reviewNote: params.note,
    createdAt: claim.createdAt.toISOString(),
  };
}
