import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin-tabs";
import { ReturnListingForm } from "@/components/admin-forms";
import { ListingStatusBadge } from "@/components/badges";
import { publishListingAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth/dal";
import { listListingsByStatus, listListingsWithProposedChanges } from "@/lib/listings";
import { categoryLabels } from "@/lib/types";

export const metadata: Metadata = { title: "Listing review" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

function location(listing: { locality?: string; city?: string; region?: string }) {
  const place = [listing.locality, listing.city].filter(Boolean).join(", ");
  return [place, listing.region?.replace(/-/g, " ")].filter(Boolean).join(" · ") || "—";
}

export default async function AdminListingsPage() {
  await requireAdmin();

  const [pending, proposed] = await Promise.all([
    listListingsByStatus("pending-review"),
    listListingsWithProposedChanges(),
  ]);

  const pendingIds = new Set(pending.map((listing) => listing.id));
  const changeRequests = proposed.filter((listing) => !pendingIds.has(listing.id));

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>Listing approval and publication</h1>
          <p>
            New submissions move Draft → Pending review → Published. While a published listing has proposed
            changes under review, its current published version stays visible.
          </p>
        </header>

        <AdminTabs active="/admin/listings" />

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Pending review</h2>
              <p>{pending.length} submissions awaiting a decision</p>
            </div>
          </div>
          {pending.length === 0 ? (
            <div className="panel-body">
              <p className="empty-note">No listings are waiting for review.</p>
            </div>
          ) : (
            pending.map((listing) => (
              <div className="panel-body" key={listing.id}>
                <h3>{listing.name}</h3>
                <p className="card-location">
                  {categoryLabels[listing.category]} · {location(listing)} · updated{" "}
                  {formatDate(listing.lastReviewedAt)}
                </p>
                <p>{listing.description}</p>
                {listing.reviewNote && <p className="field-error">Last note: {listing.reviewNote}</p>}
                <div className="actions-cell">
                  <ListingStatusBadge status={listing.publicationStatus} />
                  <form action={publishListingAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button className="button button-primary" type="submit">
                      Approve and publish
                    </button>
                  </form>
                </div>
                <details>
                  <summary className="link-button">Return with a reason</summary>
                  <ReturnListingForm listingId={listing.id} />
                </details>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Proposed changes on published listings</h2>
              <p>{changeRequests.length} published listings with edits under review</p>
            </div>
          </div>
          {changeRequests.length === 0 ? (
            <div className="panel-body">
              <p className="empty-note">No published listings have proposed changes.</p>
            </div>
          ) : (
            changeRequests.map((listing) => (
              <div className="panel-body" key={listing.id}>
                <h3>{listing.name}</h3>
                <p className="card-location">
                  {categoryLabels[listing.category]} · {location(listing)}
                </p>
                <p className="field-help">
                  The organisation submitted updated details. The current published version stays visible
                  until you approve these changes.
                </p>
                <div className="actions-cell">
                  <ListingStatusBadge status={listing.publicationStatus} />
                  <form action={publishListingAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button className="button button-primary" type="submit">
                      Approve changes
                    </button>
                  </form>
                </div>
                <details>
                  <summary className="link-button">Return with a reason</summary>
                  <ReturnListingForm listingId={listing.id} />
                </details>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
