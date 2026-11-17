"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  categoryLabels,
  enquiryTypeForCategory,
  enquiryTypeLabels,
  regionLabels,
  type PublicResource,
  type ResourceCategory,
} from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Slug or id used to address a listing in the URL. */
function listingKey(resource: PublicResource) {
  return resource.slug ?? resource.id;
}

/** Hydration-safe "has the client taken over?" check for portal rendering. */
const noopSubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

function useMounted() {
  return useSyncExternalStore(noopSubscribe, isClient, isServer);
}

function locationLabel(resource: PublicResource) {
  const parts = [resource.locality, resource.city].filter(Boolean);
  const place = parts.length ? parts.join(", ") : (resource.city ?? "");
  const region = resource.region ? regionLabels[resource.region] : "";
  const withState = [place, resource.state].filter(Boolean).join(", ");
  const label = [withState, region].filter(Boolean).join(" · ");
  if (label) return resource.pinCode ? `${label} – ${resource.pinCode}` : label;
  return resource.coverage ?? "";
}

function hasContactDetails(resource: PublicResource) {
  const { phone, email, address } = resource.contactDetails;
  return Boolean(phone || email || address);
}

function enquiryHref(resource: PublicResource) {
  return `/request/${listingKey(resource)}?type=${enquiryTypeForCategory(resource.category)}`;
}

/** Section labels differ per category so each page shows only relevant fields. */
const detailLabels: Record<
  PublicResource["category"],
  { services: string; official: string }
> = {
  hospitals: { services: "Services", official: "Official website" },
  doctors: { services: "Services", official: "Official appointment link" },
  "blood-banks": { services: "Services", official: "Official information" },
  diagnostics: { services: "Tests and scanning services", official: "Enquiry link" },
  "medicine-assistance": { services: "Programme support", official: "Official programme page" },
  "financial-aid": { services: "Coverage areas", official: "Official application link" },
};

