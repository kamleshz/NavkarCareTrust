"use client";

import Link from "next/link";
import { useEffect, useState, type FocusEvent } from "react";

const registrationOptions = [
  { label: "Patient registration", href: "/patient-support" },
  { label: "Hospital registration", href: "/join?type=hospital-or-cancer-institute" },
  { label: "Trust registration", href: "/join?type=ngo" },
  { label: "Doctor registration", href: "/join?type=doctor" },
];

export function RegistrationMarquee() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const paused = manuallyPaused || interacting || reducedMotion;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % registrationOptions.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [paused]);

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setInteracting(false);
    }
  }

  return (
    <section
      className="registration-strip"
      aria-label="Registration pathways"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={handleBlur}
    >
      <span className="registration-strip-label">Registration</span>
      <nav className="registration-links" aria-label="Choose a registration type">
        <span
          className="registration-highlight"
          aria-hidden="true"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />
        {registrationOptions.map((option, index) => (
          <Link
            className="registration-link"
            data-active={activeIndex === index}
            href={option.href}
            key={option.label}
          >
            {option.label}
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>
      <button
        className="registration-motion-toggle"
        type="button"
        aria-pressed={manuallyPaused}
        aria-label={manuallyPaused ? "Resume registration highlight" : "Pause registration highlight"}
        onClick={() => setManuallyPaused((current) => !current)}
      >
        {manuallyPaused ? "Resume" : "Pause"}
      </button>
    </section>
  );
}
