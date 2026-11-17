"use server";

import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/dal";
import { createOrganisationApplication } from "@/lib/organisation-applications";
import { allTypeSpecificFieldNames } from "@/lib/organisation-application-config";
import { toObjectId } from "@/lib/object-id";
import { organisationApplicationSchema } from "@/lib/validation";
import type { OrganisationApplicationFormState } from "@/lib/action-state";

export async function submitOrganisationApplication(
  _previousState: OrganisationApplicationFormState,
  formData: FormData,
): Promise<OrganisationApplicationFormState> {
  const details: Record<string, string> = {};
  for (const name of allTypeSpecificFieldNames) {
    const value = formData.get(name);
    if (typeof value === "string" && value.trim()) {
      details[name] = value.trim();
    }
  }

  const result = organisationApplicationSchema.safeParse({
    organisationType: formData.get("organisationType"),
    organisationName: formData.get("organisationName"),
    contactPerson: formData.get("contactPerson"),
    mobile: formData.get("mobile"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    pinCode: formData.get("pinCode"),
    serviceAreas: formData.get("serviceAreas"),
    supportOffered: formData.get("supportOffered"),
    description: formData.get("description"),
    details,
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
    const outcome = await createOrganisationApplication(result.data);
    if (!outcome.created) {
      return {
        success: true,
        reference: outcome.reference,
        message:
          "A registration with these details already exists. Your reference is below — no duplicate was created.",
      };
    }

    revalidatePath("/admin/registrations");
    revalidatePath("/admin");
    return {
      success: true,
      reference: outcome.reference,
      message: "Thank you. Your registration has been received and is pending review.",
    };
  } catch (error) {
    console.error("Unable to save organisation application", error);
    return {
      success: false,
      message: "We could not save your registration right now. Please try again shortly.",
    };
  }
}

export async function reviewOrganisationApplicationAction(
  _previousState: OrganisationApplicationFormState,
  formData: FormData,
): Promise<OrganisationApplicationFormState> {
  const user = await getCurrentUser();
  if (!user?.isPlatformAdmin) {
    return { success: false, message: "Administrator access required." };
  }

  const id = String(formData.get("applicationId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (action !== "approve" && action !== "return" && action !== "reject") {
    return { success: false, message: "Choose a valid review action." };
  }
  if (action !== "approve" && reason.length < 3) {
    return { success: false, message: "Add a reason for this decision." };
  }

  const { reviewOrganisationApplication } = await import("@/lib/organisation-applications");
  const application = await reviewOrganisationApplication(id, action, reason, user.id);
  if (!application) return { success: false, message: "Registration not found." };

  const summaryMap = {
    approve: "Organisation registration approved.",
    return: "Organisation registration returned for correction.",
    reject: "Organisation registration rejected.",
  } as const;

  await recordAudit({
    actorUserId: toObjectId(user.id) ?? undefined,
    actorEmail: user.email,
    action: `organisation-application.${action}`,
    entityType: "organisation-application",
    entityId: id,
    summary: summaryMap[action],
    metadata: reason ? { reason } : undefined,
  });

  revalidatePath("/admin/registrations");
  revalidatePath("/admin");
  return { success: true, message: summaryMap[action] };
}
