import type { Filter } from "mongodb";
import { DatabaseConfigurationError, getDatabase } from "@/lib/mongodb";
import {
  resourceCategories,
  type PublicResource,
  type ResourceCategory,
  type ResourceDocument,
} from "@/lib/types";

export interface ResourceFilters {
  location?: string;
  category?: string;
}

export type ResourceResult =
  | { ok: true; resources: PublicResource[] }
  | { ok: false; message: string };

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const knownSearchCities: Record<string, string> = {
  mumbai: "Maharashtra",
  "navi mumbai": "Maharashtra",
  parel: "Maharashtra",
  kharghar: "Maharashtra",
  ahmedabad: "Gujarat",
};

// First two digits of an Indian PIN code identify the postal circle. Only the
// circles covered by the current listings are mapped.
const stateByPinPrefix: Record<string, string> = {
  "36": "Gujarat",
  "37": "Gujarat",
  "38": "Gujarat",
  "39": "Gujarat",
  "40": "Maharashtra",
  "41": "Maharashtra",
  "42": "Maharashtra",
  "43": "Maharashtra",
  "44": "Maharashtra",
};

export function resolveSearchState(location?: string) {
  if (!location) return undefined;
  const normalized = location.trim().toLowerCase();
  if (/^\d{6}$/.test(normalized)) return stateByPinPrefix[normalized.slice(0, 2)];
  return knownSearchCities[normalized];
}

export function isDirectLocationMatch(resource: PublicResource, location: string) {
  const normalized = location.trim().toLowerCase();
  if (!normalized) return true;
  if (/^\d{6}$/.test(normalized)) return resource.pinCode === normalized;
  return resource.city?.toLowerCase() === normalized || resource.locality?.toLowerCase() === normalized;
}

/**
 * Splits results into listings that match the searched location directly and
 * broader nationwide, participating-network, or regional programmes that are
 * only available to check.
 */
export function partitionResourcesByLocation(resources: PublicResource[], location?: string) {
  const normalized = location?.trim() ?? "";
  if (!normalized) return { local: resources, alsoAvailable: [] as PublicResource[] };

  const local: PublicResource[] = [];
  const alsoAvailable: PublicResource[] = [];
  for (const resource of resources) {
    if (isDirectLocationMatch(resource, normalized)) local.push(resource);
    else alsoAvailable.push(resource);
  }
  return { local, alsoAvailable };
}

export function buildPublicResourceFilter(
  filters: ResourceFilters,
): Filter<ResourceDocument> {
  const query: Filter<ResourceDocument> = {
    publicationStatus: "published",
    isDemo: { $ne: true },
  };
  const location = filters.location?.trim();

  if (location) {
    const state = resolveSearchState(location);
    const localCondition: Filter<ResourceDocument> = /^\d{6}$/.test(location)
      ? { pinCode: location }
      : {
          $or: [
            { city: { $regex: `^${escapeRegExp(location)}$`, $options: "i" } },
            { locality: { $regex: `^${escapeRegExp(location)}$`, $options: "i" } },
          ],
        };
    const availabilityConditions: Filter<ResourceDocument>[] = [
      { coverageType: "national" },
      { coverageType: "participating-network" },
    ];
    if (state) availabilityConditions.push({ coverageType: "regional", state });

    query.$or = [localCondition, ...availabilityConditions];
  }

  if (
    filters.category &&
    resourceCategories.includes(filters.category as ResourceCategory)
  ) {
    query.category = filters.category as ResourceCategory;
  }

  return query;
}

export async function getPublishedResources(
  filters: ResourceFilters,
): Promise<ResourceResult> {
  try {
    const db = await getDatabase();
    const documents = await db
      .collection<ResourceDocument>("resources")
      .find(buildPublicResourceFilter(filters))
      .sort({ name: 1 })
      .toArray();

    return {
      ok: true,
      resources: documents.map(({ _id, ...resource }) => ({
        ...resource,
        id: _id.toHexString(),
        lastReviewedAt: resource.lastReviewedAt.toISOString(),
      })),
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
