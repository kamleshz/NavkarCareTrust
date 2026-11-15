"use server";

import { getDatabase } from "@/lib/mongodb";
import { partnerApplicationSchema } from "@/lib/validation";

export interface ApplicationFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export const initialApplicationState: ApplicationFormState = {
  success: false,
  message: "",
};

export async function submitPartnerApplication(
  _previousState: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const result = partnerApplicationSchema.safeParse({
    organisationName: formData.get("organisationName"),
    partnerType: formData.get("partnerType"),
    city: formData.get("city"),
    state: formData.get("state"),
    contactPerson: formData.get("contactPerson"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    note: formData.get("note"),
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
    const db = await getDatabase();
    await db.collection("partnerApplications").insertOne({
      ...result.data,
      reviewStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      message:
        "Thank you. Your application has been received and is pending review.",
    };
  } catch (error) {
    console.error("Unable to save partner application", error);
    return {
      success: false,
      message:
        "We could not save your application right now. Please try again shortly.",
    };
  }
}
