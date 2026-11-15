import { z } from "zod";
import { partnerTypes } from "@/lib/types";

const optionalContact = z
  .string()
  .trim()
  .max(120)
  .transform((value) => value || undefined);

export const partnerApplicationSchema = z
  .object({
    organisationName: z.string().trim().min(2).max(160),
    partnerType: z.enum(partnerTypes),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    contactPerson: z.string().trim().min(2).max(120),
    email: optionalContact.pipe(z.email().optional()),
    phone: optionalContact.refine(
      (value) => !value || /^[+()\d\s-]{7,20}$/.test(value),
      "Enter a valid phone number",
    ),
    note: z
      .string()
      .trim()
      .max(1000)
      .transform((value) => value || undefined),
  })
  .refine((data) => data.email || data.phone, {
    message: "Add a work email or phone number",
    path: ["email"],
  });

export type PartnerApplicationInput = z.infer<
  typeof partnerApplicationSchema
>;
