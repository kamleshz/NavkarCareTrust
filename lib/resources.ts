import type { Filter, ObjectId } from "mongodb";
import { DatabaseConfigurationError, getDatabase } from "@/lib/mongodb";
import { toPublicResource } from "@/lib/listings";
import { toObjectId } from "@/lib/object-id";
import {
  isMumbaiSubRegion,
  mumbaiSubRegions,
  resourceCategories,
  type PublicResource,
  type ResourceCategory,
  type ResourceDocument,
} from "@/lib/types";

export interface ResourceFilters {
  /** Free text: name, specialty, service, locality, city, or an exact 6-digit PIN. */
  search?: string;
  /** Browsing region id, including "all-mumbai". */
  region?: string;
  category?: string;
}

export type ResourceResult =
  | { ok: true; resources: PublicResource[] }
  | { ok: false; message: string };

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Combines search, region, and category filters into a single MongoDB query.
 * Only published, non-demo records are ever visible publicly.
 */
export function buildPublicResourceFilter(filters: ResourceFilters): Filter<ResourceDocument> {
  const conditions: Filter<ResourceDocument>[] = [
    { publicationStatus: "published" },
    { isDemo: { $ne: true } },
  ];

  if (filters.category && resourceCategories.includes(filters.category as ResourceCategory)) {
    conditions.push({ category: filters.category as ResourceCategory });
  }

  const region = filters.region?.trim();
  if (region === "all-mumbai") {
    conditions.push({ region: { $in: [...mumbaiSubRegions] } });
  } else if (isMumbaiSubRegion(region)) {
    conditions.push({ region });
  }

  const search = filters.search?.trim();
  if (search) {
    if (/^\d{6}$/.test(search)) {
      conditions.push({ pinCode: search });
    } else {
      const pattern = { $regex: escapeRegExp(search), $options: "i" } as const;
      conditions.push({
        $or: [
          { name: pattern },
          { specialty: pattern },
          { services: pattern },
          { locality: pattern },
          { city: pattern },
        ],
      });
    }
  }

  return conditions.length === 1 ? conditions[0] : { $and: conditions };
}

export async function getPublishedResources(filters: ResourceFilters): Promise<ResourceResult> {
  try {
    const db = await getDatabase();
    const documents = await db
      .collection<ResourceDocument>("resources")
      .find(buildPublicResourceFilter(filters))
      .sort({ name: 1 })
      .limit(300)
      .toArray();

    return {
      ok: true,
      resources: documents.map((document) =>
        toPublicResource(document as ResourceDocument & { _id: ObjectId }),
      ),
    };
  } catch (error) {
    console.error("Unable to load resources", error);
    return {
      ok: false,
      message:
        error instanceof DatabaseConfigurationError
          ? error.message
          : "We could not load the directory right now. Please try again shortly.",
    };
  }
}

/** Loads a single published listing for the details view and enquiry form. */
export async function getPublishedResource(idOrSlug: string): Promise<PublicResource | null> {
  try {
    const db = await getDatabase();
    const objectId = toObjectId(idOrSlug);
    const document = await db.collection<ResourceDocument>("resources").findOne({
      publicationStatus: "published",
      isDemo: { $ne: true },
      ...(objectId ? { _id: objectId } : { slug: idOrSlug }),
    });
    if (!document) return null;
    return toPublicResource(document as ResourceDocument & { _id: ObjectId });
  } catch (error) {
    console.error("Unable to load resource", error);
    return null;
  }
}

/**
 * Published listing counts per category, straight from the database.
 * Returns null when the database is unreachable so no count is ever invented.
 */
export async function getPublishedCategoryCounts(): Promise<Record<string, number> | null> {
  try {
    const db = await getDatabase();
    const rows = await db
      .collection<ResourceDocument>("resources")
      .aggregate<{ _id: ResourceCategory; count: number }>([
        { $match: { publicationStatus: "published", isDemo: { $ne: true } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ])
      .toArray();

    const counts: Record<string, number> = {};
    for (const row of rows) {
      if (resourceCategories.includes(row._id)) counts[row._id] = row.count;
    }
    return counts;
  } catch (error) {
    console.error("Unable to load category counts", error);
    return null;
  }
}

/** Recently added published listings, for the overview page. */
export async function getRecentPublishedResources(limit = 4): Promise<PublicResource[]> {
  try {
    const db = await getDatabase();
    const documents = await db
      .collection<ResourceDocument>("resources")
      .find({ publicationStatus: "published", isDemo: { $ne: true } })
      .sort({ lastReviewedAt: -1, name: 1 })
      .limit(limit)
      .toArray();

    return documents.map((document) =>
      toPublicResource(document as ResourceDocument & { _id: ObjectId }),
    );
  } catch (error) {
    console.error("Unable to load recent listings", error);
    return [];
  }
}
