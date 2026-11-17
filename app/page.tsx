import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DirectoryResults } from "@/components/directory-results";
import { ArrowIcon, categoryIcons } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  allSupportRoute,
  legacyDirectoryRedirect,
  navigationItems,
  overviewRoute,
  type DirectorySearchParams,
} from "@/lib/navigation";
import {
  getPublishedCategoryCounts,
  getPublishedResource,
  getRecentPublishedResources,
} from "@/lib/resources";

export const metadata: Metadata = {
  title: "Find cancer care and support",
  description:
    "Browse reviewed hospitals, doctors, blood banks, diagnostics, medicine assistance, and financial aid programmes for cancer care in India.",
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<DirectorySearchParams>;
}) {
  const params = await searchParams;

  // Old shared directory links such as "/?q=..." still open the directory.
  const redirectTarget = legacyDirectoryRedirect(overviewRoute, params);
  if (redirectTarget) redirect(redirectTarget);

  const [user, counts, recent] = await Promise.all([
    getCurrentUser(),
    getPublishedCategoryCounts(),
    getRecentPublishedResources(4),
  ]);

  const openListing = typeof params.listing === "string" ? params.listing.trim() : "";
  const selected = openListing ? await getPublishedResource(openListing) : null;

  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? "";

  return (
    <main className="directory-main overview-main">
      <div className="directory-container">
        <section className="overview-hero">
          <h1>{firstName ? `Welcome back, ${firstName}` : "Find cancer care and support in India"}</h1>
          <p>
            Search above by city, area, hospital, doctor, or a 6-digit PIN code, then open any listing for
            official contact details, eligibility, and application links.
          </p>
          <div className="overview-actions">
            <Link className="button button-primary" href={allSupportRoute}>
              Browse all support
            </Link>
            {user ? (
              <Link className="button button-outline" href="/account">
                My requests
              </Link>
            ) : (
              <Link className="button button-outline" href="/register">
                Create an account
              </Link>
            )}
          </div>
        </section>

        <h2 className="section-heading">Browse by category</h2>
        <ul className="category-shortcuts">
          {navigationItems.map((item) => {
            const Icon = categoryIcons[item.category];
            const count = counts?.[item.category];
            return (
              <li key={item.href}>
                <Link className="shortcut" href={item.href}>
                  <span className="shortcut-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="shortcut-body">
                    <span className="shortcut-title">{item.label}</span>
                    {typeof count === "number" && (
                      <span className="shortcut-count">
                        {count} {count === 1 ? "listing" : "listings"}
                      </span>
                    )}
                  </span>
                  <span className="shortcut-arrow" aria-hidden="true">
                    <ArrowIcon width="16" height="16" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {recent.length > 0 && (
          <section className="overview-recent" aria-label="Recently added listings">
            <div className="results-toolbar">
              <div>
                <strong>Recently added listings</strong>
              </div>
              <Link className="clear-filters" href={allSupportRoute}>
                See all
              </Link>
            </div>
            <DirectoryResults resources={recent} selected={selected} />
          </section>
        )}
      </div>
    </main>
  );
}
