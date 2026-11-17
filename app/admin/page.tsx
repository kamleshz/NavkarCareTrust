import Link from "next/link";
import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin-tabs";
import { requireAdmin } from "@/lib/auth/dal";
import { listAuditEntries } from "@/lib/audit";
import { listAllEnquiries } from "@/lib/enquiries";
import { listListingsByStatus, listListingsWithProposedChanges, listUnclaimedListings } from "@/lib/listings";
import { listOrganisationsForAdmin } from "@/lib/organisations";

export const metadata: Metadata = { title: "Admin panel" };

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();

  const [organisations, pendingListings, proposedChanges, unclaimed, enquiries, audit] =
    await Promise.all([
      listOrganisationsForAdmin(),
      listListingsByStatus("pending-review"),
      listListingsWithProposedChanges(),
      listUnclaimedListings(),
      listAllEnquiries(),
      listAuditEntries(8),
    ]);

  const pendingOrganisations = organisations.filter(
    (organisation) => organisation.registrationStatus === "pending",
  );
  const openEnquiries = enquiries.filter((enquiry) => enquiry.status === "requested");

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>Admin panel</h1>
          <p>
            Signed in as {admin.fullName} ({admin.email}). Review registrations, publish listings, and keep
            the directory accurate.
          </p>
        </header>

        <AdminTabs active="/admin" />

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>What needs attention</h2>
              <p>Registrations, publication, and ownership claims are reviewed separately.</p>
            </div>
          </div>
          <div className="panel-body">
            <div className="panel-grid">
              <div className="stat">
                <span>Registrations pending</span>
                <strong>{pendingOrganisations.length}</strong>
              </div>
              <div className="stat">
                <span>Listings pending review</span>
                <strong>{pendingListings.length}</strong>
              </div>
              <div className="stat">
                <span>Proposed changes</span>
                <strong>{proposedChanges.length}</strong>
              </div>
              <div className="stat">
                <span>Unclaimed listings</span>
                <strong>{unclaimed.length}</strong>
              </div>
              <div className="stat">
                <span>Open requests</span>
                <strong>{openEnquiries.length}</strong>
              </div>
              <div className="stat">
                <span>Organisations</span>
                <strong>{organisations.length}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent administrative changes</h2>
              <p>A record of the most recent important actions.</p>
            </div>
            <Link className="button button-outline" href="/admin/audit">
              Full audit log
            </Link>
          </div>
          {audit.length === 0 ? (
            <div className="panel-body">
              <p className="empty-note">No administrative changes recorded yet.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">When</th>
                    <th scope="col">Action</th>
                    <th scope="col">Summary</th>
                    <th scope="col">By</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.createdAt)}</td>
                      <td>{entry.action}</td>
                      <td>{entry.summary}</td>
                      <td>{entry.actorEmail ?? "System"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
