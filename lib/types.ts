export const resourceCategories = [
  "hospitals",
  "doctors",
  "medicine-assistance",
  "financial-aid",
] as const;

export type ResourceCategory = (typeof resourceCategories)[number];

export const categoryLabels: Record<ResourceCategory, string> = {
  hospitals: "Hospitals & Cancer Centres",
  doctors: "Doctors & Specialists",
  "medicine-assistance": "Medicine Assistance",
  "financial-aid": "Financial Aid & Government Schemes",
};

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

export interface ResourceDocument {
  slug?: string;
  name: string;
  category: ResourceCategory;
  organisationType: string;
  description: string;
  city?: string;
  state?: string;
  locality?: string;
  pinCode?: string;
  coverage?: string;
  coverageType?: "local" | "national" | "participating-network" | "regional";
  actionLabel?: string;
  specialty?: string;
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
  publicationStatus: "draft" | "published" | "archived";
  lastReviewedAt: Date;
  isDemo?: boolean;
}

export interface PublicResource extends Omit<ResourceDocument, "lastReviewedAt"> {
  id: string;
  lastReviewedAt: string;
}
