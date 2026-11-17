import {
  enquiryStatusLabels,
  listingStatuses,
  membershipRoleLabels,
  organisationTypeLabels,
  type EnquiryStatus,
  type ListingStatus,
  type MembershipRole,
  type OrganisationDocument,
  type OrganisationType,
} from "@/lib/types";

export type BadgeTone = "neutral" | "pending" | "ok" | "muted" | "danger";

const toneClass: Record<BadgeTone, string> = {
  neutral: "status-badge",
  pending: "status-badge is-pending",
  ok: "status-badge is-ok",
  muted: "status-badge is-muted",
  danger: "status-badge is-danger",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return <span className={toneClass[tone]}>{children}</span>;
}

const enquiryTone: Record<EnquiryStatus, BadgeTone> = {
  requested: "pending",
  accepted: "ok",
  completed: "ok",
  declined: "danger",
  cancelled: "muted",
};

export function EnquiryStatusBadge({ status }: { status: EnquiryStatus }) {
  return <Badge tone={enquiryTone[status]}>{enquiryStatusLabels[status]}</Badge>;
}

export function AppointmentBadge({ confirmed }: { confirmed: boolean }) {
  return confirmed ? <Badge tone="ok">Confirmed</Badge> : <Badge tone="pending">Not confirmed</Badge>;
}

const listingTone: Record<ListingStatus, BadgeTone> = {
  draft: "muted",
  "pending-review": "pending",
  published: "ok",
  archived: "muted",
};

const listingLabels: Record<ListingStatus, string> = {
  draft: "Draft",
  "pending-review": "Pending review",
  published: "Published",
  archived: "Archived",
};

export function ListingStatusBadge({ status }: { status: string }) {
  const value = (listingStatuses as readonly string[]).includes(status)
    ? (status as ListingStatus)
    : "draft";
  return <Badge tone={listingTone[value]}>{listingLabels[value]}</Badge>;
}

export function ListingStatusLabel({ status }: { status: string }) {
  const value = (listingStatuses as readonly string[]).includes(status)
    ? (status as ListingStatus)
    : "draft";
  return <span className="status-badge is-muted">{listingLabels[value]}</span>;
}

export function OrganisationRegistrationBadge({
  status,
}: {
  status: OrganisationDocument["registrationStatus"];
}) {
  const tone: BadgeTone = status === "approved" ? "ok" : status === "rejected" ? "danger" : "pending";
  const label = status === "approved" ? "Registration approved" : status === "rejected" ? "Registration returned" : "Registration pending";
  return <Badge tone={tone}>{label}</Badge>;
}

export function VerificationBadge({ status }: { status: OrganisationDocument["verificationStatus"] }) {
  return status === "verified" ? (
    <Badge tone="ok">Verified organisation</Badge>
  ) : (
    <Badge tone="muted">Not verified</Badge>
  );
}

export function PartnershipBadge({ status }: { status: OrganisationDocument["partnershipStatus"] }) {
  return status === "confirmed" ? (
    <Badge tone="ok">Confirmed partner</Badge>
  ) : (
    <Badge tone="muted">No partnership</Badge>
  );
}

export function OrganisationTypeBadge({ type }: { type: OrganisationType }) {
  return <Badge tone="neutral">{organisationTypeLabels[type]}</Badge>;
}

export function RoleBadge({ role }: { role: MembershipRole }) {
  return <Badge tone={role === "owner" ? "ok" : "neutral"}>{membershipRoleLabels[role]}</Badge>;
}
