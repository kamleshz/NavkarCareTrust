"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitPatientSupportRequest } from "@/app/actions/patient-support";
import { initialPatientSupportState } from "@/lib/action-state";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error">{errors[0]}</p>;
}

export function PatientSupportForm() {
  const [state, formAction, pending] = useActionState(
    submitPatientSupportRequest,
    initialPatientSupportState,
  );

  if (state.success) {
    return (
      <div className="success-panel" role="status">
        <span className="success-mark" aria-hidden="true">✓</span>
        <h2>Request received</h2>
        <p>{state.message}</p>
        <p>
          Your request is private and is not a public directory listing. Our team
          will use your preferred contact method to follow up.
        </p>
        <Link className="button button-outline" href="/">Return to the support directory</Link>
      </div>
    );
  }

  const errors = state.errors || {};

  return (
    <form action={formAction} className="patient-support-form" noValidate>
      <div className="form-trap" aria-hidden="true">
        <label htmlFor="patient-website">Leave this field empty</label>
        <input
          id="patient-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="form-field">
        <label htmlFor="patient-full-name">Your name</label>
        <input
          id="patient-full-name"
          name="fullName"
          autoComplete="name"
          maxLength={120}
          required
          aria-invalid={Boolean(errors.fullName?.length)}
        />
        <FieldError errors={errors.fullName} />
      </div>

      <div className="form-field">
        <label htmlFor="patient-city">City</label>
        <input
          id="patient-city"
          name="city"
          autoComplete="address-level2"
          maxLength={100}
          required
          aria-invalid={Boolean(errors.city?.length)}
        />
        <FieldError errors={errors.city} />
      </div>

      <div className="form-field">
        <label htmlFor="patient-state">State <span className="optional">Optional</span></label>
        <input
          id="patient-state"
          name="state"
          autoComplete="address-level1"
          maxLength={100}
        />
        <FieldError errors={errors.state} />
      </div>

      <div className="form-field">
        <label htmlFor="patient-preferred-contact">Preferred contact</label>
        <select
          id="patient-preferred-contact"
          name="preferredContact"
          defaultValue=""
          required
          aria-invalid={Boolean(errors.preferredContact?.length)}
        >
          <option value="" disabled>Select phone or email</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
        </select>
        <FieldError errors={errors.preferredContact} />
      </div>

      <div className="form-field">
        <label htmlFor="patient-phone">Phone <span className="optional">Optional</span></label>
        <input
          id="patient-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={120}
          aria-invalid={Boolean(errors.phone?.length)}
        />
        <FieldError errors={errors.phone} />
      </div>

      <div className="form-field">
        <label htmlFor="patient-email">Email <span className="optional">Optional</span></label>
        <input
          id="patient-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={120}
          aria-invalid={Boolean(errors.email?.length)}
        />
        <FieldError errors={errors.email} />
      </div>

      <div className="form-field full-span">
        <label htmlFor="patient-note">Brief note <span className="optional">Optional</span></label>
        <textarea
          id="patient-note"
          name="note"
          rows={3}
          maxLength={500}
          aria-invalid={Boolean(errors.note?.length)}
        />
        <p className="field-help">
          Please don’t include diagnoses, medical reports, prescriptions, or other health details.
        </p>
        <FieldError errors={errors.note} />
      </div>

      <div className="form-field full-span">
        <label className="consent-field">
          <input type="checkbox" name="consent" value="yes" required />
          <span>
            I agree that Navkar Care Trust may use these details to contact me
            about this support request.
          </span>
        </label>
        <FieldError errors={errors.consent} />
      </div>

      {state.message && <p className="form-message full-span" role="alert">{state.message}</p>}
      <button className="button button-primary full-span" type="submit" disabled={pending}>
        {pending ? "Sending request…" : "Send support request"}
      </button>
      <p className="privacy-note full-span">
        This form is not for emergencies, medical advice, or treatment registration.
        Your request is reviewed privately and does not create a public listing.
      </p>
    </form>
  );
}
