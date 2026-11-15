export function getEmptyDirectoryState(hasActiveFilters: boolean) {
  if (hasActiveFilters) {
    return {
      title: "No listings match your search",
      description: "Try another location or clear your filters to browse all support.",
      showClearFilters: true,
    };
  }

  return {
    title: "No support listings are available yet.",
    description: "Please check back later as reviewed resources are added.",
    showClearFilters: false,
  };
}
