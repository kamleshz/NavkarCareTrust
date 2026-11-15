import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri();
  process.env.MONGODB_DB = "navkarcaretrust-integration";

  try {
  const { getDatabase } = await import("../lib/mongodb");
  const { getPublishedResources } = await import("../lib/resources");
  const { submitPartnerApplication, initialApplicationState } = await import(
    "../app/actions/partner-application"
  );

  const database = await getDatabase();
  await database.collection("resources").insertMany([
    {
      name: "Ahmedabad Published Centre",
      category: "hospitals",
      organisationType: "Cancer centre",
      description: "Integration test record",
      city: "Ahmedabad",
      state: "Gujarat",
      pinCode: "380009",
      contactDetails: {},
      publicationStatus: "published",
      lastReviewedAt: new Date(),
      isDemo: false,
    },
    {
      name: "DEMO: Ahmedabad Published Centre",
      category: "hospitals",
      organisationType: "Cancer centre",
      description: "Demo record that must stay out of public results",
      city: "Ahmedabad",
      state: "Gujarat",
      pinCode: "380009",
      contactDetails: {},
      publicationStatus: "published",
      lastReviewedAt: new Date(),
      isDemo: true,
    },
    {
      name: "DEMO: Ahmedabad Draft Centre",
      category: "hospitals",
      organisationType: "Cancer centre",
      description: "Must remain private",
      city: "Ahmedabad",
      state: "Gujarat",
      pinCode: "380009",
      contactDetails: {},
      publicationStatus: "draft",
      lastReviewedAt: new Date(),
      isDemo: true,
    },
  ]);

  const cityResult = await getPublishedResources({ location: "ahmedabad" });
  assert.equal(cityResult.ok, true);
  assert.equal(cityResult.ok && cityResult.resources.length, 1);
  assert.equal(cityResult.ok && cityResult.resources[0].name, "Ahmedabad Published Centre");

  const pinResult = await getPublishedResources({ location: "380009", category: "hospitals" });
  assert.equal(pinResult.ok, true);
  assert.equal(pinResult.ok && pinResult.resources.length, 1);

  const formData = new FormData();
  formData.set("organisationName", "DEMO: Integration Partner");
  formData.set("partnerType", "ngo");
  formData.set("city", "Ahmedabad");
  formData.set("state", "Gujarat");
  formData.set("contactPerson", "Demo Contact");
  formData.set("email", "partner@example.org");
  formData.set("phone", "");
  formData.set("note", "Integration test");

  const actionResult = await submitPartnerApplication(initialApplicationState, formData);
  assert.equal(actionResult.success, true);

  const saved = await database.collection("partnerApplications").findOne({
    organisationName: "DEMO: Integration Partner",
  });
  assert.equal(saved?.reviewStatus, "pending");
  assert.ok(saved?.createdAt instanceof Date);
  assert.equal(await database.collection("resources").countDocuments(), 3);

  console.log("MongoDB integration checks passed:");
  console.log("- case-insensitive city search returns only the published, non-demo record");
  console.log("- exact PIN + category search excludes demo and draft records");
  console.log("- valid partner application is stored privately with pending status");
  await database.client.close();
  } finally {
    await server.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
