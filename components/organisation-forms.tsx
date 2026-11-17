"use client";

import { useActionState } from "react";
import { respondToEnquiry } from "@/app/actions/enquiry";
import { createListing, updateListing } from "@/app/actions/listing";
import {
  createBranch,
  inviteMember,
  requestListingClaim,
  updateOrganisationProfile,
  updateStockLevel,
} from "@/app/actions/organisation";
import {
  initialEnquiryState,
  initialListingState,
  initialOrganisationState,
} from "@/lib/action-state";
import type { ManagedListing } from "@/lib/listings";
import type { BranchView } from "@/lib/organisations";
import {
  categoryLabels,
  enquiryStatusLabels,
  membershipRoleLabels,
  membershipRoles,
  regions,
  resourceCategories,
  type MembershipRole,
  type ResourceCategory,
} from "@/lib/types";

type FormState = { success: boolean; message: string; errors?: Record<string, string[]> };

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="field-error" id={id}>
      {errors[0]}
    </p>
  );
}

function Notice({ state }: { state: FormState }) {
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
/* Organisation profile                                                */
/* ------------------------------------------------------------------ */

export function OrganisationProfileForm({
  organisationId,
  slug,
  organisation,
}: {
  organisationId: string;
  slug: string;
  organisation: {
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    website?: string;
    enquiriesEnabled: boolean;
  };
}) {
  const [state, formAction, isPending] = useActionState(updateOrganisationProfile, initialOrganisationState);

  return (
    <form className="partner-form" action={formAction} noValidate>
      <input type="hidden" name="organisationId" value={organisationId} />
      <input type="hidden" name="slug" value={slug} />
      <Notice state={state} />

      <div className="form-field">
        <label htmlFor="org-name">Organisation name</label>
        <input id="org-name" name="name" type="text" defaultValue={organisation.name} required />
        <FieldError id="org-name-error" errors={state.errors?.name} />
      </div>

      <div className="form-field">
        <label htmlFor="org-phone">
          Phone <span className="optional">(optional)</span>
        </label>
        <input id="org-phone" name="phone" type="tel" defaultValue={organisation.phone} />
        <FieldError id="org-phone-error" errors={state.errors?.phone} />
      </div>

      <div className="form-field">
        <label htmlFor="org-email">
          Contact email <span className="optional">(optional)</span>
        </label>
        <input id="org-email" name="email" type="email" defaultValue={organisation.email} />
        <FieldError id="org-email-error" errors={state.errors?.email} />
      </div>

      <div className="form-field">
        <label htmlFor="org-website">
          Website <span className="optional">(optional)</span>
        </label>
        <input id="org-website" name="website" type="url" defaultValue={organisation.website} />
        <FieldError id="org-website-error" errors={state.errors?.website} />
      </div>

      <div className="form-field full-span">
        <label htmlFor="org-description">
          About <span className="optional">(optional)</span>
        </label>
        <textarea id="org-description" name="description" rows={3} defaultValue={organisation.description} />
        <FieldError id="org-description-error" errors={state.errors?.description} />
      </div>

      <div className="form-field full-span">
        <label className="consent-field" htmlFor="org-enquiries">
          <input
            id="org-enquiries"
            name="enquiriesEnabled"
            type="checkbox"
            defaultChecked={organisation.enquiriesEnabled}
          />
          <span>Accept patient requests and enquiries through NavkarCareTrust</span>
        </label>
      </div>

      <div className="form-field full-span">
        <button className="button button-primary" type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Branches                                                            */
/* ------------------------------------------------------------------ */

export function BranchForm({ organisationId, slug }: { organisationId: string; slug: string }) {
  const [state, formAction, isPending] = useActionState(createBranch, initialOrganisationState);

  return (
    <form className="partner-form" action={formAction} noValidate>
      <input type="hidden" name="organisationId" value={organisationId} />
      <input type="hidden" name="slug" value={slug} />
      <Notice state={state} />

      <div className="form-field">
        <label htmlFor="branch-name">Branch name</label>
        <input id="branch-name" name="name" type="text" required />
        <FieldError id="branch-name-error" errors={state.errors?.name} />
      </div>

      <div className="form-field">
        <label htmlFor="branch-phone">
          Phone <span className="optional">(optional)</span>
        </label>
        <input id="branch-phone" name="phone" type="tel" />
        <FieldError id="branch-phone-error" errors={state.errors?.phone} />
      </div>

      <div className="form-field full-span">
        <label htmlFor="branch-address">
          Address <span className="optional">(optional)</span>
        </label>
        <input id="branch-address" name="address" type="text" />
      </div>

      <div className="form-field">
        <label htmlFor="branch-locality">
          Locality <span className="optional">(optional)</span>
        </label>
        <input id="branch-locality" name="locality" type="text" />
      </div>

      <div className="form-field">
        <label htmlFor="branch-city">
          City <span className="optional">(optional)</span>
        </label>
        <input id="branch-city" name="city" type="text" />
      </div>

      <div className="form-field">
        <label htmlFor="branch-state">
          State <span className="optional">(optional)</span>
        </label>
        <input id="branch-state" name="state" type="text" />
      </div>

      <div className="form-field">
        <label htmlFor="branch-region">
          Browsing region <span className="optional">(optional)</span>
        </label>
        <select id="branch-region" name="region" defaultValue="">
          <RegionOptions />
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="branch-pin">
          PIN code <span className="optional">(optional)</span>
        </label>
        <input id="branch-pin" name="pinCode" type="text" inputMode="numeric" maxLength={6} />
      </div>

      <div className="form-field">
        <label htmlFor="branch-email">
          Email <span className="optional">(optional)</span>
        </label>
        <input id="branch-email" name="email" type="email" />
        <FieldError id="branch-email-error" errors={state.errors?.email} />
      </div>

      <div className="form-field full-span">
        <button className="button button-primary" type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Adding…" : "Add branch"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Listings                                                            */
/* ------------------------------------------------------------------ */

export function ListingForm({
  organisationId,
  slug,
  branches,
  listing,
  defaultCategory,
}: {
  organisationId: string;
  slug: string;
  branches: BranchView[];
  listing?: ManagedListing;
  defaultCategory: ResourceCategory;
}) {
  const [state, formAction, isPending] = useActionState(
    listing ? updateListing : createListing,
    initialListingState,
  );

  const category: ResourceCategory = listing?.category ?? defaultCategory;

  return (
    <form className="partner-form" action={formAction} noValidate>
      <input type="hidden" name="organisationId" value={organisationId} />
      <input type="hidden" name="slug" value={slug} />
      {listing && <input type="hidden" name="listingId" value={listing.id} />}
      <Notice state={state} />

      <div className="form-field">
        <label htmlFor={`listing-name-${listing?.id ?? "new"}`}>Listing name</label>
        <input
          id={`listing-name-${listing?.id ?? "new"}`}
          name="name"
          type="text"
          defaultValue={listing?.name}
          required
        />
        <FieldError id="listing-name-error" errors={state.errors?.name} />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-category-${listing?.id ?? "new"}`}>Category</label>
        <select id={`listing-category-${listing?.id ?? "new"}`} name="category" defaultValue={category}>
          {resourceCategories.map((value) => (
            <option key={value} value={value}>
              {categoryLabels[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={`listing-type-${listing?.id ?? "new"}`}>Organisation type</label>
        <input
          id={`listing-type-${listing?.id ?? "new"}`}
          name="organisationType"
          type="text"
          defaultValue={listing?.organisationType}
          required
        />
        <FieldError id="listing-type-error" errors={state.errors?.organisationType} />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-specialty-${listing?.id ?? "new"}`}>
          Specialty <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-specialty-${listing?.id ?? "new"}`}
          name="specialty"
          type="text"
          defaultValue={listing?.specialty}
        />
      </div>

      <div className="form-field full-span">
        <label htmlFor={`listing-description-${listing?.id ?? "new"}`}>Description</label>
        <textarea
          id={`listing-description-${listing?.id ?? "new"}`}
          name="description"
          rows={3}
          defaultValue={listing?.description}
          required
        />
        <FieldError id="listing-description-error" errors={state.errors?.description} />
      </div>

      <div className="form-field full-span">
        <label htmlFor={`listing-services-${listing?.id ?? "new"}`}>
          Services <span className="optional">(comma separated)</span>
        </label>
        <input
          id={`listing-services-${listing?.id ?? "new"}`}
          name="services"
          type="text"
          defaultValue={listing?.services.join(", ")}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-locality-${listing?.id ?? "new"}`}>
          Locality <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-locality-${listing?.id ?? "new"}`}
          name="locality"
          type="text"
          defaultValue={listing?.locality}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-city-${listing?.id ?? "new"}`}>
          City <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-city-${listing?.id ?? "new"}`}
          name="city"
          type="text"
          defaultValue={listing?.city}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-state-${listing?.id ?? "new"}`}>
          State <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-state-${listing?.id ?? "new"}`}
          name="state"
          type="text"
          defaultValue={listing?.state}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-region-${listing?.id ?? "new"}`}>
          Browsing region <span className="optional">(optional)</span>
        </label>
        <select id={`listing-region-${listing?.id ?? "new"}`} name="region" defaultValue={listing?.region ?? ""}>
          <RegionOptions />
        </select>
      </div>

      <div className="form-field">
        <label htmlFor={`listing-pin-${listing?.id ?? "new"}`}>
          PIN code <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-pin-${listing?.id ?? "new"}`}
          name="pinCode"
          type="text"
          inputMode="numeric"
          maxLength={6}
          defaultValue={listing?.pinCode}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-phone-${listing?.id ?? "new"}`}>
          Phone <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-phone-${listing?.id ?? "new"}`}
          name="phone"
          type="tel"
          defaultValue={listing?.contactDetails.phone}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-email-${listing?.id ?? "new"}`}>
          Email <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-email-${listing?.id ?? "new"}`}
          name="email"
          type="email"
          defaultValue={listing?.contactDetails.email}
        />
      </div>

      <div className="form-field full-span">
        <label htmlFor={`listing-address-${listing?.id ?? "new"}`}>
          Address <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-address-${listing?.id ?? "new"}`}
          name="address"
          type="text"
          defaultValue={listing?.contactDetails.address}
        />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-url-${listing?.id ?? "new"}`}>
          Official website <span className="optional">(optional)</span>
        </label>
        <input
          id={`listing-url-${listing?.id ?? "new"}`}
          name="officialUrl"
          type="url"
          defaultValue={listing?.officialUrl}
        />
        <FieldError id="listing-url-error" errors={state.errors?.officialUrl} />
      </div>

      <div className="form-field">
        <label htmlFor={`listing-branch-${listing?.id ?? "new"}`}>
          Branch <span className="optional">(optional)</span>
        </label>
        <select id={`listing-branch-${listing?.id ?? "new"}`} name="branchId" defaultValue={listing?.branchId ?? ""}>
          <option value="">Not linked</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field full-span">
        <label htmlFor={`listing-eligibility-${listing?.id ?? "new"}`}>
          Eligibility summary <span className="optional">(optional)</span>
        </label>
        <textarea
          id={`listing-eligibility-${listing?.id ?? "new"}`}
          name="eligibilitySummary"
          rows={2}
          defaultValue={listing?.eligibilitySummary}
        />
      </div>

      <div className="form-field full-span">
        <label className="consent-field" htmlFor={`listing-enquiries-${listing?.id ?? "new"}`}>
          <input
            id={`listing-enquiries-${listing?.id ?? "new"}`}
            name="enquiriesEnabled"
            type="checkbox"
            defaultChecked={listing?.enquiriesEnabled}
          />
          <span>Accept patient requests for this listing</span>
        </label>
      </div>

      <div className="form-field full-span">
        <button className="button button-primary" type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Saving…" : listing ? "Save changes" : "Create draft listing"}
        </button>
        {listing?.publicationStatus === "published" && (
          <p className="field-help">
            This listing is published. Your changes are held for administrator review and the current
            version stays visible in the directory.
          </p>
        )}
      </div>
    </form>
  );
}

export function StockForm({
  organisationId,
  slug,
  listingId,
  level,
}: {
  organisationId: string;
  slug: string;
  listingId: string;
  level?: string;
}) {
  const [state, formAction, isPending] = useActionState(updateStockLevel, initialOrganisationState);

  return (
    <form className="inline-form" action={formAction}>
      <input type="hidden" name="organisationId" value={organisationId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="listingId" value={listingId} />
      <label className="sr-only" htmlFor={`stock-${listingId}`}>
        Current stock level
      </label>
      <input
        id={`stock-${listingId}`}
        name="level"
        type="text"
        placeholder="e.g. O+ available"
        defaultValue={level}
      />
      <button className="button button-outline" type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? "Saving…" : "Update stock"}
      </button>
      {state.message && !state.success && <span className="field-error">{state.message}</span>}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Enquiries                                                           */
/* ------------------------------------------------------------------ */

export function EnquiryResponseForm({
  organisationId,
  slug,
  enquiryId,
  currentStatus,
}: {
  organisationId: string;
  slug: string;
  enquiryId: string;
  currentStatus: string;
}) {
  const [state, formAction, isPending] = useActionState(respondToEnquiry, initialEnquiryState);
  const decisions = (["accepted", "declined", "completed"] as const).filter(
    (decision) => decision !== currentStatus,
  );

  return (
    <form className="inline-form" action={formAction}>
      <input type="hidden" name="organisationId" value={organisationId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <label className="sr-only" htmlFor={`decision-${enquiryId}`}>
        Response
      </label>
      <select id={`decision-${enquiryId}`} name="decision" defaultValue={decisions[0]}>
        {decisions.map((decision) => (
          <option key={decision} value={decision}>
            {enquiryStatusLabels[decision]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`note-${enquiryId}`}>
        Note
      </label>
      <input id={`note-${enquiryId}`} name="note" type="text" placeholder="Note (optional)" />
      <button className="button button-outline" type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? "Saving…" : "Respond"}
      </button>
      {state.message && (
        <span className={state.success ? "field-help" : "field-error"}>{state.message}</span>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Team                                                                */
/* ------------------------------------------------------------------ */

export function MemberInviteForm({ organisationId, slug }: { organisationId: string; slug: string }) {
  const [state, formAction, isPending] = useActionState(inviteMember, initialOrganisationState);

  return (
    <form className="inline-form" action={formAction} noValidate>
      <input type="hidden" name="organisationId" value={organisationId} />
      <input type="hidden" name="slug" value={slug} />
      <label className="sr-only" htmlFor="member-email">
        Team member email
      </label>
      <input id="member-email" name="email" type="email" placeholder="name@example.org" required />
      <label className="sr-only" htmlFor="member-role">
        Role
      </label>
      <select id="member-role" name="role" defaultValue="staff">
        {membershipRoles.map((role: MembershipRole) => (
          <option key={role} value={role}>
            {membershipRoleLabels[role]}
          </option>
        ))}
      </select>
      <button className="button button-primary" type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? "Adding…" : "Add member"}
      </button>
      {state.message && (
        <span className={state.success ? "field-help" : "field-error"}>{state.message}</span>
      )}
      {state.errors?.email && <span className="field-error">{state.errors.email[0]}</span>}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Listing ownership claims                                            */
/* ------------------------------------------------------------------ */

export function ClaimRequestForm({
  organisationId,
  slug,
  listingId,
}: {
  organisationId: string;
  slug: string;
  listingId: string;
}) {
  const [state, formAction, isPending] = useActionState(requestListingClaim, initialOrganisationState);

  return (
    <form className="inline-form" action={formAction}>
      <input type="hidden" name="organisationId" value={organisationId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="listingId" value={listingId} />
      <button className="link-button" type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? "Submitting…" : "Request ownership"}
      </button>
      {state.message && (
        <span className={state.success ? "field-help" : "field-error"}>{state.message}</span>
      )}
    </form>
  );
}
