import type { MembershipRole } from "@/lib/types";

/**
 * Centralised capability model. Organisation plans can add feature limits by
 * extending these capability sets without touching ownership checks or record
 * access control anywhere else in the app.
 */
export const organisationCapabilities = [
  "viewDashboard",
  "editProfile",
  "manageBranches",
  "createListings",
  "manageServices",
  "respondToEnquiries",
  "manageMembers",
  "transferOwnership",
] as const;

export type OrganisationCapability = (typeof organisationCapabilities)[number];

const capabilitiesByRole: Record<MembershipRole, ReadonlySet<OrganisationCapability>> = {
  owner: new Set(organisationCapabilities),
  administrator: new Set<OrganisationCapability>([
    "viewDashboard",
    "editProfile",
    "manageBranches",
    "createListings",
    "manageServices",
    "respondToEnquiries",
    "manageMembers",
  ]),
  staff: new Set<OrganisationCapability>(["viewDashboard", "respondToEnquiries"]),
};

export function can(role: MembershipRole | undefined | null, capability: OrganisationCapability): boolean {
  if (!role) return false;
  return capabilitiesByRole[role].has(capability);
}

/** Owners and administrators may review and publish listings. */
export function canPublishListings(role: MembershipRole | undefined | null): boolean {
  return can(role, "createListings");
}

export function canManageMembers(role: MembershipRole | undefined | null): boolean {
  return can(role, "manageMembers");
}

export function canRespondToEnquiries(role: MembershipRole | undefined | null): boolean {
  return can(role, "respondToEnquiries");
}
