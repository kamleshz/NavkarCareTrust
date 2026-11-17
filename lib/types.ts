import type { ObjectId } from "mongodb";

/* ------------------------------------------------------------------ */
/* Public directory categories                                         */
/* ------------------------------------------------------------------ */

export const resourceCategories = [
  "hospitals",
  "doctors",
  "blood-banks",
  "diagnostics",
  "medicine-assistance",
  "financial-aid",
] as const;

export type ResourceCategory = (typeof resourceCategories)[number];

export const categoryLabels: Record<ResourceCategory, string> = {
  hospitals: "Hospitals & Medical Centres",
  doctors: "Doctors",
  "blood-banks": "Blood Banks",
  diagnostics: "Diagnostics & Scans",
  "medicine-assistance": "Medicine Assistance",
  "financial-aid": "Financial Aid & Schemes",
};

/* ------------------------------------------------------------------ */
/* Browsing regions (configurable)                                     */
/* ------------------------------------------------------------------ */

export const mumbaiSubRegions = [
  "south-mumbai",
  "central-mumbai",
  "western-suburbs",
  "north-mumbai",
  "eastern-suburbs",
] as const;

export type MumbaiSubRegion = (typeof mumbaiSubRegions)[number];

export const regions = [
  { id: "all-mumbai", label: "All Mumbai" },
  { id: "south-mumbai", label: "South Mumbai" },
  { id: "central-mumbai", label: "Central Mumbai" },
  { id: "western-suburbs", label: "Western Suburbs" },
  { id: "north-mumbai", label: "North Mumbai" },
  { id: "eastern-suburbs", label: "Eastern Suburbs" },
] as const;

export type RegionId = (typeof regions)[number]["id"];

export const regionLabels = Object.fromEntries(
  regions.map((region) => [region.id, region.label]),
) as Record<RegionId, string>;

export function isRegionId(value: unknown): value is RegionId {
  return typeof value === "string" && regions.some((region) => region.id === value);
}

/** Narrows a value to a specific Mumbai browsing region (excludes "all-mumbai"). */
export function isMumbaiSubRegion(value: unknown): value is MumbaiSubRegion {
  return typeof value === "string" && mumbaiSubRegions.includes(value as MumbaiSubRegion);
}

/* ------------------------------------------------------------------ */
/* Organisation accounts                                               */
/* ------------------------------------------------------------------ */

export const organisationTypes = [
  "hospital",
  "doctor-practice",
  "blood-bank",
  "diagnostic-centre",
  "pharmacy",
  "pharmaceutical-company",
  "trust",
  "ngo",
] as const;

export type OrganisationType = (typeof organisationTypes)[number];

export const organisationTypeLabels: Record<OrganisationType, string> = {
  hospital: "Hospital or medical centre",
  "doctor-practice": "Doctor practice",
  "blood-bank": "Blood bank",
  "diagnostic-centre": "Diagnostic centre",
  pharmacy: "Pharmacy",
  "pharmaceutical-company": "Pharmaceutical company",
  trust: "Trust",
  ngo: "NGO",
};

export const defaultCategoryByOrganisationType: Record<OrganisationType, ResourceCategory> = {
  hospital: "hospitals",
  "doctor-practice": "doctors",
  "blood-bank": "blood-banks",
  "diagnostic-centre": "diagnostics",
  pharmacy: "medicine-assistance",
  "pharmaceutical-company": "medicine-assistance",
  trust: "financial-aid",
  ngo: "financial-aid",
};

export const membershipRoles = ["owner", "administrator", "staff"] as const;
export type MembershipRole = (typeof membershipRoles)[number];

export const membershipRoleLabels: Record<MembershipRole, string> = {
  owner: "Owner",
  administrator: "Administrator",
  staff: "Staff",
};

export type OrganisationRegistrationStatus = "pending" | "approved" | "rejected";
export type OrganisationVerificationStatus = "unverified" | "verified";
export type OrganisationPartnershipStatus = "none" | "confirmed";

