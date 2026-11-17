# NavkarCareTrust

A mobile-friendly cancer care support directory for India, built with Next.js App Router, TypeScript, MongoDB, and Tailwind CSS.

## Configure MongoDB

1. Create a local MongoDB database or an Atlas cluster.
2. Copy `.env.example` to `.env.local`.
3. Set `MONGODB_URI` to the server-side connection string and optionally change `MONGODB_DB`.

Never prefix the MongoDB variables with `NEXT_PUBLIC_`; credentials must remain server-side.

## Run locally

```bash
npm install
npm run seed
npm run dev
```

Open `http://localhost:3000`.

`npm run seed` upserts directory listings by their stable slug with `$setOnInsert`, so it is safe to run repeatedly and never creates duplicates. Existing records, locally edited fields, and publication settings are left untouched. Seeding is explicit and is never triggered by a page load. Imported listings are inserted as `claimStatus: "unclaimed"` so an organisation can later request ownership.

The seed batch covers hospitals and cancer centres, doctors and specialists, blood banks, diagnostics, medicine assistance, and financial aid and government schemes, including the Mumbai starter records. Records whose official source could not be confirmed are inserted as `publicationStatus: "draft"` and stay private.

## Public directory

Visitors can browse published listings without signing in. The header holds the search box and a **Region** dropdown, and category tabs switch results in place:

- All Support, Hospitals & Medical Centres, Doctors, Blood Banks, Diagnostics & Scans, Medicine Assistance, Financial Aid & Schemes
- Regions: All Mumbai, South Mumbai, Central Mumbai, Western Suburbs, North Mumbai, Eastern Suburbs

Search matches name, specialty, service, locality, city, or an exact six-digit PIN. Search, region, and category filters are combined, stored in the URL, and support browser Back. Results are paginated; compact cards open a sliding details panel with the address, official contact, website, source URL, and last-reviewed date where available.

## Organisation accounts

Organisations can register as a hospital or medical centre, doctor practice, blood bank, diagnostic centre, pharmacy, pharmaceutical company, trust, or NGO. Each organisation has a private dashboard to edit its profile, manage branches, create and update listings, manage doctors and services, view and respond to enquiries, and manage team members.

Memberships use owner, administrator, and staff permissions. `organisationId` is stored on organisation-owned records and access is checked on the server for every private operation. A user may belong to multiple organisations, and doctors link to branches through affiliations.

## Admin panel

Platform administrators review organisation registrations, approve and publish listings, review listing claims, manage regions and categories, search and edit the directory, and read a record of important administrative changes.

Listing statuses flow Draft → Pending Review → Published, and administrators can return a submission with a reason. The published version stays visible while proposed changes are under review. Organisation verification, listing publication, and confirmed partnership are tracked separately.

## Patient and enquiry flow

Public browsing needs no account. The "For Patients" action handles patient registration and login; signed-in patients can submit and track requests.

Participating organisations that enable enquiries offer appointment requests, diagnostic enquiries, medicine-assistance enquiries, and financial-support information requests. A request collects the patient's name, preferred contact method, requested service, preferred date where relevant, and an optional short message, and asks for consent before sharing the request with the receiving organisation.

Request statuses are Requested, Accepted, Declined, Cancelled, and Completed. An appointment shows "Confirmed" only after the provider accepts it. Patients can access only their own requests; only authorised staff of the receiving organisation and authorised platform administrators can access those requests.

## Checks

```bash
npm test
npm run lint
npm run build
```

The current release provides the directory and account features free of charge. Subscription plans, payment checkout, billing screens, and payments are reserved for a later phase.
