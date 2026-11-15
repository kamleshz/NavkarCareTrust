import type { Metadata } from "next";
import { PatientSupportForm } from "@/components/patient-support-form";

export const metadata: Metadata = {
  title: "Request patient support",
  description:
    "Send a private request for help finding cancer care and support resources.",
};

export default function PatientSupportPage() {
  return (
    <main className="join-page patient-support-page">
      <div className="shell join-layout">
        <section className="join-intro">
          <p className="eyebrow">Patient support</p>
          <h1>Tell us how to reach you</h1>
          <p className="join-lead">
            Share a few contact details and our team can follow up to help you
            navigate the support directory.
          </p>
          <div className="review-steps">
            <div><span>1</span><p><strong>Send a request</strong>Choose your preferred contact method.</p></div>
            <div><span>2</span><p><strong>Private review</strong>Your request is stored privately for follow-up.</p></div>
            <div><span>3</span><p><strong>Follow up</strong>Our team will contact you using your preference.</p></div>
          </div>
          <p className="patient-safety-note">
            This is not an emergency service and does not replace advice from a
            qualified healthcare professional.
          </p>
        </section>

        <section className="form-card" aria-labelledby="patient-request-title">
          <div className="form-card-heading">
            <h2 id="patient-request-title">Patient support request</h2>
            <p>Only contact and location details are requested.</p>
          </div>
          <PatientSupportForm />
        </section>
      </div>
    </main>
  );
}
