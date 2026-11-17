"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerPatient } from "@/app/actions/auth";
import { initialAccountState } from "@/lib/action-state";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error">{errors[0]}</p>;
}

export function PatientRegisterForm() {
  const [state, formAction, pending] = useActionState(registerPatient, initialAccountState);

  return (
    <form className="partner-form" action={formAction} noValidate>
      <div className="form-field full-span">
        <label htmlFor="patient-name">Your name</label>
        <input id="patient-name" name="fullName" type="text" autoComplete="name" required />
        <FieldError errors={state.errors?.fullName} />
      </div>
      <div className="form-field">
        <label htmlFor="patient-email">Email</label>
        <input id="patient-email" name="email" type="email" autoComplete="email" required />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="form-field">
        <label htmlFor="patient-phone">
          Phone <span className="optional">(optional)</span>
        </label>
        <input id="patient-phone" name="phone" type="tel" autoComplete="tel" />
        <FieldError errors={state.errors?.phone} />
      </div>
      <div className="form-field full-span">
        <label htmlFor="patient-password">Password</label>
        <input id="patient-password" name="password" type="password" autoComplete="new-password" required />
        <p className="field-help">Use at least 8 characters.</p>
        <FieldError errors={state.errors?.password} />
      </div>

      <label className="consent-field full-span" htmlFor="patient-consent">
        <input id="patient-consent" name="consent" type="checkbox" value="yes" required />
        <span>
          I agree that NavkarCareTrust may store these details so I can send and track support requests.
        </span>
      </label>
      <FieldError errors={state.errors?.consent} />

      {state.message && !state.success && (
        <p className="form-message full-span" role="alert">
          {state.message}
        </p>
      )}

      <div className="form-field full-span">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create patient account"}
        </button>
      </div>

      <p className="privacy-note full-span">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
