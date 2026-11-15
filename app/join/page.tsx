import type { Metadata } from "next";
import { PartnerForm } from "@/components/partner-form";

export const metadata: Metadata = {
  title: "Join the network",
  description: "Apply to join the NavkarCareTrust cancer support network.",
};

export default function JoinPage() {
  return (
    <main className="join-page">
      <div className="shell join-layout">
        <section className="join-intro">
          <p className="eyebrow">Partner with us</p>
          <h1>Help families find the right support</h1>
          <p className="join-lead">
            If your organisation supports cancer patients in India, share your
            details for review by the NavkarCareTrust team.
          </p>
          <div className="review-steps">
            <div><span>1</span><p><strong>Apply</strong>Share your organisation and contact details.</p></div>
            <div><span>2</span><p><strong>Review</strong>Our team verifies information and follows up privately.</p></div>
            <div><span>3</span><p><strong>Publish separately</strong>Only approved resources may later become public listings.</p></div>
          </div>
        </section>
        <section className="form-card" aria-labelledby="application-title">
          <div className="form-card-heading">
            <h2 id="application-title">Partner application</h2>
            <p>All fields are required unless marked optional.</p>
          </div>
          <PartnerForm />
        </section>
      </div>
    </main>
  );
}
