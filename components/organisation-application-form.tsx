"use client";

import { useActionState, useState } from "react";
import { submitOrganisationApplication } from "@/app/actions/organisation-application";
import { initialOrganisationApplicationState } from "@/lib/action-state";
import { typeSpecificFields } from "@/lib/organisation-application-config";
import {
  organisationApplicationTypeLabels,
  organisationApplicationTypes,
  type OrganisationApplicationType,
} from "@/lib/types";
import {
  DoctorIcon,
  IndustryIcon,
  NgoIcon,
  PharmaIcon,
  PoliticalIcon,
  TempleIcon,
  TrustIcon,
} from "@/components/icons";

const typeIcons: Record<OrganisationApplicationType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  pharma: PharmaIcon,
  doctor: DoctorIcon,
  trust: TrustIcon,
  ngo: NgoIcon,
  temple: TempleIcon,
  industry: IndustryIcon,
  political_party: PoliticalIcon,
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="field-error">{errors[0]}</p>;
}

function OptionalBadge() {
  return <span className="optional">Optional</span>;
}

interface CommonFields {
  organisationName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  serviceAreas: string;
  supportOffered: string;
  description: string;
}

const emptyCommon: CommonFields = {
  organisationName: "",
  contactPerson: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pinCode: "",
  serviceAreas: "",
  supportOffered: "",
  description: "",
};

