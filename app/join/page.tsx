import type { Metadata } from "next";
import { PartnerForm } from "@/components/partner-form";
import { partnerTypes, type PartnerType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Join the network",
  description: "Apply to join the NavkarCareTrust cancer support network.",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type } = await searchParams;
  const initialType =
    typeof type === "string" && partnerTypes.includes(type as PartnerType)
      ? (type as PartnerType)
      : undefined;

  return (
    <main className="join-page">
      <div className="shell join-layout">
        <section className="join-intro">
          <p className="eyebrow">Partner with us</p>
          <h1>Join the cancer support network</h1>
          <p className="join-lead">
            Doctors, hospitals, pharmacies, pharma companies, NGOs, trusts,
            temples, industries, and political parties can share their details
            for review by the Navkar Care Trust team.
          </p>
          <div className="review-steps">
            <div><span>1</span><p><strong>Apply</strong>Share your organisation and contact details.</p></div>
            <div><span>2</span><p><strong>Review</strong>Our team verifies information and follows up privately.</p></div>
            <div><span>3</span><p><strong>Publish separately</strong>Only approved resources may later become public listings.</p></div>
          </div>
        </section>
        <section className="form-card" aria-labelledby="application-title">
          <div className="form-card-heading">
          <h2 id="application-title">Provider application</h2>
          <p>Choose your provider type. Applications are reviewed privately.</p>
          </div>
          <PartnerForm initialType={initialType} />
        </section>
      </div>
    </main>
  );
}
