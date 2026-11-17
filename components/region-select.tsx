"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { allSupportRoute, isDirectoryRoute } from "@/lib/navigation";
import { isRegionId, regions } from "@/lib/types";

export function RegionSelect({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get("region") ?? "";
  const value = isRegionId(current) ? current : "all-mumbai";

  function selectRegion(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next && next !== "all-mumbai") params.set("region", next);
    else params.delete("region");
    params.delete("page");
    params.delete("listing");
    const query = params.toString();
    const directoryPath = isDirectoryRoute(pathname) ? pathname : allSupportRoute;
    startTransition(() => router.push(`${directoryPath}${query ? `?${query}` : ""}`, { scroll: false }));
  }

  return (
    <label className={className ? `region-select ${className}` : "region-select"}>
      <span className="sr-only">Browsing region</span>
      <select
        name="region"
        value={value}
        aria-label="Browsing region"
        aria-busy={isPending}
        onChange={(event) => selectRegion(event.target.value)}
      >
        {regions.map((region) => (
          <option value={region.id} key={region.id}>
            {region.label}
          </option>
        ))}
      </select>
    </label>
  );
}
