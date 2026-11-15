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

`npm run seed` upserts the directory listings by their stable slug, so it is safe to run repeatedly and never creates duplicates. Existing records, locally edited fields, and publication settings are left untouched (`$setOnInsert` only). Seeding is explicit and is never triggered by a page load.

The batch covers hospitals and cancer centres, doctors and specialists, medicine assistance, and financial aid and government schemes. Public results only show records with `publicationStatus: "published"` that are not marked `isDemo: true`, so demo and draft records stay private while their underlying data is preserved.

## Checks

```bash
npm test
npm run lint
npm run build
```

The first release is informational. It does not include patient accounts, medical records, prescription uploads, medicine sales, checkout, or payments.
