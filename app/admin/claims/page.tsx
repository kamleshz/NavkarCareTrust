import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin-tabs";
import { ClaimReviewForm } from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth/dal";
import { listPendingClaims } from "@/lib/listings";

export const metadata: Metadata = { title: "Listing claims" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

export default async function AdminClaimsPage() {
  await requireAdmin();
  const claims = await listPendingClaims();

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>Listing claim review</h1>
          <p>
            Imported listings start unclaimed. An organisation can request ownership, and access is granted
            only after you approve the claim.
          </p>
        </header>

        <AdminTabs active="/admin/claims" />

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Pending claims</h2>
              <p>{claims.length} awaiting a decision</p>
            </div>
          </div>
          {claims.length === 0 ? (
            <div className="panel-body">
              <p className="empty-note">No ownership claims are waiting for review.</p>
            </div>
          ) : (
            claims.map((claim) => (
              <div className="panel-body" key={claim.id}>
                <h3>{claim.listingName}</h3>
                <p className="card-location">
                  Requested by {claim.organisationName ?? "an organisation"} · {formatDate(claim.createdAt)}
                </p>
                <ClaimReviewForm claimId={claim.id} />
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
