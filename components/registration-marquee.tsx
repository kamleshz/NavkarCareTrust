"use client";

import Link from "next/link";
import { useState } from "react";

const registrationOptions = [
  { label: "Patient registration", href: "/patient-support" },
  { label: "Hospital registration", href: "/join?type=hospital-or-cancer-institute" },
  { label: "Trust registration", href: "/join?type=ngo" },
  { label: "Doctor registration", href: "/join?type=doctor" },
];

export function RegistrationMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="registration-strip" aria-label="Registration pathways">
      <span className="registration-strip-label" aria-hidden="true">Register:</span>
      <div className={`registration-marquee${paused ? " is-paused" : ""}`}>
        <div className="registration-track">
          {Array.from({ length: 4 }, (_, copyIndex) => {
            const decorativeCopy = copyIndex > 0;

            return (
              <div
                className="registration-group"
                aria-hidden={decorativeCopy}
                key={copyIndex}
              >
                {registrationOptions.map((option) => (
                  <Link
                    className="registration-link"
                    href={option.href}
                    key={option.label}
                    tabIndex={decorativeCopy ? -1 : undefined}
                  >
                    {option.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <button
        className="registration-motion-toggle"
        type="button"
        aria-pressed={paused}
        aria-label={paused ? "Resume moving registration links" : "Pause moving registration links"}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? "Play" : "Pause"}
      </button>
    </section>
  );
}
