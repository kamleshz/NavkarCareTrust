import type { ComponentType, SVGProps } from "react";
import type { ResourceCategory } from "@/lib/types";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function HospitalIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10M8 7h4M10 5v4M8 13h1M12 13h1M8 17h1M12 17h1M2 21h20" />
    </svg>
  );
}

export function DoctorIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M9 3h6M12 3v5M7 8h10v2a5 5 0 0 1-10 0V8Z" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2M12 15v6" />
    </svg>
  );
}

export function BloodBankIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 21a6 6 0 0 0 6-6c0-3.6-6-12-6-12S6 11.4 6 15a6 6 0 0 0 6 6Z" />
      <path d="M12 17.5a2.5 2.5 0 0 1-2.5-2.5" />
    </svg>
  );
}

export function DiagnosticsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 12h4l2-5 3 10 2-5h7" />
    </svg>
  );
}

export function MedicineIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m7.5 16.5 9-9a3.18 3.18 0 0 1 4.5 4.5l-9 9a3.18 3.18 0 0 1-4.5-4.5Z" />
      <path d="m12 12 4.5 4.5M4 4h6v6H4zM7 4v6M4 7h6" />
    </svg>
  );
}

export function AidIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z" />
      <path d="M9 12h6M12 9v6" />
    </svg>
  );
}

export function OverviewIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </svg>
  );
}

export function RequestsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M8 4h8a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M9.5 9h5M9.5 13h5M9.5 17h3" />
    </svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function AdminIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3 4 6v6c0 4.6 3.4 8 8 9 4.6-1 8-4.4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export function PharmaIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m10.5 13.5 7-7a3.18 3.18 0 0 1 4.5 4.5l-7 7a3.18 3.18 0 0 1-4.5-4.5Z" />
      <path d="m9 12 5.5 5.5" />
      <rect x="2.5" y="2.5" width="5" height="5" rx="1" />
      <path d="M5 2.5v5M2.5 5h5" />
    </svg>
  );
}

export function TrustIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3 4 6v6c0 4.6 3.4 8 8 9 4.6-1 8-4.4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function NgoIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 21s-7-4.5-7-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 21 10c0 6.5-9 11-9 11Z" />
      <path d="M12 8v6M9 11h6" />
    </svg>
  );
}

export function TempleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 21h18M5 21V11l7-6 7 6v10M9 21v-5h6v5M12 3v2" />
    </svg>
  );
}

export function IndustryIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 21V10l5 3V10l5 3V7l8 5v9H3Z" />
      <path d="M7 17h2M12 17h2M17 17h2" />
    </svg>
  );
}

export function PoliticalIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 21v-3a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v3M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M7 21h10" />
    </svg>
  );
}

/** Icon used for each directory category in the sidebar and shortcuts. */
export const categoryIcons: Record<ResourceCategory, ComponentType<IconProps>> = {
  hospitals: HospitalIcon,
  doctors: DoctorIcon,
  "blood-banks": BloodBankIcon,
  diagnostics: DiagnosticsIcon,
  "medicine-assistance": MedicineIcon,
  "financial-aid": AidIcon,
};