export interface OrganisationDocument {
  _id?: ObjectId;
  slug: string;
  name: string;
  type: OrganisationType;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  registrationStatus: OrganisationRegistrationStatus;
  verificationStatus: OrganisationVerificationStatus;
  partnershipStatus: OrganisationPartnershipStatus;
  enquiriesEnabled: boolean;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganisationMembershipDocument {
  _id?: ObjectId;
  organisationId: ObjectId;
  userId: ObjectId;
  role: MembershipRole;
  status: "active" | "invited" | "disabled";
  invitedEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchDocument {
  _id?: ObjectId;
  organisationId: ObjectId;
  name: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  region?: MumbaiSubRegion;
  pinCode?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/* Users and sessions                                                  */
/* ------------------------------------------------------------------ */

export const accountTypes = ["patient", "organisation"] as const;
export type AccountType = (typeof accountTypes)[number];

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  accountTypes: AccountType[];
  isPlatformAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDocument {
  _id?: ObjectId;
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

/** Safe user shape for server components and client props (no ObjectId). */
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  accountTypes: AccountType[];
  isPlatformAdmin: boolean;
}

/* ------------------------------------------------------------------ */
/* Listings (directory records owned by organisations or imported)     */
/* ------------------------------------------------------------------ */

export const listingStatuses = ["draft", "pending-review", "published", "archived"] as const;
export type ListingStatus = (typeof listingStatuses)[number];

export const listingClaimStatuses = ["unclaimed", "claimed"] as const;
export type ListingClaimStatus = (typeof listingClaimStatuses)[number];

export interface StockStatus {
  level: string;
  updatedAt: Date;
}

export interface ProposedListingChange {
  submittedAt: Date;
  submittedByUserId?: ObjectId;
  fields: Partial<Pick<
    ResourceDocument,
    | "name"
    | "description"
    | "organisationType"
    | "specialty"
    | "services"
    | "locality"
    | "city"
    | "state"
    | "pinCode"
    | "region"
    | "contactDetails"
    | "officialUrl"
    | "eligibilitySummary"
  >>;
}

export interface ResourceDocument {
  _id?: ObjectId;
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
  coverage?: string;
  coverageType?: "local" | "national" | "participating-network" | "regional";
  actionLabel?: string;
  specialty?: string;
  services?: string[];
  affiliation?: string;
  contactDetails: {
    phone?: string;
    email?: string;
    address?: string;
    availabilityEnquiryUrl?: string;
  };
  officialUrl?: string;
  referenceUrl?: string;
  eligibilitySummary?: string;
  publicationStatus: ListingStatus;
  claimStatus: ListingClaimStatus;
  organisationId?: ObjectId;
  branchId?: ObjectId;
  enquiriesEnabled?: boolean;
  stockStatus?: StockStatus | null;
  proposedChanges?: ProposedListingChange | null;
  reviewNote?: string;
  lastReviewedAt: Date;
  isDemo?: boolean;
  seedBatch?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** JSON-safe listing shape passed to client components. */
export interface PublicResource {
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
  coverage?: string;
  coverageType?: string;
  actionLabel?: string;
  specialty?: string;
  services?: string[];
  affiliation?: string;
  contactDetails: {
    phone?: string;
    email?: string;
    address?: string;
    availabilityEnquiryUrl?: string;
  };
  officialUrl?: string;
  referenceUrl?: string;
  eligibilitySummary?: string;
  publicationStatus: ListingStatus;
  claimStatus: ListingClaimStatus;
  enquiriesEnabled: boolean;
  stockStatus?: { level: string; updatedAt: string } | null;
  lastReviewedAt: string;
  isDemo?: boolean;
}

/* ------------------------------------------------------------------ */
/* Listing claims                                                      */
/* ------------------------------------------------------------------ */

export interface ListingClaimDocument {
  _id?: ObjectId;
  listingId: ObjectId;
  listingSlug?: string;
  listingName: string;
  organisationId: ObjectId;
  requestedByUserId: ObjectId;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedByUserId?: ObjectId;
}

/* ------------------------------------------------------------------ */
/* Enquiries and appointment requests                                  */
/* ------------------------------------------------------------------ */

export const enquiryTypes = ["appointment", "diagnostic", "medicine", "financial-support"] as const;
export type EnquiryType = (typeof enquiryTypes)[number];

export const enquiryTypeLabels: Record<EnquiryType, string> = {
  appointment: "Request an appointment",
  diagnostic: "Enquire about diagnostic services",
  medicine: "Enquire about medicine assistance",
  "financial-support": "Request financial support information",
};

export const enquiryStatuses = ["requested", "accepted", "declined", "cancelled", "completed"] as const;
export type EnquiryStatus = (typeof enquiryStatuses)[number];

export const enquiryStatusLabels: Record<EnquiryStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
};

/** The enquiry action offered on a listing, based on its directory category. */
export function enquiryTypeForCategory(category: ResourceCategory): EnquiryType {
  switch (category) {
    case "diagnostics":
      return "diagnostic";
    case "medicine-assistance":
      return "medicine";
    case "financial-aid":
      return "financial-support";
    default:
      return "appointment";
  }
}

export interface EnquiryStatusEntry {
  status: EnquiryStatus;
  at: Date;
  byUserId?: ObjectId;
  note?: string;
}

export interface EnquiryDocument {
  _id?: ObjectId;
  reference: string;
  type: EnquiryType;
  listingId?: ObjectId;
  listingSlug?: string;
  listingName?: string;
  organisationId?: ObjectId;
  patientUserId?: ObjectId;
  patientName: string;
  contactMethod: "phone" | "email";
  email?: string;
  phone?: string;
  requestedService?: string;
  preferredDate?: string;
  message?: string;
  consentVersion: string;
  consentAt: Date;
  status: EnquiryStatus;
  statusHistory: EnquiryStatusEntry[];
  createdAt: Date;
  updatedAt: Date;
}

/** JSON-safe enquiry shape for client components. */
export interface PublicEnquiry {
  id: string;
  reference: string;
  type: EnquiryType;
  listingName?: string;
  organisationId?: string;
  organisationName?: string;
  patientName: string;
  contactMethod: "phone" | "email";
  email?: string;
  phone?: string;
  requestedService?: string;
  preferredDate?: string;
  message?: string;
  status: EnquiryStatus;
  appointmentConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Administrative audit log                                            */
/* ------------------------------------------------------------------ */

export interface AuditLogDocument {
  _id?: ObjectId;
  actorUserId?: ObjectId;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface PublicAuditEntry {
  id: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  summary: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Partner applications (legacy referral form)                         */
/* ------------------------------------------------------------------ */

export const partnerTypes = [
  "doctor",
  "hospital-or-cancer-institute",
  "pharmacy",
  "pharmaceutical-company",
  "ngo",
  "trust",
  "temple",
  "industry",
  "political-party",
  "government-or-other",
] as const;

export type PartnerType = (typeof partnerTypes)[number];

export const partnerTypeLabels: Record<PartnerType, string> = {
  doctor: "Doctor",
  "hospital-or-cancer-institute": "Hospital or cancer institute",
  pharmacy: "Pharmacy",
  "pharmaceutical-company": "Pharma",
  ngo: "NGO",
  trust: "Trust",
  temple: "Temple",
  industry: "Industry",
  "political-party": "Political party",
  "government-or-other": "Government or other organisation",
};

/* ------------------------------------------------------------------ */
/* Organisation applications (common QR registration flow)             */
/* ------------------------------------------------------------------ */

export const organisationApplicationTypes = [
  "pharma",
  "doctor",
  "trust",
  "ngo",
  "temple",
  "industry",
  "political_party",
] as const;

export type OrganisationApplicationType = (typeof organisationApplicationTypes)[number];

export const organisationApplicationTypeLabels: Record<OrganisationApplicationType, string> = {
  pharma: "Pharmaceutical Company",
  doctor: "Doctor",
  trust: "Trust",
  ngo: "NGO",
  temple: "Temple / Religious Institution",
  industry: "Industry / Business",
  political_party: "Political Party",
};

export type OrganisationApplicationStatus = "pending" | "approved" | "returned" | "rejected";

export interface OrganisationApplicationDocument {
  _id?: ObjectId;
  reference: string;
  organisationType: OrganisationApplicationType;
  source: "common_qr" | string;
  status: OrganisationApplicationStatus;
  reviewNote?: string;
  reviewedAt?: Date;
  reviewedByUserId?: ObjectId;
  // Common fields
  organisationName: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  serviceAreas?: string;
  supportOffered?: string;
  description?: string;
  consentAt: Date;
  // Type-specific details
  details: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganisationApplicationView {
  id: string;
  reference: string;
  organisationType: OrganisationApplicationType;
  status: OrganisationApplicationStatus;
  reviewNote?: string;
  organisationName: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  serviceAreas?: string;
  supportOffered?: string;
  description?: string;
  details: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
