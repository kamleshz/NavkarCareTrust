"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useRef } from "react";
import { SearchIcon } from "@/components/icons";

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locationParam = searchParams.get("location") || "";
  const inputRef = useRef<HTMLInputElement>(null);

  const directoryPath = pathname === "/" || pathname === "/support" ? pathname : "/support";

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const nextLocation = inputRef.current?.value.trim() || "";
    if (nextLocation) params.set("location", nextLocation);
    else params.delete("location");
    params.delete("page");
    const query = params.toString();
    router.push(`${directoryPath}${query ? `?${query}` : ""}`);
  }

  function clearSearch() {
    if (inputRef.current) inputRef.current.value = "";
    if (pathname === "/" || pathname === "/support") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("location");
      params.delete("page");
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="NavkarCareTrust home">
          <Image
            className="brand-logo"
            src="/navkar-care-trust-logo.jpeg"
            alt="Navkar Care Trust"
            width={1402}
            height={1124}
            priority
          />
        </Link>

        <form className="header-search" onSubmit={submitSearch} role="search">
          <label className="sr-only" htmlFor="header-location">
            City or 6-digit PIN code
          </label>
          <SearchIcon width="18" height="18" />
          <input
            key={locationParam}
            ref={inputRef}
            id="header-location"
            name="location"
            type="search"
            inputMode="search"
            defaultValue={locationParam}
            placeholder="City or 6-digit PIN code"
            aria-label="City or 6-digit PIN code"
          />
          <button className="search-clear" type="button" onClick={clearSearch} aria-label="Clear location search">
            Clear
          </button>
          <button className="search-submit" type="submit">
            Search
          </button>
        </form>

        <nav className="header-actions" aria-label="Get involved">
          <Link className="button button-primary header-support" href="/patient-support">
            Get Support
          </Link>
          <Link className="button button-outline header-join" href="/join">
            Join the Network
          </Link>
        </nav>
      </div>
    </header>
  );
}
