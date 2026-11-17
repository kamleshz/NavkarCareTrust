import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { archiveListing, submitListing } from "@/app/actions/listing";
import { deleteBranch, removeMember, updateMemberRole } from "@/app/actions/organisation";
import {
  AppointmentBadge,
  EnquiryStatusBadge,
  ListingStatusBadge,
  OrganisationRegistrationBadge,
  PartnershipBadge,
  RoleBadge,
  VerificationBadge,
} from "@/components/badges";
import {
  BranchForm,
  ClaimRequestForm,
  EnquiryResponseForm,
  ListingForm,
  MemberInviteForm,
  OrganisationProfileForm,
  StockForm,
} from "@/components/organisation-forms";
import { requireOrganisationContext } from "@/lib/auth/guards";
import { listOrganisationEnquiries } from "@/lib/enquiries";
import { listOrganisationListings, listUnclaimedListings } from "@/lib/listings";
import { getOrganisationBySlug, listBranches, listOrganisationMembers } from "@/lib/organisations";
import { toObjectId } from "@/lib/object-id";
import { can, type OrganisationCapability } from "@/lib/permissions";
import {
  categoryLabels,
  defaultCategoryByOrganisationType,
  enquiryTypeLabels,
  membershipRoleLabels,
  membershipRoles,
  organisationTypeLabels,
} from "@/lib/types";

export const metadata: Metadata = { title: "Organisation dashboard" };

const tabs = ["overview", "profile", "branches", "listings", "enquiries", "team", "claims"] as const;
type Tab = (typeof tabs)[number];

