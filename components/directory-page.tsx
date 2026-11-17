import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DirectoryResults } from "@/components/directory-results";
import { getEmptyDirectoryState } from "@/lib/directory-state";
import {
  allSupportHeading,
  allSupportRoute,
  categoryHeadings,
  legacyDirectoryRedirect,
  routeForCategory,
  type DirectorySearchParams,
} from "@/lib/navigation";
import { getPublishedResource, getPublishedResources, type ResourceFilters } from "@/lib/resources";
import {
  isRegionId,
  regionLabels,
  type PublicResource,
  type RegionId,
  type ResourceCategory,
} from "@/lib/types";

const PAGE_SIZE = 6;

interface DirectoryPageProps {
  searchParams: Promise<DirectorySearchParams>;
  /** Category fixed by the route. Omitted on the combined /support page. */
  category?: ResourceCategory;
}

interface NormalizedFilters {
  search: string;
  region: "" | RegionId;
}

function listingParam(params: DirectorySearchParams) {
  return typeof params.listing === "string" ? params.listing.trim() : "";
}

function hrefFor(filters: NormalizedFilters, page: number) {
  const query = new URLSearchParams();
  if (filters.search) query.set("q", filters.search);
  if (filters.region) query.set("region", filters.region);
  if (page > 1) query.set("page", String(page));
  const value = query.toString();
  return value ? `?${value}` : "?";
}

function countLabel(count: number) {
  return `${count} ${count === 1 ? "listing" : "listings"}`;
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

/**
 * Shared directory listing. The category comes from the route, while city, PIN,
 * and region filters live in the query string so they survive category changes.
 */
export async function DirectoryPage({ searchParams, category }: DirectoryPageProps) {
  const rawParams = await searchParams;
  const pathname = category ? routeForCategory(category) : allSupportRoute;

  // Existing shared directory URLs still resolve to the right page.
  const redirectTarget = legacyDirectoryRedirect(pathname, rawParams);
  if (redirectTarget) redirect(redirectTarget);

  const filters: NormalizedFilters = {
    search: typeof rawParams.q === "string" ? rawParams.q.trim() : "",
    region: isRegionId(rawParams.region) ? rawParams.region : "",
  };
  const heading = category ? categoryHeadings[category] : allSupportHeading;

  const result = await getPublishedResources(toQueryFilters(filters, category));

  if (!result.ok) {
    return (
      <main className="directory-main">
        <div className="directory-container">
          <DirectoryHeading title={heading.title} description={heading.description} />
          <div className="state-panel error-panel" role="alert">
            <h2>Directory unavailable</h2>
            <p>{result.message}</p>
            <Link className="button button-primary" href={pathname}>
              Try again
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const openListing = listingParam(rawParams);
  const selected: PublicResource | null = openListing
    ? await getPublishedResource(openListing)
    : null;

  const total = result.resources.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requestedPage = Number.parseInt(rawParams.page || "1", 10);
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages,
  );
  const visible = result.resources.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasActiveFilters = Boolean(filters.search || filters.region);
  const emptyState = getEmptyDirectoryState(hasActiveFilters);
  const activeRegionLabel = filters.region ? regionLabels[filters.region] : "";

  return (
    <main className="directory-main">
      <div className="directory-container">
        <DirectoryHeading title={heading.title} description={heading.description} />

        <section className="directory-results" aria-label={heading.title}>
          <div className="results-toolbar">
            <div>
              <strong>{countLabel(total)}</strong>
              {activeRegionLabel ? (
                <span>{` in ${activeRegionLabel}`}</span>
              ) : (
                <span> across all regions</span>
              )}
              {filters.search && <span>{` · matching “${filters.search}”`}</span>}
            </div>
            {hasActiveFilters && (
              <Link href="?" className="clear-filters">
                Clear filters
              </Link>
            )}
          </div>

          {visible.length > 0 && <DirectoryResults resources={visible} selected={selected} />}

          {total === 0 && (
            <EmptyState
              title={emptyState.title}
              description={emptyState.description}
              action={
                emptyState.showClearFilters ? (
                  <Link className="button button-primary" href="?">
                    Clear filters
                  </Link>
                ) : undefined
              }
            />
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Directory pages">
              <Link
                href={hrefFor(filters, currentPage - 1)}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : 0}
                rel="prev"
              >
                Previous
              </Link>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Link
                href={hrefFor(filters, currentPage + 1)}
                aria-disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : 0}
                rel="next"
              >
                Next
              </Link>
            </nav>
          )}

          <p className="directory-guidance">
            Information is for navigation only. Confirm availability, costs, and eligibility directly with
            each organisation.
          </p>
        </section>
      </div>
    </main>
  );
}

function toQueryFilters(
  filters: NormalizedFilters,
  category?: ResourceCategory,
): ResourceFilters {
  return {
    search: filters.search || undefined,
    region: filters.region || undefined,
    category,
  };
}

function DirectoryHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="directory-heading">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