export function OrganisationApplicationForm() {
  const [state, formAction, pending] = useActionState(
    submitOrganisationApplication,
    initialOrganisationApplicationState,
  );
  const [selectedType, setSelectedType] = useState<OrganisationApplicationType | null>(null);
  const [common, setCommon] = useState<CommonFields>(emptyCommon);

  if (state.success) {
    return (
      <div className="success-panel" role="status">
        <span className="success-mark" aria-hidden="true">✓</span>
        <h2>Registration received</h2>
        <p>{state.message}</p>
        {state.reference && (
          <p className="registration-reference">
            Your reference: <strong>{state.reference}</strong>
          </p>
        )}
        <p>
          Your details remain private while our team reviews them. We will contact you using the details
          you provided.
        </p>
      </div>
    );
  }

  const errors = state.errors || {};
  const isDoctor = selectedType === "doctor";

  function update<K extends keyof CommonFields>(key: K, value: string) {
    setCommon((prev) => ({ ...prev, [key]: value }));
  }

  // Step 1: select organisation type
  if (!selectedType) {
    return (
      <div className="org-apply-flow">
        <StepIndicator step={1} />
        <div className="type-selection" role="radiogroup" aria-label="Organisation type">
          {organisationApplicationTypes.map((type) => {
            const Icon = typeIcons[type];
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked="false"
                className="type-card"
                onClick={() => setSelectedType(type)}
              >
                <span className="type-card-icon">
                  <Icon width={26} height={26} />
                </span>
                <span className="type-card-label">
                  {organisationApplicationTypeLabels[type]}
                </span>
                <span className="type-card-arrow" aria-hidden="true">→</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const specificFields = typeSpecificFields[selectedType];
  const nameLabel = isDoctor ? "Full name" : "Organisation name";

  // Step 2: registration form
  return (
    <div className="org-apply-flow">
      <StepIndicator step={2} />

      <button
        type="button"
        className="back-link"
        onClick={() => setSelectedType(null)}
      >
        ← Change organisation type
      </button>

      <form action={formAction} className="partner-form" noValidate>
        <input type="hidden" name="organisationType" value={selectedType} />

        <div className="form-section-title">
          <h3>{organisationApplicationTypeLabels[selectedType]}</h3>
          <p>Tell us about your participation. Fields marked with a star are required.</p>
        </div>

        {/* Common fields */}
        <div className="form-field full-span">
          <label htmlFor="organisationName">
            {nameLabel} <span className="required-star" aria-hidden="true">*</span>
          </label>
          <input
            id="organisationName"
            name="organisationName"
            value={common.organisationName}
            onChange={(e) => update("organisationName", e.target.value)}
            required
          />
          <FieldError errors={errors.organisationName} />
        </div>

        <div className="form-field full-span">
          <label htmlFor="contactPerson">
            Contact person {isDoctor ? "" : <span className="required-star" aria-hidden="true">*</span>}
          </label>
          <input
            id="contactPerson"
            name="contactPerson"
            value={common.contactPerson}
            onChange={(e) => update("contactPerson", e.target.value)}
          />
          <FieldError errors={errors.contactPerson} />
        </div>

        <fieldset className="contact-fieldset full-span">
          <legend>Contact details</legend>
          <p className="field-help">Add at least one: mobile number or email.</p>
          <div className="contact-fields">
            <div className="form-field">
              <label htmlFor="mobile">Mobile number</label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                value={common.mobile}
                onChange={(e) => update("mobile", e.target.value)}
                autoComplete="tel"
              />
              <FieldError errors={errors.mobile} />
            </div>
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={common.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
              />
              <FieldError errors={errors.email} />
            </div>
          </div>
        </fieldset>

        <div className="form-field full-span">
          <label htmlFor="address">
            Address <OptionalBadge />
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            value={common.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="city">
            City <span className="required-star" aria-hidden="true">*</span>
          </label>
          <input
            id="city"
            name="city"
            value={common.city}
            onChange={(e) => update("city", e.target.value)}
            required
          />
          <FieldError errors={errors.city} />
        </div>
        <div className="form-field">
          <label htmlFor="state">
            State <span className="required-star" aria-hidden="true">*</span>
          </label>
          <input
            id="state"
            name="state"
            value={common.state}
            onChange={(e) => update("state", e.target.value)}
            required
          />
          <FieldError errors={errors.state} />
        </div>
        <div className="form-field">
          <label htmlFor="pinCode">
            PIN code <OptionalBadge />
          </label>
          <input
            id="pinCode"
            name="pinCode"
            inputMode="numeric"
            maxLength={6}
            value={common.pinCode}
            onChange={(e) => update("pinCode", e.target.value)}
          />
          <FieldError errors={errors.pinCode} />
        </div>

        <div className="form-field full-span">
          <label htmlFor="serviceAreas">
            Areas where support can be provided <OptionalBadge />
          </label>
          <input
            id="serviceAreas"
            name="serviceAreas"
            placeholder="e.g. Mumbai, Pune, Maharashtra"
            value={common.serviceAreas}
            onChange={(e) => update("serviceAreas", e.target.value)}
          />
        </div>

        <div className="form-field full-span">
          <label htmlFor="supportOffered">
            Support offered <OptionalBadge />
          </label>
          <textarea
            id="supportOffered"
            name="supportOffered"
            rows={3}
            value={common.supportOffered}
            onChange={(e) => update("supportOffered", e.target.value)}
          />
        </div>

        <div className="form-field full-span">
          <label htmlFor="description">
            Short description of participation <OptionalBadge />
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={600}
            value={common.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        {/* Type-specific fields */}
        <div className="form-section-title">
          <h3>Additional details</h3>
          <p>Relevant to {organisationApplicationTypeLabels[selectedType].toLowerCase()}.</p>
        </div>

        {specificFields.map((field) => (
          <div className="form-field full-span" key={field.name}>
            <label htmlFor={field.name}>
              {field.label}
              {field.optional ? <OptionalBadge /> : null}
            </label>
            {field.textarea ? (
              <textarea
                id={field.name}
                name={field.name}
                rows={3}
                defaultValue=""
                placeholder={field.placeholder}
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                defaultValue=""
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}

        {/* Consent */}
        <label className="consent-check full-span">
          <input type="checkbox" name="consent" value="yes" required />
          <span>
            I agree to share these details with Navkar Care Trust for review and to be contacted about
            my registration.
          </span>
        </label>
        <FieldError errors={errors.consent} />

        {state.message && !state.success && (
          <p className="form-message" role="alert">{state.message}</p>
        )}

        <button className="button button-primary full-span" type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit registration"}
        </button>
        <p className="privacy-note full-span">
          Registrations are private during review and are published only after approval.
        </p>
      </form>
    </div>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <ol className="step-indicator" aria-label="Registration progress">
      <li className={step >= 1 ? "is-active" : ""}>
        <span className="step-num">1</span>
        <span>Select Type</span>
      </li>
      <li className="step-connector" aria-hidden="true" />
      <li className={step >= 2 ? "is-active" : ""}>
        <span className="step-num">2</span>
        <span>Registration Details</span>
      </li>
    </ol>
  );
}