function DetailsPanel({ resource, onClose }: { resource: PublicResource; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const labels = detailLabels[resource.category];
  const enquiryType = enquiryTypeForCategory(resource.category);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const isDoctor = resource.category === "doctors";
  const isMedicine = resource.category === "medicine-assistance";
  const hasLocations = Boolean(
    resource.locality || resource.city || resource.state || resource.pinCode || resource.region,
  );

  return (
    <div
      className="details-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="details-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
        ref={panelRef}
      >
        <div className="details-header">
          <div>
            <p className="card-category">{categoryLabels[resource.category]}</p>
            <h2 id="details-title">{resource.name}</h2>
            {locationLabel(resource) && <p className="details-location">{locationLabel(resource)}</p>}
          </div>
          <button
            ref={closeRef}
            className="panel-close"
            type="button"
            onClick={onClose}
            aria-label="Close details"
          >
            ×
          </button>
        </div>

        <div className="details-body">
          {isMedicine ? (
            <section className="detail-section">
              <h3>Programme information</h3>
              <p>{resource.description}</p>
            </section>
          ) : (
            <p>{resource.description}</p>
          )}

          {isDoctor && (resource.specialty || resource.affiliation) && (
            <section className="detail-section">
              <h3>Specialty and affiliation</h3>
              {resource.specialty && (
                <p>
                  <strong>Specialty:</strong> {resource.specialty}
                </p>
              )}
              {resource.affiliation && (
                <p>
                  <strong>Affiliation:</strong> {resource.affiliation}
                </p>
              )}
            </section>
          )}

          {isDoctor && hasLocations && (
            <section className="detail-section">
              <h3>Locations</h3>
              <ul className="detail-list">
                {[resource.locality, resource.city].filter(Boolean).length > 0 && (
                  <li>{[resource.locality, resource.city].filter(Boolean).join(", ")}</li>
                )}
                {resource.state && <li>{resource.state}</li>}
                {resource.pinCode && <li>PIN {resource.pinCode}</li>}
                {resource.region && <li>{regionLabels[resource.region]}</li>}
              </ul>
            </section>
          )}

          {!isDoctor && resource.services?.length ? (
            <section className="detail-section">
              <h3>{labels.services}</h3>
              <ul className="detail-list">
                {resource.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {resource.eligibilitySummary && (
            <section className="detail-section">
              <h3>Eligibility</h3>
              <p>{resource.eligibilitySummary}</p>
            </section>
          )}

          {resource.coverage && (
            <section className="detail-section">
              <h3>Coverage</h3>
              <p>{resource.coverage}</p>
            </section>
          )}

          {hasContactDetails(resource) && (
            <section className="detail-section">
              <h3>Address and contact</h3>
              {resource.contactDetails.address && <p>{resource.contactDetails.address}</p>}
              <div className="detail-links">
                {resource.contactDetails.phone && (
                  <a href={`tel:${resource.contactDetails.phone.replace(/\s/g, "")}`}>
                    {resource.contactDetails.phone}
                  </a>
                )}
                {resource.contactDetails.email && (
                  <a href={`mailto:${resource.contactDetails.email}`}>{resource.contactDetails.email}</a>
                )}
              </div>
            </section>
          )}

          {resource.stockStatus && (
            <section className="detail-section">
              <h3>Provider updates</h3>
              <p>
                {resource.stockStatus.level} ·{" "}
                <span className="stock-timestamp">
                  updated {formatDateTime(resource.stockStatus.updatedAt)}
                </span>
              </p>
            </section>
          )}

          {(resource.officialUrl || resource.referenceUrl) && (
            <section className="detail-section">
              <h3>{labels.official}</h3>
              <div className="detail-links">
                {resource.officialUrl && (
                  <a href={resource.officialUrl} target="_blank" rel="noreferrer">
                    {resource.actionLabel ?? labels.official}
                  </a>
                )}
                {resource.referenceUrl && (
                  <a href={resource.referenceUrl} target="_blank" rel="noreferrer">
                    Source page
                  </a>
                )}
              </div>
            </section>
          )}

          {resource.enquiriesEnabled ? (
            <section className="detail-section">
              <h3>{enquiryTypeLabels[enquiryType]}</h3>
              <p>
                This organisation accepts requests through NavkarCareTrust. Share your details and they will
                respond directly.
              </p>
              <Link className="button button-primary" href={enquiryHref(resource)}>
                {enquiryTypeLabels[enquiryType]}
              </Link>
            </section>
          ) : (
            <section className="detail-section">
              <h3>Get in touch</h3>
              <p className="directory-note">
                This is an external directory entry. Use the official contact details or booking link above.
                Availability and costs are not confirmed here.
              </p>
            </section>
          )}

          {isMedicine && (
            <p className="directory-note">
              This listing is informational. No medicine is sold through this website. Confirm current
              programme participation and stock directly with the official programme.
            </p>
          )}

          <p className="review-date">Last reviewed {formatDate(resource.lastReviewedAt)}</p>
          <p className="directory-note">
            Confirm current services, costs, availability, and eligibility directly with the organisation.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Responsive list view (desktop table / mobile stacked rows)          */
/* ------------------------------------------------------------------ */

interface ListColumn {
  key: string;
  label: string;
  /** Content rendered in the desktop table cell. */
  cell: (resource: PublicResource) => React.ReactNode;
  /** Optional width hint for the table column. */
  width?: string;
}

/** Compact location line used inside the location cell and mobile rows. */
function placeLine(resource: PublicResource) {
  const parts = [resource.locality, resource.city].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return resource.city ?? "";
}

/** Region rendered as a small badge, or a dash when none is set. */
function RegionBadge({ resource }: { resource: PublicResource }) {
  if (!resource.region) return <span className="cell-muted">—</span>;
  return (
    <span className="list-region-badge" title={regionLabels[resource.region]}>
      {regionLabels[resource.region]}
    </span>
  );
}

function ViewDetailsCell({
  href,
  onClick,
}: {
  href: string;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link className="list-view-link" href={href} scroll={false} onClick={onClick}>
      View details <span aria-hidden="true">→</span>
    </Link>
  );
}

/** Generic columns used when the list spans multiple categories (e.g. Overview). */
const allCategoryColumns: ListColumn[] = [
  { key: "name", label: "Name", cell: (r) => r.name, width: "28%" },
  {
    key: "category",
    label: "Category",
    cell: (r) => (
      <span className="list-region-badge">{categoryLabels[r.category]}</span>
    ),
  },
  {
    key: "location",
    label: "Location / Region",
    cell: (r) => (
      <span className="cell-stack">
        <span>{placeLine(r) || <span className="cell-muted">—</span>}</span>
        <RegionBadge resource={r} />
      </span>
    ),
  },
  { key: "actions", label: "View Details", cell: () => null, width: "140px" },
];

/** Column layout tailored to each category. */
const listColumns: Record<ResourceCategory, ListColumn[]> = {
  doctors: [
    { key: "name", label: "Doctor Name", cell: (r) => r.name, width: "22%" },
    { key: "specialty", label: "Speciality", cell: (r) => r.specialty || <span className="cell-muted">—</span> },
    {
      key: "hospital",
      label: "Hospital",
      cell: (r) => r.affiliation || <span className="cell-muted">—</span>,
    },
    {
      key: "location",
      label: "Location / Region",
      cell: (r) => (
        <span className="cell-stack">
          <span>{placeLine(r) || <span className="cell-muted">—</span>}</span>
          <RegionBadge resource={r} />
        </span>
      ),
    },
    {
      key: "actions",
      label: "View Details",
      cell: () => null,
      width: "140px",
    },
  ],
  hospitals: [
    { key: "name", label: "Hospital Name", cell: (r) => r.name, width: "26%" },
    { key: "type", label: "Type", cell: (r) => r.organisationType },
    {
      key: "location",
      label: "Location / Region",
      cell: (r) => (
        <span className="cell-stack">
          <span>{placeLine(r) || <span className="cell-muted">—</span>}</span>
          <RegionBadge resource={r} />
        </span>
      ),
    },
    { key: "actions", label: "View Details", cell: () => null, width: "140px" },
  ],
  "blood-banks": [
    { key: "name", label: "Blood Bank", cell: (r) => r.name, width: "32%" },
    {
      key: "location",
      label: "Location / Region",
      cell: (r) => (
        <span className="cell-stack">
          <span>{placeLine(r) || <span className="cell-muted">—</span>}</span>
          <RegionBadge resource={r} />
        </span>
      ),
    },
    { key: "actions", label: "View Details", cell: () => null, width: "140px" },
  ],
  diagnostics: [
    { key: "name", label: "Centre Name", cell: (r) => r.name, width: "28%" },
    {
      key: "tests",
      label: "Tests / Services",
      cell: (r) => r.specialty || r.organisationType,
    },
    {
      key: "location",
      label: "Location / Region",
      cell: (r) => (
        <span className="cell-stack">
          <span>{placeLine(r) || <span className="cell-muted">—</span>}</span>
          <RegionBadge resource={r} />
        </span>
      ),
    },
    { key: "actions", label: "View Details", cell: () => null, width: "140px" },
  ],
  "medicine-assistance": [
    { key: "name", label: "Programme", cell: (r) => r.name, width: "30%" },
    {
      key: "coverage",
      label: "Coverage",
      cell: (r) => r.coverage || <span className="cell-muted">—</span>,
    },
    { key: "actions", label: "View Details", cell: () => null, width: "140px" },
  ],
  "financial-aid": [
    { key: "name", label: "Scheme", cell: (r) => r.name, width: "30%" },
    {
      key: "coverage",
      label: "Coverage",
      cell: (r) => r.coverage || <span className="cell-muted">—</span>,
    },
    { key: "actions", label: "View Details", cell: () => null, width: "140px" },
  ],
};

/**
 * Listing list plus the details panel. The open listing lives in the URL so
 * browser Back closes the panel and the details are shareable.
 */
export function DirectoryResults({
  resources,
  selected,
}: {
  resources: PublicResource[];
  selected: PublicResource | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const openedHereRef = useRef(false);
  const mounted = useMounted();

  function listingHref(resource: PublicResource) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("listing", listingKey(resource));
    return `${pathname}?${params.toString()}`;
  }

  function rememberTrigger(event: React.MouseEvent<HTMLAnchorElement>) {
    triggerRef.current = event.currentTarget;
    openedHereRef.current = true;
  }

  function closeDetails() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("listing");
    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    if (openedHereRef.current) {
      openedHereRef.current = false;
      router.back();
    } else {
      router.replace(target, { scroll: false });
    }
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  const selectedKey = selected ? listingKey(selected) : null;
  const firstCategory = resources[0]?.category;
  const mixedCategories = resources.some((r) => r.category !== firstCategory);
  const columns = mixedCategories
    ? allCategoryColumns
    : firstCategory
      ? listColumns[firstCategory]
      : allCategoryColumns;

  return (
    <>
      {/* Desktop: full-width table */}
      <div className="directory-table-wrap">
        <table className="directory-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" style={column.width ? { width: column.width } : undefined}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => {
              const isOpen = selectedKey !== null && listingKey(resource) === selectedKey;
              return (
                <tr key={resource.id} className={isOpen ? "is-open" : undefined}>
                  {columns.map((column) => (
                    <td key={column.key} data-label={column.label}>
                      {column.key === "actions" ? (
                        <ViewDetailsCell
                          href={listingHref(resource)}
                          onClick={rememberTrigger}
                        />
                      ) : (
                        column.cell(resource)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: compact stacked rows (no horizontal scrolling) */}
      <ul className="directory-list-mobile">
        {resources.map((resource) => {
          const isOpen = selectedKey !== null && listingKey(resource) === selectedKey;
          return (
            <li key={resource.id} className={`mobile-row${isOpen ? " is-open" : ""}`}>
              <div className="mobile-row-head">
                <strong className="mobile-row-title">{resource.name}</strong>
                {resource.region && <RegionBadge resource={resource} />}
              </div>
              {columns
                .filter((c) => c.key !== "name" && c.key !== "actions")
                .map((column) => (
                  <div key={column.key} className="mobile-row-field">
                    <span className="mobile-row-label">{column.label}</span>
                    <span className="mobile-row-value">
                      {column.key === "location" ? (
                        placeLine(resource) || "—"
                      ) : column.key === "coverage" ? (
                        resource.coverage || "—"
                      ) : (
                        column.cell(resource)
                      )}
                    </span>
                  </div>
                ))}
              <div className="mobile-row-action">
                <Link
                  className="list-view-link"
                  href={listingHref(resource)}
                  scroll={false}
                  onClick={rememberTrigger}
                >
                  View details <span aria-hidden="true">→</span>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {mounted &&
        selected &&
        createPortal(<DetailsPanel resource={selected} onClose={closeDetails} />, document.body)}
    </>
  );
}
