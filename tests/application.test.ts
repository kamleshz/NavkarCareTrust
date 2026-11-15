import assert from "node:assert/strict";
import test from "node:test";
import { getEmptyDirectoryState } from "../lib/directory-state";
import {
  buildPublicResourceFilter,
  partitionResourcesByLocation,
  resolveSearchState,
} from "../lib/resources";
import type { PublicResource } from "../lib/types";
import {
  partnerApplicationSchema,
  patientSupportRequestSchema,
} from "../lib/validation";

function listing(overrides: Partial<PublicResource>): PublicResource {
  return {
    id: "listing",
    name: "Listing",
    category: "hospitals",
    organisationType: "Cancer hospital",
    description: "Description",
    contactDetails: {},
    publicationStatus: "published",
    lastReviewedAt: "2026-11-15T00:00:00.000Z",
    ...overrides,
  };
}

test("city filtering is case-insensitive and only includes published resources", () => {
  const filter = buildPublicResourceFilter({ location: "aHmEdAbAd" });
  assert.equal(filter.publicationStatus, "published");
  assert.deepEqual(filter.isDemo, { $ne: true });
  assert.deepEqual(filter.$or, [
    {
      $or: [
        { city: { $regex: "^aHmEdAbAd$", $options: "i" } },
        { locality: { $regex: "^aHmEdAbAd$", $options: "i" } },
      ],
    },
    { coverageType: "national" },
    { coverageType: "participating-network" },
    { coverageType: "regional", state: "Gujarat" },
  ]);
});

test("a 6-digit location becomes an exact PIN filter", () => {
  const filter = buildPublicResourceFilter({ location: "380009" });
  assert.equal(filter.publicationStatus, "published");
  assert.deepEqual(filter.$or, [
    { pinCode: "380009" },
    { coverageType: "national" },
    { coverageType: "participating-network" },
    { coverageType: "regional", state: "Gujarat" },
  ]);
});

test("a Maharashtra search also includes state-wide programmes", () => {
  const filter = buildPublicResourceFilter({ location: "Mumbai" });
  assert.deepEqual((filter.$or as unknown[]).at(-1), {
    coverageType: "regional",
    state: "Maharashtra",
  });
});

test("an unknown location still matches nationwide and participating programmes", () => {
  const filter = buildPublicResourceFilter({ location: "Somewhere" });
  assert.deepEqual(filter.$or, [
    {
      $or: [
        { city: { $regex: "^Somewhere$", $options: "i" } },
        { locality: { $regex: "^Somewhere$", $options: "i" } },
      ],
    },
    { coverageType: "national" },
    { coverageType: "participating-network" },
  ]);
});

test("state resolution uses known cities and PIN circles only", () => {
  assert.equal(resolveSearchState("Mumbai"), "Maharashtra");
  assert.equal(resolveSearchState("400012"), "Maharashtra");
  assert.equal(resolveSearchState("380009"), "Gujarat");
  assert.equal(resolveSearchState("Ahmedabad"), "Gujarat");
  assert.equal(resolveSearchState("Jaipur"), undefined);
  assert.equal(resolveSearchState("999999"), undefined);
  assert.equal(resolveSearchState(""), undefined);
});

test("valid category is applied while an unknown category is ignored", () => {
  assert.equal(buildPublicResourceFilter({ category: "medicine-assistance" }).category, "medicine-assistance");
  assert.equal(buildPublicResourceFilter({ category: "unknown" }).category, undefined);
});

test("results are split into local matches and programmes to check", () => {
  const local = listing({ id: "local", city: "Mumbai", state: "Maharashtra" });
  const programme = listing({ id: "programme", coverage: "India", coverageType: "national" });
  const partition = partitionResourcesByLocation([programme, local], "Mumbai");

  assert.deepEqual(partition.local.map((resource) => resource.id), ["local"]);
  assert.deepEqual(partition.alsoAvailable.map((resource) => resource.id), ["programme"]);
});

test("an exact PIN search only treats the matching PIN as local", () => {
  const partition = partitionResourcesByLocation(
    [
      listing({ id: "match", pinCode: "400012" }),
      listing({ id: "other", pinCode: "410210", city: "Navi Mumbai", state: "Maharashtra" }),
    ],
    "400012",
  );

  assert.deepEqual(partition.local.map((resource) => resource.id), ["match"]);
  assert.deepEqual(partition.alsoAvailable.map((resource) => resource.id), ["other"]);
});

test("without a location every listing stays in the main results", () => {
  const partition = partitionResourcesByLocation([listing({ id: "a" }), listing({ id: "b" })], "");
  assert.equal(partition.local.length, 2);
  assert.equal(partition.alsoAvailable.length, 0);
});

test("partner application requires at least one contact method", () => {
  const base = {
    organisationName: "Demo Care Partner",
    partnerType: "ngo",
    city: "Ahmedabad",
    state: "Gujarat",
    contactPerson: "Demo Person",
    note: "",
  };
  assert.equal(partnerApplicationSchema.safeParse({ ...base, email: "", phone: "" }).success, false);
  assert.equal(partnerApplicationSchema.safeParse({ ...base, email: "partner@example.org", phone: "" }).success, true);
});

test("patient request requires consent and a reachable preferred contact", () => {
  const base = {
    fullName: "Patient Example",
    city: "Mumbai",
    state: "",
    preferredContact: "phone",
    email: "",
    phone: "9876543210",
    note: "",
    consent: "yes",
  };

  assert.equal(patientSupportRequestSchema.safeParse(base).success, true);
  assert.equal(
    patientSupportRequestSchema.safeParse({ ...base, phone: "", email: "person@example.org" }).success,
    false,
  );
  assert.equal(patientSupportRequestSchema.safeParse({ ...base, consent: "" }).success, false);
});

test("empty directory copy distinguishes unfiltered and filtered states", () => {
  const unfiltered = getEmptyDirectoryState(false);
  assert.equal(unfiltered.title, "No support listings are available yet.");
  assert.equal(unfiltered.showClearFilters, false);

  const filtered = getEmptyDirectoryState(true);
  assert.equal(filtered.title, "No listings match your search");
  assert.equal(filtered.showClearFilters, true);
});
