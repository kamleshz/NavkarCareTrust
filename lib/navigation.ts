import { categoryLabels, resourceCategories, type ResourceCategory } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Directory navigation                                                */
/* ------------------------------------------------------------------ */

/** Route that lists every category together (kept for existing links). */
export const allSupportRoute = "/support";

export const categoryRoutes: Record<ResourceCategory, string> = {
  hospitals: "/hospitals",
  doctors: "/doctors",
  "blood-banks": "/blood-banks",
  diagnostics: "/diagnostics",
  "medicine-assistance": "/medicine-assistance",
  "financial-aid": "/financial-aid",
};

export interface NavigationItem {
  category: ResourceCategory;
  href: string;
  label: string;
}

export const navigationItems: NavigationItem[] = resourceCategories.map((category) => ({
  category,
  href: categoryRoutes[category],
  label: categoryLabels[category],
}));

export const overviewRoute = "/";

export function routeForCategory(category: ResourceCategory): string {
  return categoryRoutes[category];
}

export function categoryForRoute(pathname: string): ResourceCategory | undefined {
  return resourceCategories.find((category) => categoryRoutes[category] === pathname);
}

/** True for routes rendered by the shared directory component. */
export function isDirectoryRoute(pathname: string): boolean {
  return pathname === allSupportRoute || Boolean(categoryForRoute(pathname));
}

export function parseCategory(value: unknown): ResourceCategory | undefined {
  return resourceCategories.includes(value as ResourceCategory)
    ? (value as ResourceCategory)
    : undefined;
}

/** Per-category page headings. */
export const categoryHeadings: Record<ResourceCategory, { title: string; description: string }> = {
  hospitals: {
    title: "Hospitals & Medical Centres",
    description:
      "Cancer treatment hospitals and medical centres. Search by name, specialty, locality, city, or 6-digit PIN above.",
  },
  doctors: {
    title: "Doctors",
    description:
      "Oncology specialists and consultants. Search by doctor name, specialty, hospital, or locality above.",
  },
  "blood-banks": {
    title: "Blood Banks",
    description:
      "Blood banks and blood centres. Search by name, locality, city, or 6-digit PIN above.",
  },
  diagnostics: {
    title: "Diagnostics & Scans",
    description:
      "Imaging, pathology, and laboratory services. Search by test, centre name, or locality above.",
  },
  "medicine-assistance": {
    title: "Medicine Assistance",
    description:
      "Medicine access and assistance programmes. Search by programme, therapy, or city above.",
  },
  "financial-aid": {
    title: "Financial Aid & Schemes",
    description:
      "Financial aid schemes and support programmes. Search by scheme, coverage, or city above.",
  },
};

export const allSupportHeading = {
  title: "All support listings",
  description:
    "Every published hospital, doctor, blood bank, diagnostic centre, medicine programme, and financial aid scheme.",
};

/* ------------------------------------------------------------------ */
/* Administration navigation                                           */
/* ------------------------------------------------------------------ */

export const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/directory", label: "Directory" },
  { href: "/admin/audit", label: "Audit log" },
] as const;

/* ------------------------------------------------------------------ */
/* Query helpers                                                       */
/* ------------------------------------------------------------------ */

export interface DirectorySearchParams {
  q?: string;
  region?: string;
  category?: string;
  page?: string;
  /** Listing opened in the details panel. */
  listing?: string;
  [key: string]: string | string[] | undefined;
}

function toParamRecord(params: DirectorySearchParams): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) entries.push([key, value]);
  }
  return entries;
}

function buildQuery(params: DirectorySearchParams, omit: string[]): string {
  const query = new URLSearchParams();
  for (const [key, value] of toParamRecord(params)) {
    if (!omit.includes(key)) query.set(key, value);
  }
  return query.toString();
}

/**
 * Keeps the existing shared directory URLs working by mapping them onto the
 * dedicated category routes. Returns the target path, or null when the URL
 * should render as-is.
 */
export function legacyDirectoryRedirect(
  pathname: string,
  params: DirectorySearchParams,
): string | null {
  const category = parseCategory(params.category);
  if (category) {
    const target = routeForCategory(category);
    if (target === pathname) return null;
    const query = buildQuery(params, ["category", "page"]);
    return query ? `${target}?${query}` : target;
  }

  if (pathname === overviewRoute && (params.q || params.region || params.page)) {
    const query = buildQuery(params, ["page"]);
    return query ? `${allSupportRoute}?${query}` : allSupportRoute;
  }

  return null;
}

/** Builds a category link that keeps the current city, PIN, and region filters. */
export function hrefPreservingFilters(params: URLSearchParams, target: string): string {
  const next = new URLSearchParams(params.toString());
  next.delete("category");
  next.delete("page");
  next.delete("listing");
  const query = next.toString();
  return query ? `${target}?${query}` : target;
}
