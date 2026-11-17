import assert from "node:assert/strict";
import test from "node:test";
import { getEmptyDirectoryState } from "../lib/directory-state";
import { buildPublicResourceFilter } from "../lib/resources";
import { enquiryTypeForCategory, mumbaiSubRegions } from "../lib/types";
import {
  partnerApplicationSchema,
  patientSupportRequestSchema,
} from "../lib/validation";

/** Splits a combined filter into its individual conditions for assertions. */
function conditionsOf(filter: ReturnType<typeof buildPublicResourceFilter>) {
  return (filter.$and ?? [filter]) as Record<string, unknown>[];
}

test("published, non-demo records are always required", () => {
  assert.deepEqual(conditionsOf(buildPublicResourceFilter({})), [
    { publicationStatus: "published" },
    { isDemo: { $ne: true } },
  ]);
});

test("a search term matches name, specialty, services, locality, or city", () => {
  const and = conditionsOf(buildPublicResourceFilter({ search: "Ahmedabad" }));
  assert.deepEqual(and.at(-1), {
    $or: [
      { name: { $regex: "Ahmedabad", $options: "i" } },
      { specialty: { $regex: "Ahmedabad", $options: "i" } },
      { services: { $regex: "Ahmedabad", $options: "i" } },
      { locality: { $regex: "Ahmedabad", $options: "i" } },
      { city: { $regex: "Ahmedabad", $options: "i" } },
    ],
  });
});

test("regex metacharacters in a search term are escaped", () => {
  const and = conditionsOf(buildPublicResourceFilter({ search: "a.b" }));
  const or = (and.at(-1)?.$or ?? []) as Record<string, { $regex: string }>[];
  assert.equal(or[0].name.$regex, "a\\.b");
});

test("an exact six-digit search becomes a PIN filter", () => {
  const and = conditionsOf(buildPublicResourceFilter({ search: "400012" }));
  assert.deepEqual(and.at(-1), { pinCode: "400012" });
});

test("All Mumbai covers every Mumbai sub-region", () => {
  const and = conditionsOf(buildPublicResourceFilter({ region: "all-mumbai" }));
  assert.deepEqual(and.at(-1), { region: { $in: [...mumbaiSubRegions] } });
});

test("a specific region is applied directly and an unknown region is ignored", () => {
  const matched = conditionsOf(buildPublicResourceFilter({ region: "south-mumbai" }));
  assert.deepEqual(matched.at(-1), { region: "south-mumbai" });

  const ignored = conditionsOf(buildPublicResourceFilter({ region: "nowhere" }));
  assert.equal(ignored.length, 2);
});

test("valid category is applied while an unknown category is ignored", () => {
  const matched = conditionsOf(buildPublicResourceFilter({ category: "medicine-assistance" }));
  assert.deepEqual(matched.at(-1), { category: "medicine-assistance" });

  const ignored = conditionsOf(buildPublicResourceFilter({ category: "unknown" }));
  assert.equal(ignored.length, 2);
});

test("search, region, and category filters combine", () => {
  const and = conditionsOf(
    buildPublicResourceFilter({ search: "Mumbai", region: "western-suburbs", category: "hospitals" }),
  );
  assert.equal(and.length, 5);
});

test("each directory category maps to its enquiry action", () => {
  assert.equal(enquiryTypeForCategory("hospitals"), "appointment");
  assert.equal(enquiryTypeForCategory("doctors"), "appointment");
  assert.equal(enquiryTypeForCategory("blood-banks"), "appointment");
  assert.equal(enquiryTypeForCategory("diagnostics"), "diagnostic");
  assert.equal(enquiryTypeForCategory("medicine-assistance"), "medicine");
  assert.equal(enquiryTypeForCategory("financial-aid"), "financial-support");
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
