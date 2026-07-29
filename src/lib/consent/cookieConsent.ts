export type CookieConsentChoice = "all" | "essential";

const CONSENT_KEY = "wikirun-cookie-consent";

/**
 * Returns the visitor's stored cookie choice, or null if they haven't
 * decided yet. Future analytics (e.g. PostHog) must only initialise when
 * this returns "all".
 */
export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "all" || value === "essential" ? value : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(choice: CookieConsentChoice) {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage unavailable (private mode etc.) — banner will just reappear
  }
}
