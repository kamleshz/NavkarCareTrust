import { z } from "zod";
import {
  enquiryTypes,
  membershipRoles,
  mumbaiSubRegions,
  organisationApplicationTypes,
  organisationTypes,
  partnerTypes,
  resourceCategories,
  type MumbaiSubRegion,
} from "@/lib/types";

const optionalContact = z
  .string()
  .trim()
  .max(120)
  .transform((value) => value || undefined);

const phoneField = optionalContact.refine(
  (value) => !value || /^[+()\d\s-]{7,20}$/.test(value),
  "Enter a valid phone number",
);

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined);

const regionField = optionalText.transform((value): MumbaiSubRegion | undefined =>
  value && (mumbaiSubRegions as readonly string[]).includes(value)
    ? (value as MumbaiSubRegion)
    : undefined,
);

const servicesField = z
  .string()
  .trim()
  .max(400)
  .transform((value) =>
    value
      ? value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12)
      : [],
  );

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200, "Password is too long");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password").max(200),
});

export const patientRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  phone: phoneField,
  password: passwordSchema,
  consent: z.literal("yes", { message: "Please accept the privacy consent" }),
});

export const organisationRegistrationSchema = z.object({
  organisationName: z.string().trim().min(2, "Enter the organisation name").max(160),
  type: z.enum(organisationTypes, { message: "Choose an organisation type" }),
  description: z.string().trim().max(1000).transform((value) => value || undefined),
  city: z.string().trim().min(2, "Enter a city").max(100),
  state: z.string().trim().min(2, "Enter a state").max(100),
  contactPerson: z.string().trim().min(2, "Enter a contact person").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  phone: phoneField,
  website: optionalText.refine(
    (value) => !value || /^https?:\/\//.test(value),
    "Website must start with http:// or https://",
  ),
  password: passwordSchema,
  consent: z.literal("yes", { message: "Please accept the privacy consent" }),
});

/* ------------------------------------------------------------------ */
/* Organisation profile, branches, members                             */
/* ------------------------------------------------------------------ */

export const organisationProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter the organisation name").max(160),
  description: z.string().trim().max(1000).transform((value) => value || undefined),
  email: optionalContact.pipe(z.email().optional()),
  phone: phoneField,
  website: optionalText.refine(
    (value) => !value || /^https?:\/\//.test(value),
    "Website must start with http:// or https://",
  ),
  enquiriesEnabled: z.literal("on").optional(),
});

export const branchSchema = z.object({
  name: z.string().trim().min(2, "Enter a branch name").max(160),
  address: optionalText,
  locality: optionalText,
  city: optionalText,
  state: optionalText,
  region: regionField,
  pinCode: optionalText.refine(
    (value) => !value || /^\d{6}$/.test(value),
    "Enter a 6-digit PIN code",
  ),
  phone: phoneField,
  email: optionalContact.pipe(z.email().optional()),
});

export const memberInviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  role: z.enum(membershipRoles),
});

/* ------------------------------------------------------------------ */
/* Listings                                                            */
/* ------------------------------------------------------------------ */

export const listingSchema = z.object({
  name: z.string().trim().min(2, "Enter a listing name").max(200),
  category: z.enum(resourceCategories, { message: "Choose a category" }),
  organisationType: z.string().trim().min(2, "Enter an organisation type").max(120),
  description: z.string().trim().min(10, "Add a short description").max(1200),
  specialty: optionalText,
  services: servicesField.optional(),
  locality: optionalText,
  city: optionalText,
  state: optionalText,
  region: regionField,
  pinCode: optionalText.refine(
    (value) => !value || /^\d{6}$/.test(value),
    "Enter a 6-digit PIN code",
  ),
  phone: phoneField,
  email: optionalContact.pipe(z.email().optional()),
  address: optionalText,
  officialUrl: optionalText.refine(
    (value) => !value || /^https?:\/\//.test(value),
    "Website must start with http:// or https://",
  ),
  eligibilitySummary: optionalText,
  branchId: optionalText,
  enquiriesEnabled: z.literal("on").optional(),
});

/* ------------------------------------------------------------------ */
/* Enquiries                                                           */
/* ------------------------------------------------------------------ */

export const enquirySchema = z
  .object({
    type: z.enum(enquiryTypes),
    listingId: optionalText,
    listingSlug: optionalText,
    listingName: optionalText,
    organisationId: optionalText,
    patientName: z.string().trim().min(2, "Enter your name").max(120),
    contactMethod: z.enum(["phone", "email"]),
    email: optionalContact.pipe(z.email().optional()),
    phone: phoneField,
    requestedService: optionalText,
    preferredDate: optionalText,
    message: z.string().trim().max(600).transform((value) => value || undefined),
    consent: z.literal("yes", { message: "Please confirm you agree to share this request" }),
  })
  .superRefine((data, context) => {
    if (data.contactMethod === "phone" && !data.phone) {
      context.addIssue({
        code: "custom",
        message: "Add a phone number for your preferred contact method",
        path: ["phone"],
      });
    }
    if (data.contactMethod === "email" && !data.email) {
      context.addIssue({
        code: "custom",
        message: "Add an email address for your preferred contact method",
        path: ["email"],
      });
    }
  });

