const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";

/**
 * Fetches JSON from the Wikipedia API defensively.
 *
 * Wikipedia occasionally responds with an HTML error page (rate limiting,
 * maxlag, server errors) — calling res.json() on that throws. This helper
 * returns null on any non-OK status, non-JSON content type, or parse failure
 * so callers can fall back gracefully instead of crashing.
 */
export async function fetchWikiJson(
  params: URLSearchParams
): Promise<unknown | null> {
  try {
    const response = await fetch(`${WIKI_API_BASE}?${params}`);
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) return null;

    return await response.json();
  } catch (error) {
    console.error("Wikipedia API request failed:", error);
    return null;
  }
}
