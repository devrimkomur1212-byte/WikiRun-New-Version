/** Cookie carrying the return path across the Google sign-in round trip */
export const AUTH_NEXT_COOKIE = "auth_next";

/**
 * Returns the path only if it stays on this site. "?redirect=" comes from the
 * URL, so anything else could be used to send people off-site after sign-in.
 */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** The validated "?redirect=" of the current page. Browser only. */
export function redirectFromLocation(): string | null {
  return safeRedirectPath(new URLSearchParams(window.location.search).get("redirect"));
}
