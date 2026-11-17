"use server";

import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import { getCurrentUser, getCurrentUserId } from "@/lib/auth/dal";
import { getOrganisationContext } from "@/lib/auth/guards";
import { createEnquiry, updateEnquiryStatus } from "@/lib/enquiries";
import { getDatabase } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import { enquirySchema } from "@/lib/validation";
import type { EnquiryFormState } from "@/lib/action-state";
import type { EnquiryDocument, ResourceDocument } from "@/lib/types";

export async function submitEnquiry(
  _previousState: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  // Ignore automated submissions that fill the honeypot.
  if (typeof formData.get("website") === "string" && formData.get("website")) {
    return { success: true, message: "Your request has been received." };
  }

  const parsed = enquirySchema.safeParse({
    ...Object.fromEntries(
      [
        "type",
        "listingId",
        "listingSlug",
        "listingName",
        "organisationId",
        "patientName",
        "contactMethod",
        "email",
        "phone",
        "requestedService",
        "preferredDate",
        "message",
      ].map((name) => [name, formData.get(name)]),
    ),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const db = await getDatabase();

  let organisationId = data.organisationId;
  let listingName = data.listingName;

  const listingId = toObjectId(data.listingId);
  if (listingId) {
    const listing = await db.collection<ResourceDocument>("resources").findOne({ _id: listingId });
    if (listing) {
      listingName = listing.name;
      if (listing.organisationId) {
        organisationId = listing.organisationId.toHexString();
        if (!listing.enquiriesEnabled) {
          return {
            success: false,
            message:
              "This organisation has not enabled enquiries yet. Please use the contact details shown on the listing.",
          };
        }
      }
    }
  }

  const userId = await getCurrentUserId();

  try {
    const enquiry = await createEnquiry({
      type: data.type,
      listingId: data.listingId,
      listingSlug: data.listingSlug,
      listingName,
      organisationId,
      patientUserId: userId ?? undefined,
      patientName: data.patientName,
      contactMethod: data.contactMethod,
      email: data.email,
      phone: data.phone,
      requestedService: data.requestedService,
      preferredDate: data.preferredDate,
      message: data.message,
    });

    return {
      success: true,
      message:
        "Your request has been shared with the organisation and is waiting for their response.",
      reference: enquiry.reference,
    };
  } catch {
    console.error("Unable to save enquiry");
    return { success: false, message: "We could not send your request. Please try again." };
  }
}

export async function respondToEnquiry(
  _previousState: EnquiryFormState,
  formData: FormData,
): Promise<EnquiryFormState> {
  const organisationId = toObjectId(String(formData.get("organisationId") ?? ""));
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const slug = String(formData.get("slug") ?? "");
  if (!organisationId) return { success: false, message: "Organisation not found." };
  if (decision !== "accepted" && decision !== "declined" && decision !== "completed") {
    return { success: false, message: "Choose a valid response." };
  }

  const context = await getOrganisationContext(organisationId, "respondToEnquiries");
  if (!context) return { success: false, message: "You do not have permission to respond." };

  const updated = await updateEnquiryStatus({
    enquiryId: String(formData.get("enquiryId") ?? ""),
    status: decision,
    actorUserId: context.userId,
    note,
    organisationId,
  });

  if (!updated) return { success: false, message: "Request not found." };

  await recordAudit({
    actorUserId: context.userId,
    actorEmail: context.user.email,
    action: `enquiry.${decision}`,
    entityType: "enquiry",
    entityId: updated.id,
    summary: `${context.organisation.name} marked request ${updated.reference} as ${decision}.`,
  });

  if (slug) revalidatePath(`/organisation/${slug}`);
  return { success: true, message: `Request marked as ${decision}.` };
}

export async function cancelEnquiry(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const userId = await getCurrentUserId();
  if (!user || !userId) return;

  const enquiryId = toObjectId(String(formData.get("enquiryId") ?? ""));
  if (!enquiryId) return;

  const db = await getDatabase();
  const enquiry = await db.collection<EnquiryDocument>("enquiries").findOne({ _id: enquiryId });
  if (!enquiry) return;
  // Only the patient who created the request may cancel it.
  if (!enquiry.patientUserId || enquiry.patientUserId.toHexString() !== userId.toHexString()) return;

  await updateEnquiryStatus({ enquiryId, status: "cancelled", actorUserId: userId });
  revalidatePath("/account");
}
