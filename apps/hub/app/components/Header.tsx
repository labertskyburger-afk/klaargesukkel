"use client";

import { useState } from "react";
import { trackEvent, AnalyticsEvent } from "@/lib/analytics";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#find-help", label: "Find help" },
  { href: "#provider", label: "Join as a provider" },
  { href: "#business-support", label: "Business support" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-sand/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="text-lg font-bold text-ink">
          Get It Sorted
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-ink/70 hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <a
            href="#find-help"
            onClick={() => trackEvent(AnalyticsEvent.PrimaryCtaClicked, { location: "header" })}
            className="rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-95"
          >
            Get something sorted
          </a>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink md:hidden"
        >
          <span className="sr-only">Menu</span>
          {menuOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              <path d="M0 1H18M0 7H18M0 13H18" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-ink/10 bg-sand px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-ink/70"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#find-help"
              onClick={() => {
                setMenuOpen(false);
                trackEvent(AnalyticsEvent.PrimaryCtaClicked, { location: "header_mobile" });
              }}
              className="mt-2 rounded-full bg-amber px-5 py-2.5 text-center text-sm font-semibold text-ink"
            >
              Get something sorted
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
