import "dotenv/config";
import { directoryResources, directorySeedBatch, seedDirectoryResources } from "@/lib/directory-seed";
import { DatabaseConfigurationError, getDatabase } from "@/lib/mongodb";

async function main() {
  const database = await getDatabase();

  try {
    const expectedSlugs = directoryResources.map((resource) => resource.slug);
    const result = await seedDirectoryResources(database);

    const storedCount = await database
      .collection("resources")
      .countDocuments({ slug: { $in: expectedSlugs } });

    console.log(`Seed batch: ${directorySeedBatch}`);
    console.log(
      `Upserted ${result.upsertedCount}, matched ${result.matchedCount}, modified ${result.modifiedCount} of ${expectedSlugs.length} listings.`,
    );
    console.log(`Unique records for this batch: ${storedCount}/${expectedSlugs.length}.`);

    if (storedCount !== expectedSlugs.length) {
      throw new Error(
        `Expected ${expectedSlugs.length} unique listings for ${directorySeedBatch}, found ${storedCount}.`,
      );
    }

    console.log(
      "Existing listings, locally edited fields, and publication settings were left untouched.",
    );
  } finally {
    await database.client.close();
  }
}

main().catch((error) => {
  if (error instanceof DatabaseConfigurationError) {
    console.error(error.message);
  } else {
    console.error("Seeding failed:", error);
  }
  process.exitCode = 1;
});
