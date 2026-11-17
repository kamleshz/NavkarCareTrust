import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to send or track support requests and manage your organisation.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="join-page">
      <div className="shell join-layout">
        <section className="join-intro">
          <p className="eyebrow">Account</p>
          <h1>Sign in</h1>
          <p className="join-lead">
            Patients can send and track support requests. Organisation teams manage their profile, listings,
            and enquiries.
          </p>
        </section>

        <section className="form-card" aria-labelledby="login-title">
          <div className="form-card-heading">
            <h2 id="login-title">Sign in</h2>
            <p>Use the email address you registered with.</p>
          </div>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </section>
      </div>
    </main>
  );
}