const tabCapability: Partial<Record<Tab, OrganisationCapability>> = {
  profile: "editProfile",
  branches: "manageBranches",
  listings: "createListings",
  enquiries: "respondToEnquiries",
  team: "manageMembers",
  claims: "createListings",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

export default async function OrganisationDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { tab: tabParam, q: claimQuery } = await searchParams;

  const organisation = await getOrganisationBySlug(slug);
  if (!organisation) notFound();

  const { role } = await requireOrganisationContext(organisation.id, "viewDashboard");
  const organisationId = toObjectId(organisation.id)!;

  const visibleTabs = tabs.filter((tab) => {
    const capability = tabCapability[tab];
    return !capability || can(role, capability);
  });

  const requestedTab = visibleTabs.includes(tabParam as Tab) ? (tabParam as Tab) : "overview";

  const [branches, listings, enquiries, members] =
    requestedTab === "overview"
      ? await Promise.all([
          listBranches(organisationId),
          listOrganisationListings(organisationId),
          listOrganisationEnquiries(organisationId),
          listOrganisationMembers(organisationId),
        ])
      : await Promise.all([
          visibleTabs.includes("branches") ? listBranches(organisationId) : Promise.resolve([]),
          visibleTabs.includes("listings") ? listOrganisationListings(organisationId) : Promise.resolve([]),
          visibleTabs.includes("enquiries") ? listOrganisationEnquiries(organisationId) : Promise.resolve([]),
          visibleTabs.includes("team") ? listOrganisationMembers(organisationId) : Promise.resolve([]),
        ]);

  const unclaimed =
    requestedTab === "claims" ? await listUnclaimedListings(claimQuery ?? "") : [];

  const tabHref = (tab: Tab) => (tab === "overview" ? `/organisation/${slug}` : `/organisation/${slug}?tab=${tab}`);

  return (
    <main className="app-main">
      <div className="app-container">
        <header className="app-header">
          <h1>{organisation.name}</h1>
          <p>
            {organisationTypeLabels[organisation.type]} · you are signed in as {membershipRoleLabels[role]}
          </p>
          <div className="actions-cell">
            <OrganisationRegistrationBadge status={organisation.registrationStatus} />
            <VerificationBadge status={organisation.verificationStatus} />
            <PartnershipBadge status={organisation.partnershipStatus} />
            <span className="status-badge">
              {organisation.enquiriesEnabled ? "Enquiries open" : "Enquiries closed"}
            </span>
          </div>
        </header>

        <nav className="app-tabs" aria-label="Organisation dashboard">
          {visibleTabs.map((tab) => (
            <Link className="app-tab" key={tab} href={tabHref(tab)} aria-current={tab === requestedTab ? "page" : undefined}>
              {tab[0].toUpperCase() + tab.slice(1)}
            </Link>
          ))}
          <Link className="app-tab" href="/account/organisations">
            All organisations
          </Link>
        </nav>

        {organisation.registrationStatus === "rejected" && organisation.reviewNote && (
          <p className="notice is-error">
            The platform team returned this registration: {organisation.reviewNote}
          </p>
        )}

        {requestedTab === "overview" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Overview</h2>
                  <p>Verification, publication, and partnership are reviewed and tracked separately.</p>
                </div>
              </div>
              <div className="panel-body">
                <div className="panel-grid">
                  <div className="stat">
                    <span>Listings</span>
                    <strong>{listings.length}</strong>
                  </div>
                  <div className="stat">
                    <span>Published</span>
                    <strong>{listings.filter((listing) => listing.publicationStatus === "published").length}</strong>
                  </div>
                  <div className="stat">
                    <span>Awaiting review</span>
                    <strong>
                      {listings.filter((listing) => listing.publicationStatus === "pending-review").length}
                    </strong>
                  </div>
                  <div className="stat">
                    <span>Branches</span>
                    <strong>{branches.length}</strong>
                  </div>
                  <div className="stat">
                    <span>Open requests</span>
                    <strong>{enquiries.filter((enquiry) => enquiry.status === "requested").length}</strong>
                  </div>
                  <div className="stat">
                    <span>Team members</span>
                    <strong>{members.length}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Organisation details</h2>
                  <p>Kept private to your team and platform administrators.</p>
                </div>
              </div>
              <div className="panel-body">
                <dl className="definition-list">
                  <div>
                    <dt>Contact email</dt>
                    <dd>{organisation.email ?? "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{organisation.phone ?? "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Website</dt>
                    <dd>{organisation.website ?? "Not set"}</dd>
                  </div>
                  <div>
                    <dt>Enquiries</dt>
                    <dd>{organisation.enquiriesEnabled ? "Accepting requests" : "Not accepting requests"}</dd>
                  </div>
                </dl>
                {organisation.description && <p className="field-help">{organisation.description}</p>}
              </div>
            </section>
          </>
        )}

        {requestedTab === "profile" && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Edit profile</h2>
                <p>Update your public contact details and choose whether to accept enquiries.</p>
              </div>
            </div>
            <OrganisationProfileForm
              organisationId={organisation.id}
              slug={slug}
              organisation={{
                name: organisation.name,
                description: organisation.description,
                email: organisation.email,
                phone: organisation.phone,
                website: organisation.website,
                enquiriesEnabled: organisation.enquiriesEnabled,
              }}
            />
          </section>
        )}

        {requestedTab === "branches" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Add a branch</h2>
                  <p>Store the locality, city, state, PIN, and browsing region separately for each location.</p>
                </div>
              </div>
              <BranchForm organisationId={organisation.id} slug={slug} />
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Branches</h2>
                  <p>{branches.length} locations</p>
                </div>
              </div>
              {branches.length === 0 ? (
                <div className="panel-body">
                  <p className="empty-note">No branches yet. Add your first location above.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Branch</th>
                        <th scope="col">Location</th>
                        <th scope="col">Contact</th>
                        <th scope="col">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map((branch) => (
                        <tr key={branch.id}>
                          <td>{branch.name}</td>
                          <td>
                            <p>{[branch.locality, branch.city, branch.state].filter(Boolean).join(", ") || "—"}</p>
                            <p className="card-location">
                              {branch.pinCode ? `PIN ${branch.pinCode}` : ""}
                              {branch.pinCode && branch.region ? " · " : ""}
                              {branch.region ? branch.region.replace(/-/g, " ") : ""}
                            </p>
                          </td>
                          <td>
                            {branch.phone && <p>{branch.phone}</p>}
                            {branch.email && <p>{branch.email}</p>}
                            {!branch.phone && !branch.email && "—"}
                          </td>
                          <td>
                            <form action={deleteBranch}>
                              <input type="hidden" name="organisationId" value={organisation.id} />
                              <input type="hidden" name="slug" value={slug} />
                              <input type="hidden" name="branchId" value={branch.id} />
                              <button className="link-button" type="submit">
                                Remove
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {requestedTab === "listings" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Create a listing</h2>
                  <p>New listings start as drafts. Submit them for administrator review when ready.</p>
                </div>
              </div>
              <ListingForm
                organisationId={organisation.id}
                slug={slug}
                branches={branches}
                defaultCategory={defaultCategoryByOrganisationType[organisation.type]}
              />
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Your listings</h2>
                  <p>{listings.length} listings · changes to published listings are reviewed before they go live</p>
                </div>
              </div>
              {listings.length === 0 ? (
                <div className="panel-body">
                  <p className="empty-note">No listings yet. Create a draft above, or claim an imported listing.</p>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">Listing</th>
                        <th scope="col">Status</th>
                        <th scope="col">Last reviewed</th>
                        <th scope="col">Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => (
                        <tr key={listing.id}>
                          <td>
                            <p>
                              <strong>{listing.name}</strong>
                            </p>
                            <p className="card-location">
                              {categoryLabels[listing.category]}
                              {listing.city ? ` · ${listing.city}` : ""}
                            </p>
                          </td>
                          <td>
                            <ListingStatusBadge status={listing.publicationStatus} />
                            {listing.reviewPending && (
                              <p>
                                <span className="status-badge is-pending">Changes under review</span>
                              </p>
                            )}
                            {listing.reviewNote && <p className="field-error">{listing.reviewNote}</p>}
                          </td>
                          <td>{formatDate(listing.lastReviewedAt)}</td>
                          <td>
                            <div className="actions-cell">
                              {(listing.publicationStatus === "draft" ||
                                listing.publicationStatus === "archived") && (
                                <form action={submitListing}>
                                  <input type="hidden" name="organisationId" value={organisation.id} />
                                  <input type="hidden" name="slug" value={slug} />
                                  <input type="hidden" name="listingId" value={listing.id} />
                                  <button className="link-button" type="submit">
                                    Submit for review
                                  </button>
                                </form>
                              )}
                              {listing.publicationStatus === "published" && (
                                <form action={archiveListing}>
                                  <input type="hidden" name="organisationId" value={organisation.id} />
                                  <input type="hidden" name="slug" value={slug} />
                                  <input type="hidden" name="listingId" value={listing.id} />
                                  <button className="link-button" type="submit">
                                    Archive
                                  </button>
                                </form>
                              )}
                            </div>
                            {listing.category === "blood-banks" && can(role, "manageServices") && (
                              <StockForm
                                organisationId={organisation.id}
                                slug={slug}
                                listingId={listing.id}
                                level={listing.stockLevel}
                              />
                            )}
                            <details>
                              <summary className="link-button">Edit details</summary>
                              <ListingForm
                                organisationId={organisation.id}
                                slug={slug}
                                branches={branches}
                                listing={listing}
                                defaultCategory={listing.category}
                              />
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {requestedTab === "enquiries" && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Requests</h2>
                <p>{enquiries.length} requests · only your team and platform administrators can see these</p>
              </div>
            </div>
            {enquiries.length === 0 ? (
              <div className="panel-body">
                <p className="empty-note">No requests yet.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Patient</th>
                      <th scope="col">Request</th>
                      <th scope="col">Status</th>
                      <th scope="col">Respond</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enquiry) => (
                      <tr key={enquiry.id}>
                        <td>{enquiry.reference}</td>
                        <td>
                          <p>{enquiry.patientName}</p>
                          <p className="card-location">
                            {enquiry.contactMethod === "phone" ? enquiry.phone : enquiry.email}
                          </p>
                        </td>
                        <td>
                          <p>{enquiryTypeLabels[enquiry.type]}</p>
                          {enquiry.listingName && <p className="card-location">{enquiry.listingName}</p>}
                          {enquiry.requestedService && (
                            <p className="card-location">{enquiry.requestedService}</p>
                          )}
                          {enquiry.preferredDate && (
                            <p className="card-location">Preferred date: {enquiry.preferredDate}</p>
                          )}
                          {enquiry.message && <p>{enquiry.message}</p>}
                        </td>
                        <td>
                          <EnquiryStatusBadge status={enquiry.status} />
                          {enquiry.type === "appointment" && (
                            <p>
                              <AppointmentBadge confirmed={enquiry.appointmentConfirmed} />
                            </p>
                          )}
                        </td>
                        <td>
                          <EnquiryResponseForm
                            organisationId={organisation.id}
                            slug={slug}
                            enquiryId={enquiry.id}
                            currentStatus={enquiry.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {requestedTab === "team" && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Add a team member</h2>
                  <p>Owners, administrators, and staff have different permissions.</p>
                </div>
              </div>
              <div className="panel-body">
                <MemberInviteForm organisationId={organisation.id} slug={slug} />
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Team</h2>
                  <p>{members.length} members</p>
                </div>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Member</th>
                      <th scope="col">Role</th>
                      <th scope="col">Status</th>
                      <th scope="col">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.email ?? member.userId}</td>
                        <td>
                          <RoleBadge role={member.role} />
                        </td>
                        <td>
                          <span className="status-badge is-muted">{member.status}</span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <form className="inline-form" action={updateMemberRole}>
                              <input type="hidden" name="organisationId" value={organisation.id} />
                              <input type="hidden" name="slug" value={slug} />
                              <input type="hidden" name="membershipId" value={member.id} />
                              <label className="sr-only" htmlFor={`role-${member.id}`}>
                                Role
                              </label>
                              <select id={`role-${member.id}`} name="role" defaultValue={member.role}>
                                {membershipRoles.map((value) => (
                                  <option key={value} value={value}>
                                    {membershipRoleLabels[value]}
                                  </option>
                                ))}
                              </select>
                              <button className="button button-outline" type="submit">
                                Save
                              </button>
                            </form>
                            <form action={removeMember}>
                              <input type="hidden" name="organisationId" value={organisation.id} />
                              <input type="hidden" name="slug" value={slug} />
                              <input type="hidden" name="membershipId" value={member.id} />
                              <button className="link-button" type="submit">
                                Remove
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {requestedTab === "claims" && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Claim an imported listing</h2>
                <p>Imported listings are unclaimed. Request ownership and an administrator will review it.</p>
              </div>
            </div>
            <div className="panel-body">
              <form className="inline-form" method="get">
                <input type="hidden" name="tab" value="claims" />
                <label className="sr-only" htmlFor="claim-search">
                  Search unclaimed listings
                </label>
                <input
                  id="claim-search"
                  name="q"
                  type="search"
                  defaultValue={claimQuery ?? ""}
                  placeholder="Search by name, city, or locality"
                />
                <button className="button button-outline" type="submit">
                  Search
                </button>
              </form>
            </div>
            {unclaimed.length === 0 ? (
              <div className="panel-body">
                <p className="empty-note">No unclaimed listings match this search.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Listing</th>
                      <th scope="col">Location</th>
                      <th scope="col">Claim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unclaimed.map((listing) => (
                      <tr key={listing.id}>
                        <td>
                          <p>
                            <strong>{listing.name}</strong>
                          </p>
                          <p className="card-location">{categoryLabels[listing.category]}</p>
                        </td>
                        <td>{[listing.locality, listing.city].filter(Boolean).join(", ") || "—"}</td>
                        <td>
                          <ClaimRequestForm
                            organisationId={organisation.id}
                            slug={slug}
                            listingId={listing.id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
