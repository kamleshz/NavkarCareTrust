import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin-tabs";
import { RegistrationReviewForm } from "@/components/admin-forms";
import { QrPreview } from "@/components/qr-preview";
import { requireAdmin } from "@/lib/auth/dal";
import {
  listOrganisationApplications,
  type ApplicationFilters,
} from "@/lib/organisation-applications";
import { generateOrganisationQr, getOrganisationRegisterUrl, getPublicBaseUrl } from "@/lib/qr";
import {
  organisationApplicationTypeLabels,
  organisationApplicationTypes,
  type OrganisationApplicationStatus,
  type OrganisationApplicationType,
} from "@/lib/types";

export const metadata: Metadata = { title: "Organisation registrations" };

const statuses: OrganisationApplicationStatus[] = ["pending", "approved", "returned", "rejected"];

const statusBadge: Record<OrganisationApplicationStatus, string> = {
  pending: "is-pending",
  approved: "is-ok",
  returned: "is-muted",
  rejected: "is-danger",
};

const statusLabels: Record<OrganisationApplicationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  returned: "Returned",
  rejected: "Rejected",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; city?: string; status?: string; id?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const filters: ApplicationFilters = {};
  if (organisationApplicationTypes.includes(params.type as OrganisationApplicationType)) {
    filters.organisationType = params.type as OrganisationApplicationType;
  }
  if (params.city) filters.city = params.city;
  if (statuses.includes(params.status as OrganisationApplicationStatus)) {
    filters.status = params.status as OrganisationApplicationStatus;
  }

  const applications = await listOrganisationApplications(filters);
  const selectedId = params.id;
  const selected = selectedId ? applications.find((a) => a.id === selectedId) : null;

  const headerList = await headers();
  const baseUrl = getPublicBaseUrl({ get: (name) => headerList.get(name) });
  const registerUrl = getOrganisationRegisterUrl(baseUrl);
  const qr = await generateOrganisationQr(registerUrl);

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>Organisation registrations</h1>
          <p>Review registrations submitted via the common QR code and manage the QR itself.</p>
        </header>

        <AdminTabs active="/admin/registrations" />

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Common registration QR</h2>
              <p>
                One QR code for all organisation types. It points to{" "}
                <code>{registerUrl}</code>.
              </p>
            </div>
          </div>
          <div className="panel-body">
            <QrPreview url={qr.url} pngDataUrl={qr.pngDataUrl} svg={qr.svg} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Registrations</h2>
              <p>{applications.length} registration{applications.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          <div className="panel-body">
            <form method="get" className="admin-filters" noValidate>
              <div className="form-field">
                <label htmlFor="filter-type">Organisation type</label>
                <select id="filter-type" name="type" defaultValue={params.type ?? ""}>
                  <option value="">All types</option>
                  {organisationApplicationTypes.map((type) => (
                    <option key={type} value={type}>
                      {organisationApplicationTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="filter-city">City or region</label>
                <input
                  id="filter-city"
                  name="city"
                  defaultValue={params.city ?? ""}
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div className="form-field">
                <label htmlFor="filter-status">Review status</label>
                <select id="filter-status" name="status" defaultValue={params.status ?? ""}>
                  <option value="">All statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-actions">
                <button type="submit" className="button button-primary">
                  Apply filters
                </button>
                <Link className="button button-outline" href="/admin/registrations">
                  Clear
                </Link>
              </div>
            </form>

            {applications.length === 0 ? (
              <p className="empty-note">No registrations match these filters.</p>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Organisation</th>
                      <th scope="col">Type</th>
                      <th scope="col">City</th>
                      <th scope="col">Status</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr key={application.id}>
                        <td>{application.reference}</td>
                        <td>
                          <strong>{application.organisationName}</strong>
                          {application.contactPerson && (
                            <span className="card-location">{application.contactPerson}</span>
                          )}
                        </td>
                        <td>{organisationApplicationTypeLabels[application.organisationType]}</td>
                        <td>{application.city ?? "—"}</td>
                        <td>
                          <span className={`status-badge ${statusBadge[application.status]}`}>
                            {statusLabels[application.status]}
                          </span>
                        </td>
                        <td>{formatDate(application.createdAt)}</td>
                        <td>
                          <Link
                            className="button button-outline button-small"
                            href={`/admin/registrations?id=${application.id}`}
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {selected && <RegistrationDetail application={selected} />}
      </div>
    </main>
  );
}

function RegistrationDetail({
  application,
}: {
  application: Awaited<ReturnType<typeof listOrganisationApplications>>[number];
}) {
  const entries = Object.entries(application.details).filter(([, value]) => value);

  return (
    <section className="panel" id="registration-detail">
      <div className="panel-header">
        <div>
          <h2>{application.organisationName}</h2>
          <p>
            Reference {application.reference} ·{" "}
            {organisationApplicationTypeLabels[application.organisationType]}
          </p>
        </div>
        <Link className="button button-outline" href="/admin/registrations">
          Close
        </Link>
      </div>
      <div className="panel-body">
        <dl className="definition-list">
          <div>
            <dt>Contact person</dt>
            <dd>{application.contactPerson ?? "—"}</dd>
          </div>
          <div>
            <dt>Mobile</dt>
            <dd>{application.mobile ?? "—"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{application.email ?? "—"}</dd>
          </div>
          <div>
            <dt>City</dt>
            <dd>{application.city ?? "—"}</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>{application.state ?? "—"}</dd>
          </div>
          <div>
            <dt>PIN code</dt>
            <dd>{application.pinCode ?? "—"}</dd>
          </div>
          <div>
            <dt>Service areas</dt>
            <dd>{application.serviceAreas ?? "—"}</dd>
          </div>
          <div>
            <dt>Support offered</dt>
            <dd>{application.supportOffered ?? "—"}</dd>
          </div>
          <div>
            <dt>Description</dt>
            <dd>{application.description ?? "—"}</dd>
          </div>
        </dl>

        {entries.length > 0 && (
          <div className="detail-section">
            <h3>Type-specific details</h3>
            <dl className="definition-list">
              {entries.map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {application.reviewNote && (
          <div className="notice">
            <strong>Review note:</strong> {application.reviewNote}
          </div>
        )}

        {application.status !== "approved" && (
          <RegistrationReviewForm applicationId={application.id} />
        )}
      </div>
    </section>
  );
}
