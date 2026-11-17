"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { recordAudit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { getDatabase } from "@/lib/mongodb";
import { slugify } from "@/lib/slug";
import {
  loginSchema,
  organisationRegistrationSchema,
  patientRegistrationSchema,
} from "@/lib/validation";
import type { AccountFormState } from "@/lib/action-state";
import type {
  OrganisationDocument,
  OrganisationMembershipDocument,
  UserDocument,
} from "@/lib/types";

function fields(formData: FormData, names: string[]): Record<string, unknown> {
  return Object.fromEntries(names.map((name) => [name, formData.get(name)]));
}

function safeRedirectTarget(value: FormDataEntryValue | null): string {
  const target = typeof value === "string" ? value : "";
  return target.startsWith("/") && !target.startsWith("//") ? target : "/account";
}

export async function registerPatient(
  _previousState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const parsed = patientRegistrationSchema.safeParse(
    fields(formData, ["fullName", "email", "phone", "password", "consent"]),
  );

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const db = await getDatabase();
  const existing = await db.collection<UserDocument>("users").findOne({ email: parsed.data.email });
  if (existing) {
    return {
      success: false,
      message: "An account already exists for this email. Please sign in instead.",
    };
  }

  let userId: ObjectId;
  try {
    const now = new Date();
    const result = await db.collection<UserDocument>("users").insertOne({
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      accountTypes: ["patient"],
      isPlatformAdmin: false,
      createdAt: now,
      updatedAt: now,
    });
    userId = result.insertedId;
  } catch {
    console.error("Unable to create patient account");
    return { success: false, message: "We could not create your account. Please try again." };
  }

  await createSession(userId);
  redirect("/account");
}

export async function registerOrganisation(
  _previousState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const parsed = organisationRegistrationSchema.safeParse(
    fields(formData, [
      "organisationName",
      "type",
      "description",
      "city",
      "state",
      "contactPerson",
      "email",
      "phone",
      "website",
      "password",
      "consent",
    ]),
  );

  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const db = await getDatabase();
  const existing = await db.collection<UserDocument>("users").findOne({ email: parsed.data.email });
  if (existing) {
    return {
      success: false,
      message:
        "An account already exists for this email. Sign in to add an organisation from your dashboard.",
    };
  }

  const now = new Date();
  const slug = `${slugify(parsed.data.organisationName)}-${randomBytes(2).toString("hex")}`;

  try {
    const userResult = await db.collection<UserDocument>("users").insertOne({
      email: parsed.data.email,
      passwordHash: hashPassword(parsed.data.password),
      fullName: parsed.data.contactPerson,
      phone: parsed.data.phone,
      accountTypes: ["organisation"],
      isPlatformAdmin: false,
      createdAt: now,
      updatedAt: now,
    });

    const organisationResult = await db.collection<OrganisationDocument>("organisations").insertOne({
      slug,
      name: parsed.data.organisationName,
      type: parsed.data.type,
      description: parsed.data.description,
      email: parsed.data.email,
      phone: parsed.data.phone,
      website: parsed.data.website,
      registrationStatus: "pending",
      verificationStatus: "unverified",
      partnershipStatus: "none",
      enquiriesEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    await db.collection<OrganisationMembershipDocument>("organisationMemberships").insertOne({
      organisationId: organisationResult.insertedId,
      userId: userResult.insertedId,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await recordAudit({
      actorUserId: userResult.insertedId,
      actorEmail: parsed.data.email,
      action: "organisation.registered",
      entityType: "organisation",
      entityId: organisationResult.insertedId.toHexString(),
      summary: `Organisation "${parsed.data.organisationName}" registered and is awaiting review.`,
    });

    await createSession(userResult.insertedId);
  } catch {
    console.error("Unable to register organisation");
    return { success: false, message: "We could not create your organisation. Please try again." };
  }

  redirect(`/organisation/${slug}`);
}

export async function login(
  _previousState: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const parsed = loginSchema.safeParse(fields(formData, ["email", "password"]));
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const db = await getDatabase();
  const user = await db.collection<UserDocument>("users").findOne({ email: parsed.data.email });

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { success: false, message: "Email or password is incorrect." };
  }

  await createSession(user._id!);
  redirect(safeRedirectTarget(formData.get("next")));
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}
