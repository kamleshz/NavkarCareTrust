import type { OrganisationApplicationType } from "@/lib/types";

export interface TypeSpecificField {
  name: string;
  label: string;
  placeholder?: string;
  textarea?: boolean;
  optional?: boolean;
}

/** Type-specific field definitions. Keys must match `typeSpecificKeys` in validation.ts. */
export const typeSpecificFields: Record<OrganisationApplicationType, TypeSpecificField[]> = {
  pharma: [
    { name: "companyName", label: "Company name" },
    { name: "medicinesOffered", label: "Medicines or assistance programmes offered", textarea: true },
    { name: "programmeEligibility", label: "Programme eligibility", textarea: true, optional: true },
    { name: "applicationProcess", label: "Application process", textarea: true, optional: true },
  ],
  doctor: [
    { name: "specialty", label: "Specialty" },
    { name: "registrationNumber", label: "Medical registration number" },
    { name: "council", label: "Medical council" },
    { name: "affiliation", label: "Hospital or clinic affiliation" },
    { name: "consultationSupport", label: "Consultation support offered", textarea: true, optional: true },
  ],
  trust: [
    { name: "trustName", label: "Trust name" },
    { name: "registrationNumber", label: "Registration number", optional: true },
    { name: "assistanceOffered", label: "Assistance offered", textarea: true },
    { name: "eligibilityConditions", label: "Eligibility conditions", textarea: true, optional: true },
  ],
  ngo: [
    { name: "ngoName", label: "NGO name" },
    { name: "registrationNumber", label: "Registration number", optional: true },
    { name: "focusAreas", label: "Focus areas", textarea: true },
    { name: "assistanceOffered", label: "Assistance offered", textarea: true },
  ],
  temple: [
    { name: "institutionName", label: "Institution name" },
    { name: "location", label: "Location" },
    { name: "availableSupport", label: "Available support (meals, accommodation, transport, financial assistance)", textarea: true },
  ],
  industry: [
    { name: "companyName", label: "Company name" },
    { name: "industrySector", label: "Industry sector" },
    { name: "proposedSupport", label: "Proposed support (CSR, volunteering, supplies, logistics)", textarea: true },
  ],
  political_party: [
    { name: "partyName", label: "Party name" },
    { name: "localUnit", label: "Local unit or office" },
    { name: "serviceRegion", label: "Service region" },
    { name: "patientSupportActivities", label: "Patient-support activities offered", textarea: true },
  ],
};

/** All type-specific field names across every type (used by the server action to collect details). */
export const allTypeSpecificFieldNames = Array.from(
  new Set(Object.values(typeSpecificFields).flatMap((fields) => fields.map((field) => field.name))),
);
