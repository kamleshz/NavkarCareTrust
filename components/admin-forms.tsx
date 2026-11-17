"use client";

import { useActionState } from "react";
import {
  assignRegionAction,
  returnListingAction,
  reviewClaimAction,
  reviewOrganisationAction,
  updateListingAsAdmin,
} from "@/app/actions/admin";
import { reviewOrganisationApplicationAction } from "@/app/actions/organisation-application";
import { initialAdminState, initialOrganisationApplicationState, type AdminFormState } from "@/lib/action-state";
import type { ManagedListing } from "@/lib/listings";
import { categoryLabels, regions, resourceCategories, type ResourceCategory } from "@/lib/types";

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="field-error" id={id}>
      {errors[0]}
    </p>
  );
}

function Notice({ state }: { state: AdminFormState }) {
  if (!state.message) return null;
  return (
    <p className={`notice full-span ${state.success ? "is-success" : "is-error"}`} role="status">
      {state.message}
    </p>
  );
}

function RegionOptions() {
  return (
    <>
      <option value="">Not set</option>
      {regions
        .filter((region) => region.id !== "all-mumbai")
        .map((region) => (
          <option key={region.id} value={region.id}>
            {region.label}
          </option>
        ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Organisation registration review                                    */
/* ------------------------------------------------------------------ */

type OrganisationAction =
  | "approve"
  | "reject"
  | "verify"
  | "unverify"
  | "confirm-partnership"
  | "remove-partnership";

const organisationButtons: { action: OrganisationAction; label: string }[] = [
  { action: "approve", label: "Approve registration" },
  { action: "reject", label: "Return registration" },
  { action: "verify", label: "Mark verified" },
  { action: "unverify", label: "Remove verification" },
  { action: "confirm-partnership", label: "Confirm partnership" },
  { action: "remove-partnership", label: "Remove partnership" },
];

export function OrganisationReviewForm({
  organisationId,
  reviewNote,
}: {
  organisationId: string;
  reviewNote?: string;
}) {
  const [state, formAction, isPending] = useActionState(reviewOrganisationAction, initialAdminState);

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="organisationId" value={organisationId} />
      <Notice state={state} />
      <div className="form-field">
        <label htmlFor={`org-reason-${organisationId}`}>
          Reason <span className="optional">(required when returning a registration)</span>
        </label>
        <textarea
          id={`org-reason-${organisationId}`}
          name="reason"
          rows={2}
          defaultValue={reviewNote ?? ""}
        />
      </div>
      <div className="actions-cell">
        {organisationButtons.map((item) => (
          <button
            className="button button-outline"
            key={item.action}
            type="submit"
            name="action"
            value={item.action}
            disabled={isPending}
          >
            {item.label}
          </button>
        ))}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Return a listing submission with a reason                           */
/* ------------------------------------------------------------------ */

export function ReturnListingForm({ listingId }: { listingId: string }) {
  const [state, formAction, isPending] = useActionState(returnListingAction, initialAdminState);

  return (
    <form className="partner-form" action={formAction} noValidate>
      <input type="hidden" name="listingId" value={listingId} />
      <Notice state={state} />
      <div className="form-field full-span">
        <label htmlFor={`return-reason-${listingId}`}>Reason for returning</label>
        <textarea id={`return-reason-${listingId}`} name="reason" rows={2} required />
        <FieldError id={`return-reason-error-${listingId}`} errors={state.errors?.reason} />
      </div>
      <div className="form-field full-span">
        <button className="button button-outline" type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Returning…" : "Return with reason"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Listing claim review                                                */
/* ------------------------------------------------------------------ */

export function ClaimReviewForm({ claimId }: { claimId: string }) {
  const [state, formAction, isPending] = useActionState(reviewClaimAction, initialAdminState);

  return (
    <form className="partner-form" action={formAction} noValidate>
      <input type="hidden" name="claimId" value={claimId} />
      <Notice state={state} />
      <div className="form-field full-span">
        <label htmlFor={`claim-note-${claimId}`}>
          Note <span className="optional">(optional)</span>
        </label>
        <input id={`claim-note-${claimId}`} name="note" type="text" />
      </div>
      <div className="form-field full-span actions-cell">
        <button
          className="button button-primary"
          type="submit"
          name="decision"
          value="approved"
          disabled={isPending}
        >
          Approve claim
        </button>
        <button
          className="button button-outline"
          type="submit"
          name="decision"
          value="rejected"
          disabled={isPending}
        >
          Reject claim
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Region assignment                                                   */
/* ------------------------------------------------------------------ */

export function RegionAssignForm({
  listingId,
  region,
}: {
  listingId: string;
  region?: string;
}) {
  const [state, formAction, isPending] = useActionState(assignRegionAction, initialAdminState);

  return (
    <form className="inline-form" action={formAction}>
      <input type="hidden" name="listingId" value={listingId} />
      <label className="sr-only" htmlFor={`region-${listingId}`}>
        Browsing region
      </label>
      <select id={`region-${listingId}`} name="region" defaultValue={region ?? ""}>
        <RegionOptions />
      </select>
      <button className="button button-outline" type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save"}
      </button>
      {state.message && <span className="field-help">{state.message}</span>}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Directory search and editing                                        */
/* ------------------------------------------------------------------ */

export function AdminListingEditForm({ listing }: { listing: ManagedListing }) {
  const [state, formAction, isPending] = useActionState(updateListingAsAdmin, initialAdminState);
  const category: ResourceCategory = listing.category;
  const fieldId = `admin-listing-${listing.id}`;

  return (
    <form className="partner-form" action={formAction} noValidate>
      <input type="hidden" name="listingId" value={listing.id} />
      <Notice state={state} />

      <div className="form-field">
        <label htmlFor={`${fieldId}-name`}>Listing name</label>
        <input id={`${fieldId}-name`} name="name" type="text" defaultValue={listing.name} required />
        <FieldError id={`${fieldId}-name-error`} errors={state.errors?.name} />
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-category`}>Category</label>
        <select id={`${fieldId}-category`} name="category" defaultValue={category}>
          {resourceCategories.map((value) => (
            <option key={value} value={value}>
              {categoryLabels[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-type`}>Organisation type</label>
        <input
          id={`${fieldId}-type`}
          name="organisationType"
          type="text"
          defaultValue={listing.organisationType}
          required
        />
        <FieldError id={`${fieldId}-type-error`} errors={state.errors?.organisationType} />
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-specialty`}>
          Specialty <span className="optional">(optional)</span>
        </label>
        <input id={`${fieldId}-specialty`} name="specialty" type="text" defaultValue={listing.specialty} />
      </div>

      <div className="form-field full-span">
        <label htmlFor={`${fieldId}-description`}>Description</label>
        <textarea
          id={`${fieldId}-description`}
          name="description"
          rows={3}
          defaultValue={listing.description}
          required
        />
        <FieldError id={`${fieldId}-description-error`} errors={state.errors?.description} />
      </div>

      <div className="form-field full-span">
        <label htmlFor={`${fieldId}-services`}>
          Services <span className="optional">(comma separated)</span>
        </label>
        <input
          id={`${fieldId}-services`}
          name="services"
          type="text"
          defaultValue={listing.services.join(", ")}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-locality`}>
          Locality <span className="optional">(optional)</span>
        </label>
        <input id={`${fieldId}-locality`} name="locality" type="text" defaultValue={listing.locality} />
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-city`}>
          City <span className="optional">(optional)</span>
        </label>
        <input id={`${fieldId}-city`} name="city" type="text" defaultValue={listing.city} />
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-state`}>
          State <span className="optional">(optional)</span>
        </label>
        <input id={`${fieldId}-state`} name="state" type="text" defaultValue={listing.state} />
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-region`}>
          Browsing region <span className="optional">(optional)</span>
        </label>
        <select id={`${fieldId}-region`} name="region" defaultValue={listing.region ?? ""}>
          <RegionOptions />
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-pin`}>
          PIN code <span className="optional">(optional)</span>
        </label>
        <input
          id={`${fieldId}-pin`}
          name="pinCode"
          type="text"
          inputMode="numeric"
          maxLength={6}
          defaultValue={listing.pinCode}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-phone`}>
          Phone <span className="optional">(optional)</span>
        </label>
        <input id={`${fieldId}-phone`} name="phone" type="tel" defaultValue={listing.contactDetails.phone} />
        <FieldError id={`${fieldId}-phone-error`} errors={state.errors?.phone} />
      </div>

      <div className="form-field">
        <label htmlFor={`${fieldId}-email`}>
          Email <span className="optional">(optional)</span>
        </label>
        <input id={`${fieldId}-email`} name="email" type="email" defaultValue={listing.contactDetails.email} />
        <FieldError id={`${fieldId}-email-error`} errors={state.errors?.email} />
      </div>

      <div className="form-field full-span">
        <label htmlFor={`${fieldId}-address`}>
          Address <span className="optional">(optional)</span>
        </label>
        <input id={`${fieldId}-address`} name="address" type="text" defaultValue={listing.contactDetails.address} />
      </div>

      <div className="form-field full-span">
        <label htmlFor={`${fieldId}-url`}>
          Official website or source URL <span className="optional">(optional)</span>
        </label>
        <input id={`${fieldId}-url`} name="officialUrl" type="url" defaultValue={listing.officialUrl} />
        <FieldError id={`${fieldId}-url-error`} errors={state.errors?.officialUrl} />
      </div>

      <div className="form-field full-span">
        <label htmlFor={`${fieldId}-eligibility`}>
          Eligibility summary <span className="optional">(optional)</span>
        </label>
        <textarea
          id={`${fieldId}-eligibility`}
          name="eligibilitySummary"
          rows={2}
          defaultValue={listing.eligibilitySummary}
        />
      </div>

      <div className="form-field full-span">
        <label className="consent-field" htmlFor={`${fieldId}-enquiries`}>
          <input
            id={`${fieldId}-enquiries`}
            name="enquiriesEnabled"
            type="checkbox"
            defaultChecked={listing.enquiriesEnabled}
          />
          <span>Accept patient requests and enquiries through NavkarCareTrust</span>
        </label>
      </div>

      <div className="form-field full-span">
        <button className="button button-primary" type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Saving…" : "Save listing"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Organisation application (QR flow) review                            */
/* ------------------------------------------------------------------ */

export function RegistrationReviewForm({ applicationId }: { applicationId: string }) {
  const [state, formAction, isPending] = useActionState(
    reviewOrganisationApplicationAction,
    initialOrganisationApplicationState,
  );

  return (
    <form action={formAction} className="review-actions" noValidate>
      <input type="hidden" name="applicationId" value={applicationId} />
      {state.message && (
        <p className={`notice full-span ${state.success ? "is-success" : "is-error"}`} role="status">
          {state.message}
        </p>
      )}
      <div className="form-field full-span">
        <label htmlFor={`review-reason-${applicationId}`}>
          Reason <span className="optional">(required for return / reject)</span>
        </label>
        <textarea id={`review-reason-${applicationId}`} name="reason" rows={2} />
      </div>
      <div className="review-buttons">
        <button
          type="submit"
          name="action"
          value="approve"
          className="button button-primary"
          disabled={isPending}
        >
          {isPending ? "Processing…" : "Approve"}
        </button>
        <button
          type="submit"
          name="action"
          value="return"
          className="button button-outline"
          disabled={isPending}
        >
          Return for correction
        </button>
        <button
          type="submit"
          name="action"
          value="reject"
          className="button button-outline"
          disabled={isPending}
        >
          Reject
        </button>
      </div>
    </form>
  );
}
