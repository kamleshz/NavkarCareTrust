import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth/dal";
import type { AccountType } from "@/lib/types";

export const metadata: Metadata = { title: "My profile" };

const accountTypeLabels: Record<AccountType, string> = {
  patient: "Patient",
  organisation: "Organisation",
};

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>My profile</h1>
          <p>The account details NavkarCareTrust uses when you send a request.</p>
        </header>

        <nav className="app-tabs" aria-label="Patient account">
          <Link className="app-tab" href="/account">
            My requests
          </Link>
          <Link className="app-tab" href="/account/profile" aria-current="page">
            My profile
          </Link>
          <Link className="app-tab" href="/support">
            Browse directory
          </Link>
          {user.accountTypes.includes("organisation") && (
            <Link className="app-tab" href="/account/organisations">
              My organisations
            </Link>
          )}
          {user.isPlatformAdmin && (
            <Link className="app-tab" href="/admin">
              Admin panel
            </Link>
          )}
        </nav>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Account details</h2>
              <p>Contact the trust to correct any of these details.</p>
            </div>
          </div>
          <div className="panel-body">
            <dl className="definition-list">
              <div>
                <dt>Name</dt>
                <dd>{user.fullName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{user.phone ?? "Not provided"}</dd>
              </div>
              <div>
                <dt>Account type</dt>
                <dd>{user.accountTypes.map((type) => accountTypeLabels[type]).join(", ")}</dd>
              </div>
            </dl>

            <form action={logout} className="inline-form profile-signout">
              <button className="button button-outline" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
