import { redirect } from "next/navigation";
import type { ObjectId } from "mongodb";
import { getCurrentUser, getCurrentUserId } from "@/lib/auth/dal";
import { getOrganisationAccess, type OrganisationView } from "@/lib/organisations";
import { can, type OrganisationCapability } from "@/lib/permissions";
import type { MembershipRole, SessionUser } from "@/lib/types";

export interface OrganisationContext {
  user: SessionUser;
  userId: ObjectId;
  organisation: OrganisationView;
  role: MembershipRole;
}

/**
 * Server-side access check for every private organisation operation. Returns
 * null when the signed-in user is not an active member with the capability.
 */
export async function getOrganisationContext(
  organisationId: string | ObjectId,
  capability: OrganisationCapability,
): Promise<OrganisationContext | null> {
  const user = await getCurrentUser();
  const userId = await getCurrentUserId();
  if (!user || !userId) return null;

  const access = await getOrganisationAccess(userId, organisationId);
  if (!access) return null;
  if (!can(access.role, capability)) return null;

  return { user, userId, organisation: access.organisation, role: access.role };
}

/** Page-level guard: redirects instead of returning null. */
export async function requireOrganisationContext(
  organisationId: string | ObjectId,
  capability: OrganisationCapability,
): Promise<OrganisationContext> {
  const context = await getOrganisationContext(organisationId, capability);
  if (!context) redirect("/account/organisations");
  return context;
}
