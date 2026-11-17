import Link from "next/link";
import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin-tabs";
import { OrganisationReviewForm } from "@/components/admin-forms";
import {
  OrganisationRegistrationBadge,
  OrganisationTypeBadge,
  PartnershipBadge,
  VerificationBadge,
} from "@/components/badges";
import { requireAdmin } from "@/lib/auth/dal";
import { listOrganisationsForAdmin } from "@/lib/organisations";

export const metadata: Metadata = { title: "Organisation review" };

const filters = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Returned" },
  { id: "all", label: "All" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function isFilterId(value: unknown): value is FilterId {
  return typeof value === "string" && filters.some((filter) => filter.id === value);
}

export default async function AdminOrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter: FilterId = isFilterId(status) ? status : "pending";

  const organisations = await listOrganisationsForAdmin();
  const visible =
    filter === "all"
      ? organisations
      : organisations.filter((organisation) => organisation.registrationStatus === filter);

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>Organisation registration review</h1>
          <p>
            Approve a registration, return it with a reason, and track verification and confirmed
            partnership separately.
          </p>
        </header>

        <AdminTabs active="/admin/organisations" />

        <nav className="app-tabs" aria-label="Registration filter">
          {filters.map((item) => (
            <Link
              className="app-tab"
              key={item.id}
              href={item.id === "pending" ? "/admin/organisations" : `/admin/organisations?status=${item.id}`}
              aria-current={filter === item.id ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {visible.length === 0 ? (
          <p className="empty-note">No organisations match this filter.</p>
        ) : (
          visible.map((organisation) => (
            <section className="panel" key={organisation.id}>
              <div className="panel-header">
                <div>
                  <h2>{organisation.name}</h2>
                  <p>
                    {organisation.email ?? "No email"} · {organisation.phone ?? "No phone"}
                  </p>
                </div>
                <div className="actions-cell">
                  <OrganisationTypeBadge type={organisation.type} />
                  <OrganisationRegistrationBadge status={organisation.registrationStatus} />
                  <VerificationBadge status={organisation.verificationStatus} />
                  <PartnershipBadge status={organisation.partnershipStatus} />
                </div>
              </div>
              <div className="panel-body">
                <dl className="definition-list">
                  <div>
                    <dt>Website</dt>
                    <dd>{organisation.website ?? "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Enquiries</dt>
                    <dd>{organisation.enquiriesEnabled ? "Enabled" : "Disabled"}</dd>
                  </div>
                </dl>
                {organisation.description && <p className="field-help">{organisation.description}</p>}
              </div>
              <div className="panel-body">
                <OrganisationReviewForm
                  organisationId={organisation.id}
                  reviewNote={organisation.reviewNote}
                />
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
