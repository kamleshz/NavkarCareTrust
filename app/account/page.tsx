import Link from "next/link";
import type { Metadata } from "next";
import { AppointmentBadge, EnquiryStatusBadge } from "@/components/badges";
import { cancelEnquiry } from "@/app/actions/enquiry";
import { requireUser } from "@/lib/auth/dal";
import { listPatientEnquiries } from "@/lib/enquiries";
import { toObjectId } from "@/lib/object-id";
import { enquiryTypeLabels } from "@/lib/types";

export const metadata: Metadata = { title: "My requests" };

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AccountPage() {
  const user = await requireUser("/account");
  const userId = toObjectId(user.id);
  const enquiries = userId ? await listPatientEnquiries(userId) : [];

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>My requests</h1>
          <p>
            Signed in as {user.fullName} ({user.email}). Track the requests you have sent and browse the
            directory for more support.
          </p>
        </header>

        <nav className="app-tabs" aria-label="Patient account">
          <Link className="app-tab" href="/account" aria-current="page">
            My requests
          </Link>
          <Link className="app-tab" href="/account/profile">
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
              <h2>Requests</h2>
              <p>
                {enquiries.length} {enquiries.length === 1 ? "request" : "requests"} · visible only to you
                and the organisation you contacted
              </p>
            </div>
            <Link className="button button-outline" href="/support">
              Find support
            </Link>
          </div>

          {enquiries.length === 0 ? (
            <div className="panel-body">
              <p className="empty-note">
                You have not sent any requests yet. Open a listing in the directory and choose an enquiry
                action to get started.
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Request</th>
                    <th scope="col">Organisation</th>
                    <th scope="col">Status</th>
                    <th scope="col">Sent</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td>{enquiry.reference}</td>
                      <td>
                        <p>{enquiryTypeLabels[enquiry.type]}</p>
                        {enquiry.listingName && <p className="card-location">{enquiry.listingName}</p>}
                        {enquiry.preferredDate && (
                          <p className="card-location">Preferred date: {enquiry.preferredDate}</p>
                        )}
                      </td>
                      <td>{enquiry.organisationName ?? "NavkarCareTrust"}</td>
                      <td>
                        <EnquiryStatusBadge status={enquiry.status} />
                        {enquiry.type === "appointment" && (
                          <p>
                            <AppointmentBadge confirmed={enquiry.appointmentConfirmed} />
                          </p>
                        )}
                      </td>
                      <td>{formatDateTime(enquiry.createdAt)}</td>
                      <td>
                        {enquiry.status === "requested" && (
                          <form action={cancelEnquiry}>
                            <input type="hidden" name="enquiryId" value={enquiry.id} />
                            <button className="link-button" type="submit">
                              Cancel
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="directory-guidance">
          Information here is for navigation only. Confirm availability, costs, and eligibility directly
          with each organisation.
        </p>
      </div>
    </main>
  );
}
