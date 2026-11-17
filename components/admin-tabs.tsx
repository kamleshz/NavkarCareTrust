import Link from "next/link";

const adminTabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/directory", label: "Directory" },
  { href: "/admin/audit", label: "Audit log" },
] as const;

export function AdminTabs({ active }: { active: string }) {
  return (
    <nav className="app-tabs" aria-label="Administration">
      {adminTabs.map((tab) => (
        <Link
          className="app-tab"
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
      <Link className="app-tab" href="/support">
        Public directory
      </Link>
    </nav>
  );
}
