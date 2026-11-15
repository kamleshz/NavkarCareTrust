import { categoryLabels, type PublicResource } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ResourceCard({ resource }: { resource: PublicResource }) {
  const isMedicine = resource.category === "medicine-assistance";
  const isFinancialAid = resource.category === "financial-aid";

  return (
    <article className="resource-card">
      <div className="resource-card-top">
        <div>
          <p className="resource-category">{categoryLabels[resource.category]}</p>
          <h2>{resource.name}</h2>
          <p className="resource-meta">
            {resource.organisationType} <span aria-hidden="true">·</span>{" "}
            {resource.city}, {resource.state}
            {resource.pinCode ? ` – ${resource.pinCode}` : ""}
          </p>
        </div>
        {resource.isDemo && <span className="demo-label">Demo entry</span>}
      </div>

      <p className="resource-description">{resource.description}</p>

      {isFinancialAid && resource.eligibilitySummary && (
        <div className="info-block">
          <strong>Eligibility overview</strong>
          <p>{resource.eligibilitySummary}</p>
        </div>
      )}

      {isMedicine && (
        <div className="info-block medicine-note">
          <strong>Medicine availability</strong>
          <p>
            Contact this {resource.organisationType.toLowerCase()} to ask about
            current programme participation and availability. No medicine is sold
            through this website.
          </p>
        </div>
      )}

      <div className="resource-contact">
        <strong>Contact</strong>
        {resource.contactDetails.address && (
          <p>{resource.contactDetails.address}</p>
        )}
        <div className="contact-links">
          {resource.contactDetails.phone && (
            <a href={`tel:${resource.contactDetails.phone.replace(/\s/g, "")}`}>
              {resource.contactDetails.phone}
            </a>
          )}
          {resource.contactDetails.email && (
            <a href={`mailto:${resource.contactDetails.email}`}>
              {resource.contactDetails.email}
            </a>
          )}
          {isMedicine && resource.contactDetails.availabilityEnquiryUrl && (
            <a
              href={resource.contactDetails.availabilityEnquiryUrl}
              target="_blank"
              rel="noreferrer"
            >
              Enquire about availability
            </a>
          )}
          {resource.officialUrl && (
            <a href={resource.officialUrl} target="_blank" rel="noreferrer">
              {isFinancialAid ? "Official application information" : "Official website"}
            </a>
          )}
        </div>
      </div>

      <p className="review-date">Last reviewed {formatDate(resource.lastReviewedAt)}</p>
    </article>
  );
}
