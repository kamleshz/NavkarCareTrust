import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { toObjectId } from "@/lib/object-id";
import type {
  BranchDocument,
  MembershipRole,
  OrganisationDocument,
  OrganisationMembershipDocument,
  OrganisationType,
} from "@/lib/types";

export interface OrganisationView {
  id: string;
  slug: string;
  name: string;
  type: OrganisationType;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  registrationStatus: OrganisationDocument["registrationStatus"];
  verificationStatus: OrganisationDocument["verificationStatus"];
  partnershipStatus: OrganisationDocument["partnershipStatus"];
  enquiriesEnabled: boolean;
  reviewNote?: string;
}

export interface MembershipView {
  organisation: OrganisationView;
  role: MembershipRole;
  status: OrganisationMembershipDocument["status"];
}

export interface BranchView {
  id: string;
  name: string;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  region?: string;
  pinCode?: string;
  phone?: string;
  email?: string;
}

export interface MemberView {
  id: string;
  userId?: string;
  email?: string;
  role: MembershipRole;
  status: OrganisationMembershipDocument["status"];
}

export function toOrganisationView(
  organisation: OrganisationDocument & { _id: ObjectId },
): OrganisationView {
  return {
    id: organisation._id.toHexString(),
    slug: organisation.slug,
    name: organisation.name,
    type: organisation.type,
    description: organisation.description,
    email: organisation.email,
    phone: organisation.phone,
    website: organisation.website,
    registrationStatus: organisation.registrationStatus,
    verificationStatus: organisation.verificationStatus,
    partnershipStatus: organisation.partnershipStatus,
    enquiriesEnabled: organisation.enquiriesEnabled,
    reviewNote: organisation.reviewNote,
  };
}

export function toBranchView(branch: BranchDocument & { _id: ObjectId }): BranchView {
  return {
    id: branch._id.toHexString(),
    name: branch.name,
    address: branch.address,
    locality: branch.locality,
    city: branch.city,
    state: branch.state,
    region: branch.region,
    pinCode: branch.pinCode,
    phone: branch.phone,
    email: branch.email,
  };
}

export async function listUserMemberships(userId: ObjectId): Promise<MembershipView[]> {
  const db = await getDatabase();
  const memberships = await db
    .collection<OrganisationMembershipDocument>("organisationMemberships")
    .find({ userId, status: { $ne: "disabled" } })
    .toArray();

  if (!memberships.length) return [];

  const organisations = await db
    .collection<OrganisationDocument>("organisations")
    .find({ _id: { $in: memberships.map((membership) => membership.organisationId) } })
    .toArray();

  const byId = new Map(organisations.map((organisation) => [organisation._id!.toHexString(), organisation]));

  return memberships.flatMap((membership) => {
    const organisation = byId.get(membership.organisationId.toHexString());
    if (!organisation) return [];
    return [{
      organisation: toOrganisationView(organisation as OrganisationDocument & { _id: ObjectId }),
      role: membership.role,
      status: membership.status,
    }];
  });
}

export async function getOrganisationAccess(
  userId: ObjectId,
  organisationId: string | ObjectId,
): Promise<{ organisation: OrganisationView; role: MembershipRole } | null> {
  const id = toObjectId(organisationId);
  if (!id) return null;

  const db = await getDatabase();
  const membership = await db
    .collection<OrganisationMembershipDocument>("organisationMemberships")
    .findOne({ userId, organisationId: id, status: "active" });

  if (!membership) return null;

  const organisation = await db
    .collection<OrganisationDocument>("organisations")
    .findOne({ _id: id });

  if (!organisation) return null;

  return {
    organisation: toOrganisationView(organisation as OrganisationDocument & { _id: ObjectId }),
    role: membership.role,
  };
}

export async function getOrganisationById(
  organisationId: string | ObjectId,
): Promise<OrganisationView | null> {
  const id = toObjectId(organisationId);
  if (!id) return null;
  const db = await getDatabase();
  const organisation = await db.collection<OrganisationDocument>("organisations").findOne({ _id: id });
  return organisation
    ? toOrganisationView(organisation as OrganisationDocument & { _id: ObjectId })
    : null;
}

export async function listOrganisationsForAdmin(): Promise<OrganisationView[]> {
  const db = await getDatabase();
  const organisations = await db
    .collection<OrganisationDocument>("organisations")
    .find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return organisations.map((organisation) =>
    toOrganisationView(organisation as OrganisationDocument & { _id: ObjectId }),
  );
}

export async function getOrganisationBySlug(slug: string): Promise<OrganisationView | null> {
  const db = await getDatabase();
  const organisation = await db
    .collection<OrganisationDocument>("organisations")
    .findOne({ slug });
  return organisation
    ? toOrganisationView(organisation as OrganisationDocument & { _id: ObjectId })
    : null;
}

export async function listBranches(organisationId: ObjectId): Promise<BranchView[]> {
  const db = await getDatabase();
  const branches = await db
    .collection<BranchDocument>("branches")
    .find({ organisationId })
    .sort({ name: 1 })
    .toArray();

  return branches.map((branch) => toBranchView(branch as BranchDocument & { _id: ObjectId }));
}

export async function listOrganisationMembers(organisationId: ObjectId): Promise<MemberView[]> {
  const db = await getDatabase();
  const memberships = await db
    .collection<OrganisationMembershipDocument>("organisationMemberships")
    .find({ organisationId })
    .sort({ createdAt: 1 })
    .toArray();

  const userIds = memberships
    .map((membership) => membership.userId)
    .filter((value): value is ObjectId => value instanceof ObjectId);

  const users = await db
    .collection<{ _id: ObjectId; email: string }>("users")
    .find({ _id: { $in: userIds } })
    .toArray();
  const emailById = new Map(users.map((user) => [user._id.toHexString(), user.email]));

  return memberships.map((membership) => ({
    id: membership._id!.toHexString(),
    userId: membership.userId?.toHexString(),
    email: membership.invitedEmail ?? emailById.get(membership.userId!.toHexString()),
    role: membership.role,
    status: membership.status,
  }));
}

export async function countOrganisationMemberships(organisationId: ObjectId): Promise<number> {
  const db = await getDatabase();
  return db
    .collection<OrganisationMembershipDocument>("organisationMemberships")
    .countDocuments({ organisationId, status: "active" });
}
