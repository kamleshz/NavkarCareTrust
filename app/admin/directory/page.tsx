import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin-tabs";
import { AdminListingEditForm, RegionAssignForm } from "@/components/admin-forms";
import { ListingStatusBadge } from "@/components/badges";
import { requireAdmin } from "@/lib/auth/dal";
import { searchListingsForAdmin } from "@/lib/listings";
import { categoryLabels, regionLabels, regions, resourceCategories } from "@/lib/types";

export const metadata: Metadata = { title: "Directory management" };

export default async function AdminDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const term = typeof q === "string" ? q.trim() : "";
  const listings = await searchListingsForAdmin(term);

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>Directory search and editing</h1>
          <p>
            Search every listing, correct its details, and set the Mumbai browsing region. Localities, cities,
            states, and PIN codes are stored separately from the region.
          </p>
        </header>

        <AdminTabs active="/admin/directory" />

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Region and category reference</h2>
              <p>Regions are configurable browsing areas. Categories drive the public tabs.</p>
            </div>
          </div>
          <div className="panel-body">
            <dl className="definition-list">
              <div>
                <dt>Regions</dt>
                <dd>
                  {regions
                    .filter((region) => region.id !== "all-mumbai")
                    .map((region) => region.label)
                    .join(" · ")}
                </dd>
              </div>
              <div>
                <dt>Categories</dt>
                <dd>{resourceCategories.map((category) => categoryLabels[category]).join(" · ")}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Find a listing</h2>
              <p>Search by name, city, locality, or slug.</p>
            </div>
          </div>
          <div className="panel-body">
            <form className="inline-form" method="get">
              <label className="sr-only" htmlFor="directory-search">
                Search listings
              </label>
              <input
                id="directory-search"
                name="q"
                type="search"
                defaultValue={term}
                placeholder="Search listings"
              />
              <button className="button button-outline" type="submit">
                Search
              </button>
            </form>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Listings</h2>
              <p>{listings.length} shown{term ? ` for “${term}”` : ""}</p>
            </div>
          </div>
          {listings.length === 0 ? (
            <div className="panel-body">
              <p className="empty-note">No listings match this search.</p>
            </div>
          ) : (
            listings.map((listing) => (
              <div className="panel-body" key={listing.id}>
                <div className="actions-cell">
                  <strong>{listing.name}</strong>
                  <ListingStatusBadge status={listing.publicationStatus} />
                  <span className="status-badge">
                    {listing.region ? regionLabels[listing.region] : "No region"}
                  </span>
                  {listing.claimStatus === "claimed" ? (
                    <span className="status-badge is-muted">Claimed</span>
                  ) : (
                    <span className="status-badge is-pending">Unclaimed</span>
                  )}
                </div>
                <p className="card-location">
                  {categoryLabels[listing.category]} ·{" "}
                  {[listing.locality, listing.city, listing.state].filter(Boolean).join(", ") || "—"}
                  {listing.pinCode ? ` · PIN ${listing.pinCode}` : ""}
                </p>
                <RegionAssignForm listingId={listing.id} region={listing.region} />
                <details>
                  <summary className="link-button">Edit listing</summary>
                  <AdminListingEditForm listing={listing} />
                </details>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
