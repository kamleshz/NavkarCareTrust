"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerOrganisation } from "@/app/actions/auth";
import { initialAccountState } from "@/lib/action-state";
import { organisationTypeLabels, organisationTypes, type OrganisationType } from "@/lib/types";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error">{errors[0]}</p>;
}

export function OrganisationRegisterForm({ initialType }: { initialType?: OrganisationType }) {
  const [state, formAction, pending] = useActionState(registerOrganisation, initialAccountState);

  return (
    <form className="partner-form" action={formAction} noValidate>
      <div className="form-field full-span">
        <label htmlFor="org-name">Organisation name</label>
        <input id="org-name" name="organisationName" type="text" required />
        <FieldError errors={state.errors?.organisationName} />
      </div>
      <div className="form-field full-span">
        <label htmlFor="org-type">Organisation type</label>
        <select id="org-type" name="type" defaultValue={initialType ?? ""} required>
          <option value="" disabled>
            Choose a type
          </option>
          {organisationTypes.map((type) => (
            <option value={type} key={type}>
              {organisationTypeLabels[type]}
            </option>
          ))}
        </select>
        <FieldError errors={state.errors?.type} />
      </div>
      <div className="form-field full-width-field full-span">
        <label htmlFor="org-description">
          About the organisation <span className="optional">(optional)</span>
        </label>
        <textarea id="org-description" name="description" rows={3} />
        <FieldError errors={state.errors?.description} />
      </div>
      <div className="form-field">
        <label htmlFor="org-city">City</label>
        <input id="org-city" name="city" type="text" autoComplete="address-level2" required />
        <FieldError errors={state.errors?.city} />
      </div>
      <div className="form-field">
        <label htmlFor="org-state">State</label>
        <input id="org-state" name="state" type="text" autoComplete="address-level1" required />
        <FieldError errors={state.errors?.state} />
      </div>
      <div className="form-field">
        <label htmlFor="org-contact">Contact person</label>
        <input id="org-contact" name="contactPerson" type="text" required />
        <FieldError errors={state.errors?.contactPerson} />
      </div>
      <div className="form-field">
        <label htmlFor="org-phone">
          Phone <span className="optional">(optional)</span>
        </label>
        <input id="org-phone" name="phone" type="tel" autoComplete="tel" />
        <FieldError errors={state.errors?.phone} />
      </div>
      <div className="form-field full-span">
        <label htmlFor="org-email">Work email</label>
        <input id="org-email" name="email" type="email" autoComplete="email" required />
        <FieldError errors={state.errors?.email} />
      </div>
      <div className="form-field full-span">
        <label htmlFor="org-website">
          Website <span className="optional">(optional)</span>
        </label>
        <input id="org-website" name="website" type="url" placeholder="https://" />
        <FieldError errors={state.errors?.website} />
      </div>
      <div className="form-field full-span">
        <label htmlFor="org-password">Password</label>
        <input id="org-password" name="password" type="password" autoComplete="new-password" required />
        <p className="field-help">Use at least 8 characters.</p>
        <FieldError errors={state.errors?.password} />
      </div>

      <label className="consent-field full-span" htmlFor="org-consent">
        <input id="org-consent" name="consent" type="checkbox" value="yes" required />
        <span>
          I confirm I am authorised to register this organisation and agree that NavkarCareTrust may review
          these details before publishing any listing.
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
          {pending ? "Creating organisation…" : "Create organisation account"}
        </button>
      </div>

      <p className="privacy-note full-span">
        Already registered? <Link href="/login?next=/account/organisations">Sign in</Link>
      </p>
    </form>
  );
}
