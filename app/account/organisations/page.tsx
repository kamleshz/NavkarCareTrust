import Link from "next/link";
import type { Metadata } from "next";
import {
  OrganisationRegistrationBadge,
  PartnershipBadge,
  RoleBadge,
  VerificationBadge,
} from "@/components/badges";
import { requireUser } from "@/lib/auth/dal";
import { listUserMemberships } from "@/lib/organisations";
import { toObjectId } from "@/lib/object-id";
import { organisationTypeLabels } from "@/lib/types";

export const metadata: Metadata = { title: "My organisations" };

export default async function OrganisationsPage() {
  const user = await requireUser("/account/organisations");
  const userId = toObjectId(user.id);
  const memberships = userId ? await listUserMemberships(userId) : [];

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>My organisations</h1>
          <p>
            Signed in as {user.fullName} ({user.email}). You can belong to more than one organisation and
            switch between them here.
          </p>
        </header>

        <nav className="app-tabs" aria-label="Account">
          {user.accountTypes.includes("patient") && (
            <Link className="app-tab" href="/account">
              My requests
            </Link>
          )}
          <Link className="app-tab" href="/account/organisations" aria-current="page">
            My organisations
          </Link>
          <Link className="app-tab" href="/support">
            Browse directory
          </Link>
          {user.isPlatformAdmin && (
            <Link className="app-tab" href="/admin">
              Admin panel
            </Link>
          )}
        </nav>

        {memberships.length === 0 ? (
          <section className="panel">
            <div className="panel-body">
              <p className="empty-note">
                You are not part of an organisation yet. Register a hospital, clinic, blood bank,
                diagnostic centre, pharmacy, trust, or NGO to manage listings and enquiries.
              </p>
              <p className="privacy-note">
                <Link className="button button-primary" href="/register/organisation">
                  Register an organisation
                </Link>
              </p>
            </div>
          </section>
        ) : (
          <div className="panel-grid">
            {memberships.map((membership) => (
              <section className="panel" key={membership.organisation.id}>
                <div className="panel-header">
                  <div>
                    <h2>{membership.organisation.name}</h2>
                    <p>{organisationTypeLabels[membership.organisation.type]}</p>
                  </div>
                  <RoleBadge role={membership.role} />
                </div>
                <div className="panel-body">
                  {(membership.organisation.registrationStatus !== "approved" ||
                    membership.organisation.verificationStatus !== "verified" ||
                    membership.organisation.partnershipStatus === "none") && (
                    <p className="notice">
                      Organisation verification, listing publication, and confirmed partnership are tracked
                      separately by the platform team.
                    </p>
                  )}
                  <div className="actions-cell">
                    <OrganisationRegistrationBadge status={membership.organisation.registrationStatus} />
                    <VerificationBadge status={membership.organisation.verificationStatus} />
                    <PartnershipBadge status={membership.organisation.partnershipStatus} />
                  </div>
                  {membership.organisation.reviewNote && (
                    <p className="field-help">Reviewer note: {membership.organisation.reviewNote}</p>
                  )}
                  <p className="privacy-note">
                    <Link className="button button-outline" href={`/organisation/${membership.organisation.slug}`}>
                      Open dashboard
                    </Link>
                  </p>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
