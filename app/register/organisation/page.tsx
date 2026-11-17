import type { Metadata } from "next";
import Link from "next/link";
import { OrganisationRegisterForm } from "@/components/organisation-register-form";
import { organisationTypes, type OrganisationType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Organisation registration",
  description:
    "Register a hospital, clinic, blood bank, diagnostic centre, pharmacy, pharmaceutical company, trust, or NGO.",
};

export default async function OrganisationRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialType = organisationTypes.includes(type as OrganisationType)
    ? (type as OrganisationType)
    : undefined;

  return (
    <main className="join-page">
      <div className="shell join-layout">
        <section className="join-intro">
          <p className="eyebrow">For organisations</p>
          <h1>List your organisation</h1>
          <p className="join-lead">
            Hospitals and medical centres, doctor practices, blood banks, diagnostic centres, pharmacies,
            pharmaceutical companies, trusts, and NGOs can register and manage their own listings.
          </p>
          <div className="review-steps">
            <div><span>1</span><p><strong>Register</strong>Create the organisation account and first owner.</p></div>
            <div><span>2</span><p><strong>Review</strong>An administrator reviews the registration.</p></div>
            <div><span>3</span><p><strong>Publish</strong>Create listings and submit them for approval.</p></div>
          </div>
        </section>

        <section className="form-card" aria-labelledby="org-register-title">
          <div className="form-card-heading">
            <h2 id="org-register-title">Organisation registration</h2>
            <p>
              Registering as a patient instead? <Link href="/register">Create a patient account</Link>.
            </p>
          </div>
          <OrganisationRegisterForm initialType={initialType} />
        </section>
      </div>
    </main>
  );
}
