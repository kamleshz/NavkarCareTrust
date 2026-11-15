"use server";

import { getDatabase } from "@/lib/mongodb";
import { patientSupportRequestSchema } from "@/lib/validation";

export interface PatientSupportFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export const initialPatientSupportState: PatientSupportFormState = {
  success: false,
  message: "",
};

const receivedMessage =
  "Your request has been received and is waiting for review by our team.";

export async function submitPatientSupportRequest(
  _previousState: PatientSupportFormState,
  formData: FormData,
): Promise<PatientSupportFormState> {
  // Ignore automated submissions that fill the visually-hidden honeypot.
  if (typeof formData.get("website") === "string" && formData.get("website")) {
    return { success: true, message: receivedMessage };
  }

  const result = patientSupportRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    city: formData.get("city"),
    state: formData.get("state"),
    preferredContact: formData.get("preferredContact"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    note: formData.get("note"),
    consent: formData.get("consent"),
  });

  if (!result.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();
    const { consent, ...requestData } = result.data;
    const db = await getDatabase();

    await db.collection("patientSupportRequests").insertOne({
      ...requestData,
      privacyConsent: consent === "yes",
      consentVersion: "patient-support-contact-v1",
      consentAt: now,
      reviewStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, message: receivedMessage };
  } catch {
    console.error("Unable to save patient support request");
    return {
      success: false,
      message:
        "We could not save your request right now. Please try again shortly.",
    };
  }
}
