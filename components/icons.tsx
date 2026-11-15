import type { SVGProps } from "react";

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
