"use client";

import { useActionState } from "react";
import {
  initialApplicationState,
  submitPartnerApplication,
} from "@/app/actions/partner-application";
import { partnerTypeLabels, partnerTypes, type PartnerType } from "@/lib/types";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error">{errors[0]}</p>;
}

export function PartnerForm({ initialType }: { initialType?: PartnerType }) {
  const [state, formAction, pending] = useActionState(
    submitPartnerApplication,
    initialApplicationState,
  );

  if (state.success) {
    return (
      <div className="success-panel" role="status">
        <span className="success-mark" aria-hidden="true">✓</span>
        <h2>Application received</h2>
        <p>{state.message}</p>
        <p>
          Your details remain private while our team reviews them. Submitting this
          form does not create a public directory listing.
        </p>
      </div>
    );
  }

  const errors = state.errors || {};

  return (
    <form action={formAction} className="partner-form" noValidate>
      <div className="form-field full-span">
        <label htmlFor="organisationName">Provider or organisation name</label>
        <input id="organisationName" name="organisationName" required />
        <FieldError errors={errors.organisationName} />
      </div>

      <div className="form-field full-span">
        <label htmlFor="partnerType">Provider type</label>
        <select id="partnerType" name="partnerType" defaultValue={initialType || ""} required>
          <option value="" disabled>Select a partner type</option>
          {partnerTypes.map((type) => (
            <option key={type} value={type}>{partnerTypeLabels[type]}</option>
          ))}
        </select>
        <FieldError errors={errors.partnerType} />
      </div>

      <div className="form-field">
        <label htmlFor="city">City</label>
        <input id="city" name="city" required />
        <FieldError errors={errors.city} />
      </div>
      <div className="form-field">
        <label htmlFor="state">State</label>
        <input id="state" name="state" required />
        <FieldError errors={errors.state} />
      </div>

      <div className="form-field full-span">
        <label htmlFor="contactPerson">Contact person</label>
        <input id="contactPerson" name="contactPerson" required />
        <FieldError errors={errors.contactPerson} />
      </div>

      <fieldset className="contact-fieldset full-span">
        <legend>Work contact</legend>
        <p className="field-help">Add at least one: email or phone.</p>
        <div className="contact-fields">
          <div className="form-field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" />
            <FieldError errors={errors.email} />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" />
            <FieldError errors={errors.phone} />
          </div>
        </div>
      </fieldset>

      <div className="form-field full-span">
        <label htmlFor="note">Note <span className="optional">Optional</span></label>
        <textarea id="note" name="note" rows={5} maxLength={1000} />
        <FieldError errors={errors.note} />
      </div>

      {state.message && (
        <p className="form-message" role="alert">{state.message}</p>
      )}
      <button className="button button-primary full-span" type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit application"}
      </button>
      <p className="privacy-note full-span">
        Applications are private and reviewed before any separate directory listing
        is published.
      </p>
    </form>
  );
}
