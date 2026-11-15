import Link from "next/link";
import type { ReactNode } from "react";
import { CategoryTabs } from "@/components/category-tabs";
import { DirectoryResults } from "@/components/directory-results";
import { getEmptyDirectoryState } from "@/lib/directory-state";
import { getPublishedResources, partitionResourcesByLocation } from "@/lib/resources";
import { categoryLabels, resourceCategories, type ResourceCategory } from "@/lib/types";

const PAGE_SIZE = 6;

export interface DirectorySearchParams {
  location?: string;
  category?: string;
  page?: string;
}

function pageHref(params: DirectorySearchParams, page: number) {
  const next = new URLSearchParams();
  if (params.location) next.set("location", params.location);
  if (params.category) next.set("category", params.category);
  if (page > 1) next.set("page", String(page));
  const query = next.toString();
  return query ? `?${query}` : "?";
}

function countLabel(count: number, noun: string) {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4M8.5 11h5" />
        </svg>
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export async function DirectoryPage({ searchParams }: { searchParams: Promise<DirectorySearchParams> }) {
  const rawParams = await searchParams;
  const location = typeof rawParams.location === "string" ? rawParams.location.trim() : "";
  const category = resourceCategories.includes(rawParams.category as ResourceCategory)
    ? (rawParams.category as ResourceCategory)
    : "";
  const requestedPage = Number.parseInt(rawParams.page || "1", 10);
  const result = await getPublishedResources({ location, category });

  if (!result.ok) {
    return (
      <main className="directory-main">
        <div className="directory-container">
          <DirectoryHeading />
          <CategoryTabs activeCategory={category} />
          <div className="state-panel error-panel" role="alert">
            <h2>Directory unavailable</h2>
            <p>{result.message}</p>
            <Link className="button button-primary" href="/support">Try again</Link>
          </div>
        </div>
      </main>
    );
  }

  const { local, alsoAvailable } = partitionResourcesByLocation(result.resources, location);
  const totalPages = Math.max(1, Math.ceil(local.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const visibleResources = local.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const normalizedParams = { location, category };
  const hasActiveFilters = Boolean(location || category);
  const emptyState = getEmptyDirectoryState(hasActiveFilters);
  const hasAnyResult = local.length > 0 || alsoAvailable.length > 0;

  return (
    <main className="directory-main">
      <div className="directory-container">
        <DirectoryHeading />
        <CategoryTabs activeCategory={category} />

        <section className="directory-results" role="tabpanel" aria-label={category ? categoryLabels[category] : "All support"}>
          <div className="results-toolbar">
            <div>
              <strong>{countLabel(local.length, "listing")}</strong>
              <span>{location ? ` in ${location}` : " across all locations"}</span>
              {alsoAvailable.length > 0 && (
                <span>{` · ${countLabel(alsoAvailable.length, "programme")} to check`}</span>
              )}
            </div>
            {(location || category) && <Link href="?" className="clear-filters">Clear filters</Link>}
          </div>

          {visibleResources.length > 0 && <DirectoryResults resources={visibleResources} />}

          {local.length === 0 && alsoAvailable.length > 0 && (
            <EmptyState
              title={`No listings directly in ${location}`}
              description="Some nationwide or participating programmes may still be worth checking below."
            />
          )}

          {!hasAnyResult && (
            <EmptyState
              title={emptyState.title}
              description={emptyState.description}
              action={emptyState.showClearFilters ? <Link className="button button-primary" href="?">Clear filters</Link> : undefined}
            />
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Directory pages">
              <Link
                href={pageHref(normalizedParams, currentPage - 1)}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : 0}
              >
                Previous
              </Link>
              <span>Page {currentPage} of {totalPages}</span>
              <Link
                href={pageHref(normalizedParams, currentPage + 1)}
                aria-disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : 0}
              >
                Next
              </Link>
            </nav>
          )}

          {alsoAvailable.length > 0 && (
            <section className="also-available" aria-labelledby="also-available-title">
              <div className="also-available-heading">
                <h2 id="also-available-title">Also available to check</h2>
                <p>
                  Nationwide, participating-network, and state-wide programmes. Availability at{" "}
                  {location || "your location"} is not confirmed — check the coverage conditions on each listing.
                </p>
              </div>
              <DirectoryResults resources={alsoAvailable} />
            </section>
          )}

          <p className="directory-guidance">
            Information is for navigation only. Confirm availability, costs, and eligibility directly with each organisation.
          </p>
        </section>
      </div>
    </main>
  );
}

function DirectoryHeading() {
  return (
    <div className="directory-heading">
      <h1>Find cancer care and financial support</h1>
      <p>Browse reviewed hospitals, specialists, medicine assistance, and financial aid programmes in India.</p>
    </div>
  );
}
