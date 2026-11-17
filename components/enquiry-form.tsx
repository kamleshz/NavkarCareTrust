"use client";

import { useActionState } from "react";
import { submitEnquiry } from "@/app/actions/enquiry";
import { initialEnquiryState } from "@/lib/action-state";
import { enquiryTypeLabels, type EnquiryType, type PublicResource } from "@/lib/types";

const serviceLabel: Record<EnquiryType, string> = {
  appointment: "Service, department, or specialist",
  diagnostic: "Diagnostic test or scan",
  medicine: "Medicine or programme",
  "financial-support": "Support you are asking about",
};

export function EnquiryForm({
  resource,
  type,
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  resource: PublicResource;
  type: EnquiryType;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const [state, formAction, isPending] = useActionState(submitEnquiry, initialEnquiryState);

  if (state.success) {
    return (
      <div className="success-panel" role="status">
        <span className="success-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <h2>Request sent</h2>
        <p>{state.message}</p>
        {state.reference && (
          <p>
            Your reference is <strong>{state.reference}</strong>. Track it any time from your account.
          </p>
        )}
        <a className="button button-outline" href="/account">
          View my requests
        </a>
      </div>
    );
  }

  return (
    <form className="partner-form" action={formAction} noValidate>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="listingId" value={resource.id} />
      <input type="hidden" name="listingSlug" value={resource.slug ?? ""} />
      <input type="hidden" name="listingName" value={resource.name} />
      <input type="hidden" name="organisationId" value="" />

      <div className="form-trap" aria-hidden="true">
        <label htmlFor="enquiry-website">Leave this field empty</label>
        <input id="enquiry-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.message && !state.success && !state.errors && (
        <p className="form-message full-span" role="alert">
          {state.message}
        </p>
      )}

      <div className="form-field full-span">
        <h3>{enquiryTypeLabels[type]}</h3>
        <p className="field-help">
          Sharing with <strong>{resource.name}</strong>. Your request is only shared once you confirm below.
        </p>
      </div>

      <div className="form-field">
        <label htmlFor="enquiry-name">Your name</label>
        <input
          id="enquiry-name"
          name="patientName"
          type="text"
          defaultValue={defaultName}
          required
          aria-describedby={state.errors?.patientName ? "enquiry-name-error" : undefined}
        />
        {state.errors?.patientName && (
          <p className="field-error" id="enquiry-name-error">
            {state.errors.patientName[0]}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="enquiry-contact">Preferred contact method</label>
        <select
          id="enquiry-contact"
          name="contactMethod"
          defaultValue={defaultPhone ? "phone" : "email"}
        >
          <option value="phone">Phone</option>
          <option value="email">Email</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="enquiry-phone">
          Phone number <span className="optional">(optional)</span>
        </label>
        <input
          id="enquiry-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={defaultPhone}
          aria-describedby={state.errors?.phone ? "enquiry-phone-error" : undefined}
        />
        {state.errors?.phone && (
          <p className="field-error" id="enquiry-phone-error">
            {state.errors.phone[0]}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="enquiry-email">
          Email address <span className="optional">(optional)</span>
        </label>
        <input
          id="enquiry-email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          aria-describedby={state.errors?.email ? "enquiry-email-error" : undefined}
        />
        {state.errors?.email && (
          <p className="field-error" id="enquiry-email-error">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="enquiry-service">{serviceLabel[type]}</label>
        <input
          id="enquiry-service"
          name="requestedService"
          type="text"
          placeholder="For example, a department or test name"
        />
      </div>

      {type === "appointment" && (
        <div className="form-field">
          <label htmlFor="enquiry-date">
            Preferred date <span className="optional">(optional)</span>
          </label>
          <input id="enquiry-date" name="preferredDate" type="date" />
        </div>
      )}

      <div className="form-field full-span">
        <label htmlFor="enquiry-message">
          Short message <span className="optional">(optional)</span>
        </label>
        <textarea id="enquiry-message" name="message" rows={3} maxLength={600} />
      </div>

      <div className="form-field full-span">
        <label className="consent-field" htmlFor="enquiry-consent">
          <input id="enquiry-consent" name="consent" type="checkbox" value="yes" />
          <span>
            I agree to share my name, contact details, and this message with{" "}
            <strong>{resource.name}</strong> so they can respond to my request.
          </span>
        </label>
        {state.errors?.consent && <p className="field-error">{state.errors.consent[0]}</p>}
      </div>

      <div className="form-field full-span">
        <button className="button button-primary" type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Sending…" : "Send request"}
        </button>
      </div>
    </form>
  );
}
