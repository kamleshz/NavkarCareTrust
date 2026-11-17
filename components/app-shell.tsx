"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { logout } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import {
  AdminIcon,
  categoryIcons,
  MenuIcon,
  OverviewIcon,
  ProfileIcon,
  RequestsIcon,
  SearchIcon,
} from "@/components/icons";
import { RegionSelect } from "@/components/region-select";
import {
  adminNavItems,
  allSupportRoute,
  hrefPreservingFilters,
  isDirectoryRoute,
  navigationItems,
  overviewRoute,
} from "@/lib/navigation";
import { organisationTypeLabels, organisationTypes, type SessionUser } from "@/lib/types";

/**
 * Shared application shell: a left sidebar with the logo and category
 * navigation, a compact top header, and a main area that fills the rest.
 */
export function AppShell({ user, children }: { user: SessionUser | null; children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerOpenRef = useRef(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const openDrawer = useCallback(() => {
    drawerOpenRef.current = true;
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback((returnFocus = true) => {
    if (!drawerOpenRef.current) return;
    drawerOpenRef.current = false;
    setDrawerOpen(false);
    if (returnFocus) menuButtonRef.current?.focus();
  }, []);

  // Close the drawer after navigation and hand focus back to the menu button.
  useEffect(() => {
    if (!drawerOpenRef.current) return;
    drawerOpenRef.current = false;
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <div className={`app-shell${collapsed ? " is-collapsed" : ""}${drawerOpen ? " is-drawer-open" : ""}`}>
      <Suspense fallback={<div className="sidebar sidebar-placeholder" aria-hidden="true" />}>
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
          onCloseDrawer={() => closeDrawer()}
          drawerRef={drawerRef}
        />
      </Suspense>

      <div className="app-frame">
        <Suspense fallback={<div className="topbar-placeholder" aria-hidden="true" />}>
          <TopBar
            user={user}
            drawerOpen={drawerOpen}
            onOpenDrawer={openDrawer}
            menuButtonRef={menuButtonRef}
          />
        </Suspense>
        <div className="app-content">{children}</div>
        <Footer />
      </div>

      <button
        className="drawer-scrim"
        type="button"
        aria-label="Close navigation menu"
        onClick={() => closeDrawer()}
      />
    </div>
  );
}

interface SidebarProps {
  user: SessionUser | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCloseDrawer: () => void;
  drawerRef: RefObject<HTMLDivElement | null>;
}

function Sidebar({ user, collapsed, onToggleCollapsed, onCloseDrawer, drawerRef }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentParams = new URLSearchParams(searchParams.toString());
  const linkHref = (target: string) => hrefPreservingFilters(currentParams, target);

  const isPatient = Boolean(user?.accountTypes.includes("patient"));

  return (
    <aside
      className="sidebar"
      id="app-sidebar"
      ref={drawerRef}
      tabIndex={-1}
      aria-label="Main navigation"
    >
      <div className="sidebar-header">
        <Link className="sidebar-brand" href={overviewRoute} aria-label="NavkarCareTrust home">
          <Image
            className="brand-logo"
            src="/navkar-care-trust-logo.jpeg"
            alt="Navkar Care Trust"
            width={160}
            height={128}
            priority
          />
        </Link>
        <button
          className="sidebar-drawer-close"
          type="button"
          onClick={onCloseDrawer}
          aria-label="Close navigation menu"
        >
          <span aria-hidden="true">×</span>
        </button>
        <button
          className="sidebar-collapse"
          type="button"
          onClick={onToggleCollapsed}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Directory categories">
        <ul>
          <li>
            <Link
              className="nav-link"
              href={linkHref(overviewRoute)}
              aria-current={pathname === overviewRoute ? "page" : undefined}
              title={collapsed ? "Overview" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                <OverviewIcon />
              </span>
              <span className="nav-label">Overview</span>
            </Link>
          </li>
          {navigationItems.map((item) => {
            const Icon = categoryIcons[item.category];
            return (
              <li key={item.href}>
                <Link
                  className="nav-link"
                  href={linkHref(item.href)}
                  aria-current={pathname === item.href ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {isPatient && (
          <div className="sidebar-section">
            <p className="sidebar-section-title">Your account</p>
            <ul>
              <li>
                <Link
                  className="nav-link"
                  href="/account"
                  aria-current={pathname === "/account" ? "page" : undefined}
                  title={collapsed ? "My Requests" : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <RequestsIcon />
                  </span>
                  <span className="nav-label">My Requests</span>
                </Link>
              </li>
              <li>
                <Link
                  className="nav-link"
                  href="/account/profile"
                  aria-current={pathname === "/account/profile" ? "page" : undefined}
                  title={collapsed ? "My Profile" : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <ProfileIcon />
                  </span>
                  <span className="nav-label">My Profile</span>
                </Link>
              </li>
            </ul>
          </div>
        )}

        {user?.isPlatformAdmin && (
          <div className="sidebar-section">
            <p className="sidebar-section-title">Administration</p>
            <ul>
              {adminNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    className="nav-link"
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true">
                      <AdminIcon />
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!user && (
          <div className="sidebar-section">
            <p className="sidebar-section-title">Get started</p>
            <ul>
              <li>
                <Link className="nav-link" href="/register" title={collapsed ? "Register" : undefined}>
                  <span className="nav-icon" aria-hidden="true">
                    <ProfileIcon />
                  </span>
                  <span className="nav-label">Register</span>
                </Link>
              </li>
              <li>
                <Link className="nav-link" href="/login" title={collapsed ? "Sign in" : undefined}>
                  <span className="nav-icon" aria-hidden="true">
                    <RequestsIcon />
                  </span>
                  <span className="nav-label">Sign in</span>
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

interface TopBarProps {
  user: SessionUser | null;
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

function TopBar({ user, drawerOpen, onOpenDrawer, menuButtonRef }: TopBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const searchParam = searchParams.get("q") ?? "";
  const searchTarget = isDirectoryRoute(pathname) ? pathname : allSupportRoute;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const value = inputRef.current?.value.trim() ?? "";
    if (value) params.set("q", value);
    else params.delete("q");
    params.delete("page");
    params.delete("listing");
    const query = params.toString();
    router.push(`${searchTarget}${query ? `?${query}` : ""}`);
  }

  function clearSearch() {
    if (inputRef.current) inputRef.current.value = "";
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    params.delete("listing");
    const query = params.toString();
    router.push(`${searchTarget}${query ? `?${query}` : ""}`, { scroll: false });
  }

  function handleMenuBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMenuOpen(false);
  }

  const isPatient = Boolean(user?.accountTypes.includes("patient"));
  const isOrganisation = Boolean(user?.accountTypes.includes("organisation"));

  return (
    <header className="topbar">
      <button
        ref={menuButtonRef}
        className="topbar-menu"
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open navigation menu"
        aria-expanded={drawerOpen}
        aria-controls="app-sidebar"
      >
        <MenuIcon width="20" height="20" />
      </button>

      <form className="header-search" onSubmit={submitSearch} role="search">
        <label className="sr-only" htmlFor="topbar-search-input">
          Search by city, area, name, or 6-digit PIN
        </label>
        <SearchIcon width="18" height="18" />
        <input
          key={searchParam}
          ref={inputRef}
          id="topbar-search-input"
          name="q"
          type="search"
          inputMode="search"
          defaultValue={searchParam}
          placeholder="City, area, name, or 6-digit PIN"
          aria-label="Search by city, area, name, or 6-digit PIN"
        />
        <button className="search-clear" type="button" onClick={clearSearch} aria-label="Clear search">
          Clear
        </button>
        <button className="search-submit" type="submit">
          Search
        </button>
      </form>

      <RegionSelect className="header-region" />

      <nav className="header-actions" aria-label="Account and organisation actions">
        {user ? (
          <div className="header-menu" onBlur={handleMenuBlur}>
            <button
              type="button"
              className="button button-outline account-trigger"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <ProfileIcon width="17" height="17" />
              <span className="account-name">{user.fullName}</span>
            </button>
            {menuOpen && (
              <div className="partner-menu account-popover" role="menu" aria-label="Account">
                <p className="account-identity">
                  <strong>{user.fullName}</strong>
                  <span>{user.email}</span>
                </p>
                {isPatient && (
                  <Link role="menuitem" href="/account" onClick={() => setMenuOpen(false)}>
                    My Requests
                  </Link>
                )}
                {isPatient && (
                  <Link role="menuitem" href="/account/profile" onClick={() => setMenuOpen(false)}>
                    My Profile
                  </Link>
                )}
                {isOrganisation && (
                  <Link
                    role="menuitem"
                    href="/account/organisations"
                    onClick={() => setMenuOpen(false)}
                  >
                    Organisation workspace
                  </Link>
                )}
                {user.isPlatformAdmin && (
                  <Link role="menuitem" href="/admin" onClick={() => setMenuOpen(false)}>
                    Admin panel
                  </Link>
                )}
                <form action={logout}>
                  <button className="account-signout" role="menuitem" type="submit">
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link className="button button-primary header-support" href="/account">
              For Patients
            </Link>
            <div className="header-menu" onBlur={handleMenuBlur}>
              <button
                type="button"
                className="button button-outline header-join"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                For Organisations ▾
              </button>
              {menuOpen && (
                <ul className="partner-menu" role="menu" aria-label="Choose an organisation type">
                  <li role="none" className="partner-menu-featured">
                    <Link
                      role="menuitem"
                      href="/for-organisations/register"
                      onClick={() => setMenuOpen(false)}
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      Join via QR code
                    </Link>
                  </li>
                  {organisationTypes.map((type) => (
                    <li key={type} role="none">
                      <Link
                        role="menuitem"
                        href={`/register/organisation?type=${type}`}
                        onClick={() => setMenuOpen(false)}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {organisationTypeLabels[type]}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
