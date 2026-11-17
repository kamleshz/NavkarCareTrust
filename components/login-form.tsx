"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { initialAccountState } from "@/lib/action-state";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error">{errors[0]}</p>;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initialAccountState);

  return (
    <form className="partner-form" action={formAction} noValidate>
      <div className="form-field full-span">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="form-field full-span">
        <label htmlFor="login-password">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required />
        <FieldError errors={state.errors?.password} />
      </div>

      {next && <input type="hidden" name="next" value={next} />}

      {state.message && !state.success && (
        <p className="form-message full-span" role="alert">
          {state.message}
        </p>
      )}

      <div className="form-field full-span">
        <button className="button button-primary" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </div>

      <p className="privacy-note full-span">
        New patient? <Link href="/register">Create a patient account</Link> · Organisation?{" "}
        <Link href="/register/organisation">Register your organisation</Link>
      </p>
    </form>
  );
}
