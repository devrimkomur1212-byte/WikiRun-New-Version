"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentChoice,
} from "@/lib/consent/cookieConsent";

/**
 * Cookie consent banner. "Accept all" and "Essential only" carry equal
 * visual weight (UK ICO guidance: rejecting must be as easy as accepting).
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getCookieConsent() === null) setVisible(true);
  }, []);

  const choose = (choice: CookieConsentChoice) => {
    setCookieConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 animate-slide-up">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border/60 bg-card p-5 shadow-soft-lg">
        <h2 className="font-semibold mb-1.5">Cookies on WikiRun</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          We use essential cookies to keep you signed in and make the game
          work. With your permission we&apos;d also like to use cookies for
          advertising and to understand how the game is played. See our{" "}
          <Link
            href="/privacy"
            className="text-primary hover:text-primary/80 underline underline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => choose("all")}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_16px_-2px_hsl(var(--primary)/0.5)] hover:translate-y-[-1px] transition-all duration-200"
          >
            Accept all
          </button>
          <button
            onClick={() => choose("essential")}
            className="flex-1 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition-all duration-200"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
