"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { categoryLabels, type PublicResource } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function locationLabel(resource: PublicResource) {
  const place = [resource.city, resource.state].filter(Boolean).join(", ");
  if (place) return resource.pinCode ? `${place} – ${resource.pinCode}` : place;
  return resource.coverage ?? "";
}

function officialLinkLabel(resource: PublicResource) {
  return resource.actionLabel ?? "Visit official site";
}

function hasContactDetails(resource: PublicResource) {
  const { phone, email, address } = resource.contactDetails;
  return Boolean(phone || email || address);
}

function DetailsPanel({
  resource,
  onClose,
}: {
  resource: PublicResource;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div className="details-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
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
          </div>
          <button ref={closeRef} className="panel-close" type="button" onClick={onClose} aria-label="Close details">
            ×
          </button>
        </div>

        <div className="details-body">
          <p className="listing-label">Directory listing</p>
          <p className="details-location">
            {resource.organisationType}
            {locationLabel(resource) ? ` · ${locationLabel(resource)}` : ""}
          </p>
          <p>{resource.description}</p>

          {resource.category === "doctors" && (resource.specialty || resource.affiliation) && (
            <section className="detail-section">
              <h3>Specialty and affiliation</h3>
              {resource.specialty && <p><strong>Specialty:</strong> {resource.specialty}</p>}
              {resource.affiliation && <p><strong>Affiliation:</strong> {resource.affiliation}</p>}
            </section>
          )}

          {resource.coverage && (
            <section className="detail-section">
              <h3>Coverage</h3>
              <p>{resource.coverage}</p>
            </section>
          )}

          {resource.eligibilitySummary && (
            <section className="detail-section">
              <h3>Eligibility</h3>
              <p>{resource.eligibilitySummary}</p>
            </section>
          )}

          {hasContactDetails(resource) && (
            <section className="detail-section">
              <h3>Contact details</h3>
              {resource.contactDetails.address && <p>{resource.contactDetails.address}</p>}
              <div className="detail-links">
                {resource.contactDetails.phone && (
                  <a href={`tel:${resource.contactDetails.phone.replace(/\s/g, "")}`}>{resource.contactDetails.phone}</a>
                )}
                {resource.contactDetails.email && (
                  <a href={`mailto:${resource.contactDetails.email}`}>{resource.contactDetails.email}</a>
                )}
              </div>
            </section>
          )}

          {(resource.officialUrl || resource.referenceUrl) && (
            <section className="detail-section">
              <h3>Official information</h3>
              <div className="detail-links">
                {resource.officialUrl && (
                  <a href={resource.officialUrl} target="_blank" rel="noreferrer">{officialLinkLabel(resource)}</a>
                )}
                {resource.referenceUrl && (
                  <a href={resource.referenceUrl} target="_blank" rel="noreferrer">View reference</a>
                )}
              </div>
            </section>
          )}

          {resource.category === "medicine-assistance" && (
            <p className="directory-note">
              This listing is informational. No medicine is sold through this website. Confirm current
              programme participation and stock directly with the official outlet locator or programme.
            </p>
          )}

          <p className="review-date">Last reviewed {formatDate(resource.lastReviewedAt)}</p>
          <p className="directory-note">Confirm current services, costs, availability, and eligibility directly with the organisation.</p>
        </div>
      </div>
    </div>
  );
}

export function DirectoryResults({ resources }: { resources: PublicResource[] }) {
  const [selected, setSelected] = useState<PublicResource | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function openDetails(resource: PublicResource, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setSelected(resource);
  }

  function closeDetails() {
    setSelected(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  return (
    <>
      <div className="results-grid">
        {resources.map((resource) => (
          <article className="directory-card" key={resource.id}>
            <div className="card-topline">
              <p className="card-category">{categoryLabels[resource.category]}</p>
              <span className="listing-label">Directory listing</span>
            </div>
            <h2>{resource.name}</h2>
            <p className="card-location">{locationLabel(resource)}</p>
            {resource.category === "doctors" && (resource.specialty || resource.affiliation) && (
              <p className="card-affiliation">
                {[resource.specialty, resource.affiliation].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="card-description">{resource.description}</p>
            <button className="card-action" type="button" onClick={(event) => openDetails(resource, event.currentTarget)}>
              View details <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
      {selected && createPortal(
        <DetailsPanel resource={selected} onClose={closeDetails} />,
        document.body,
      )}
    </>
  );
}
