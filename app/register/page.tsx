import type { Metadata } from "next";
import Link from "next/link";
import { PatientRegisterForm } from "@/components/patient-register-form";

export const metadata: Metadata = {
  title: "Patient registration",
  description: "Create a patient account to send and track cancer care support requests.",
};

export default function PatientRegisterPage() {
  return (
    <main className="join-page">
      <div className="shell join-layout">
        <section className="join-intro">
          <p className="eyebrow">For patients</p>
          <h1>Create your patient account</h1>
          <p className="join-lead">
            Use your account to request appointments, ask about diagnostic services, medicine assistance, or
            financial support, and follow each request.
          </p>
          <div className="review-steps">
            <div><span>1</span><p><strong>Register</strong>Share only your name and contact details.</p></div>
            <div><span>2</span><p><strong>Send a request</strong>Your details are shared only after you consent.</p></div>
            <div><span>3</span><p><strong>Track responses</strong>See each status until it is completed.</p></div>
          </div>
          <p className="patient-safety-note">
            This is not an emergency service and does not replace advice from a qualified healthcare
            professional.
          </p>
        </section>

        <section className="form-card" aria-labelledby="patient-register-title">
          <div className="form-card-heading">
            <h2 id="patient-register-title">Patient registration</h2>
            <p>
              Registering as an organisation instead?{" "}
              <Link href="/register/organisation">List your organisation</Link>.
            </p>
          </div>
          <PatientRegisterForm />
        </section>
      </div>
    </main>
  );
}
