"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import type { ResourceCategory } from "@/lib/types";

const tabs: Array<{ value: "" | ResourceCategory; label: string }> = [
  { value: "", label: "All Support" },
  { value: "hospitals", label: "Hospitals" },
  { value: "doctors", label: "Doctors" },
  { value: "medicine-assistance", label: "Medicine Assistance" },
  { value: "financial-aid", label: "Financial Aid & Schemes" },
];

export function CategoryTabs({ activeCategory }: { activeCategory: "" | ResourceCategory }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isPending, startTransition] = useTransition();

  function selectCategory(value: "" | ResourceCategory) {
    if (value === activeCategory) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("category", value);
    else params.delete("category");
    params.delete("page");
    const query = params.toString();
    startTransition(() => router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false }));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    selectCategory(tabs[nextIndex].value);
  }

  return (
    <div className="tabs-scroller" aria-label="Support categories">
      <div className="category-tabs" role="tablist" aria-busy={isPending}>
        {tabs.map((tab, index) => {
          const active = activeCategory === tab.value;
          return (
            <button
              key={tab.value || "all"}
              ref={(element) => { tabRefs.current[index] = element; }}
              className="category-tab"
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => selectCategory(tab.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
