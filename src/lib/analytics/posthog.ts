import posthog from "posthog-js";
import { getCookieConsent } from "@/lib/consent/cookieConsent";

// Publishable client key — safe to ship in the bundle
const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  "phc_pLcyg5h5cnNqz4Yamg6ZQLen3Cv9wvvbAPwGDuVyZ76o";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

let initialised = false;

/**
 * Initialises PostHog only when the visitor accepted all cookies.
 * Safe to call repeatedly; no-ops on the server, without consent, or when
 * already initialised.
 */
export function initPostHogIfConsented() {
  if (typeof window === "undefined" || initialised) return;
  if (getCookieConsent() !== "all") return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: "2025-05-24",
    // PostHog's documented App Router pattern: auto-capture misses SPA
    // navigations, so PostHogInit captures $pageview on route changes
    capture_pageview: false,
    capture_exceptions: true,
  });
  initialised = true;
}

/** Whether PostHog is running (i.e. consent given and init completed). */
export function isPostHogReady() {
  return initialised;
}

/** Manually capture a pageview for the current URL. */
export function capturePageview() {
  if (!initialised) return;
  posthog.capture("$pageview", { $current_url: window.location.href });
}

/** Capture an event. Silently no-ops when PostHog isn't running (no consent). */
export function track(event: string, properties?: Record<string, unknown>) {
  if (!initialised) return;
  posthog.capture(event, properties);
}

/** Tie events to the logged-in player. No-ops without consent. */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
) {
  if (!initialised) return;
  posthog.identify(userId, properties);
}