/* ------------------------------------------------------------------ */
/* Admin actions                                                       */
/* ------------------------------------------------------------------ */

export const adminReviewSchema = z.object({
  reason: z.string().trim().min(3, "Add a reason").max(600),
});

export const regionAssignmentSchema = z.object({
  listingId: z.string().trim().min(1),
  region: z.enum(mumbaiSubRegions).or(z.literal("")),
});

/* ------------------------------------------------------------------ */
/* Legacy forms (kept working)                                         */
/* ------------------------------------------------------------------ */

export const partnerApplicationSchema = z
  .object({
    organisationName: z.string().trim().min(2).max(160),
    partnerType: z.enum(partnerTypes),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    contactPerson: z.string().trim().min(2).max(120),
    email: optionalContact.pipe(z.email().optional()),
    phone: phoneField,
    note: z.string().trim().max(1000).transform((value) => value || undefined),
  })
  .refine((data) => data.email || data.phone, {
    message: "Add a work email or phone number",
    path: ["email"],
  });

export const patientSupportRequestSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().max(100).transform((value) => value || undefined),
    preferredContact: z.enum(["phone", "email"]),
    email: optionalContact.pipe(z.email().optional()),
    phone: phoneField,
    note: z.string().trim().max(500).transform((value) => value || undefined),
    consent: z.literal("yes"),
  })
  .superRefine((data, context) => {
    if (data.preferredContact === "phone" && !data.phone) {
      context.addIssue({
        code: "custom",
        message: "Add a phone number for your preferred contact method",
        path: ["phone"],
      });
    }
    if (data.preferredContact === "email" && !data.email) {
      context.addIssue({
        code: "custom",
        message: "Add an email address for your preferred contact method",
        path: ["email"],
      });
    }
  });

export type PartnerApplicationInput = z.infer<typeof partnerApplicationSchema>;
export type PatientSupportRequestInput = z.infer<typeof patientSupportRequestSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;
export type OrganisationRegistrationInput = z.infer<typeof organisationRegistrationSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type BranchInput = z.infer<typeof branchSchema>;
export type MemberInviteInput = z.infer<typeof memberInviteSchema>;

/* ------------------------------------------------------------------ */
/* Organisation applications (common QR flow)                          */
/* ------------------------------------------------------------------ */

const pinField = optionalText.refine(
  (value) => !value || /^\d{6}$/.test(value),
  "Enter a 6-digit PIN code",
);

/** Common fields shared by every organisation type. */
const commonOrgApplication = {
  organisationName: z.string().trim().min(2, "Enter the organisation or full name").max(200),
  contactPerson: z
    .string()
    .trim()
    .max(160)
    .transform((value) => value || undefined),
  mobile: phoneField,
  email: optionalContact.pipe(z.email().optional()),
  address: z.string().trim().max(400).transform((value) => value || undefined),
  city: z.string().trim().min(2, "Enter a city").max(100),
  state: z.string().trim().min(2, "Enter a state").max(100),
  pinCode: pinField,
  serviceAreas: z.string().trim().max(400).transform((value) => value || undefined),
  supportOffered: z.string().trim().max(500).transform((value) => value || undefined),
  description: z.string().trim().max(600).transform((value) => value || undefined),
};

/** Type-specific field keys accepted in the `details` map. */
const typeSpecificKeys: Record<string, string[]> = {
  pharma: ["companyName", "medicinesOffered", "programmeEligibility", "applicationProcess"],
  doctor: ["specialty", "registrationNumber", "council", "affiliation", "consultationSupport"],
  trust: ["trustName", "registrationNumber", "assistanceOffered", "eligibilityConditions"],
  ngo: ["ngoName", "registrationNumber", "focusAreas", "assistanceOffered"],
  temple: ["institutionName", "location", "availableSupport"],
  industry: ["companyName", "industrySector", "proposedSupport"],
  political_party: ["partyName", "localUnit", "serviceRegion", "patientSupportActivities"],
};

export const organisationApplicationSchema = z
  .object({
    organisationType: z.enum(organisationApplicationTypes, { message: "Choose how you would like to participate" }),
    ...commonOrgApplication,
    details: z.record(z.string(), z.string()).default({}),
    consent: z.literal("yes", { message: "Please accept the privacy consent" }),
  })
  .superRefine((data, context) => {
    // At least one contact method is required.
    if (!data.mobile && !data.email) {
      context.addIssue({
        code: "custom",
        message: "Add a mobile number or email address",
        path: ["mobile"],
      });
    }
    // Contact person is required for organisation types (not for individual doctors).
    if (data.organisationType !== "doctor" && !data.contactPerson) {
      context.addIssue({
        code: "custom",
        message: "Enter a contact person",
        path: ["contactPerson"],
      });
    }
    // Trim type-specific details to the keys allowed for this type.
    const allowed = typeSpecificKeys[data.organisationType] ?? [];
    for (const key of Object.keys(data.details)) {
      if (!allowed.includes(key)) delete data.details[key];
    }
  });

export type OrganisationApplicationInput = z.infer<typeof organisationApplicationSchema>;
