import DOMPurify from "isomorphic-dompurify";
import type { WikiArticle, ParsedWikiResponse, WikiError } from "./types";

const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";
const WIKI_REST_API = "https://en.wikipedia.org/api/rest_v1";

/**
 * Fetches Wikipedia article HTML using the fast REST API (CDN-cached)
 * Falls back to Action API if REST API fails
 */
export async function fetchWikiArticle(title: string): Promise<WikiArticle> {
  // Try the fast REST API first (globally cached, much faster)
  try {
    const encodedTitle = encodeURIComponent(title.replace(/ /g, "_"));
    const restResponse = await fetch(`${WIKI_REST_API}/page/html/${encodedTitle}`, {
      headers: {
        'Accept': 'text/html; charset=utf-8',
      },
    });

    if (restResponse.ok) {
      const rawHtml = await restResponse.text();

      // Minimal sanitization - only block dangerous tags
      const sanitized = DOMPurify.sanitize(rawHtml, {
        FORBID_TAGS: ["script", "style", "iframe"],
      });

      // Extract the actual title from the response headers or use the input
      const displayTitle = restResponse.headers.get('content-disposition')?.match(/filename="(.+?)"/)?.[1] || title;

      return {
        title: title,
        displayTitle: displayTitle,
        html: sanitized,
      };
    }
  } catch (error) {
    console.warn('REST API failed, falling back to Action API:', error);
  }

  // Fallback to Action API (slower but more reliable)
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    format: "json",
    origin: "*",
    prop: "text|displaytitle",
    disableeditsection: "1",
    disabletoc: "1",
    redirects: "1",
  });

  const response = await fetch(`${WIKI_API_BASE}?${params}`);
  const data: ParsedWikiResponse | WikiError = await response.json();

  if ("error" in data) {
    throw new Error(data.error.info || "Failed to fetch article");
  }

  const rawHtml = data.parse.text["*"];

  // Minimal sanitization - only block dangerous tags
  const sanitized = DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: ["script", "style", "iframe"],
  });

  return {
    title: data.parse.title,
    displayTitle: data.parse.displaytitle || data.parse.title,
    html: sanitized,
  };
}

/**
 * Fetches outgoing links from a Wikipedia article
 * Used to detect if the current page has a direct link to the target
 */
export async function fetchOutgoingLinks(title: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    format: "json",
    origin: "*",
    prop: "links",
    redirects: "1",
  });

  const response = await fetch(`${WIKI_API_BASE}?${params}`);
  const data: ParsedWikiResponse | WikiError = await response.json();

  if ("error" in data) {
    return [];
  }

  if (!data.parse.links) {
    return [];
  }

  // Only include main namespace links (ns === 0)
  return data.parse.links
    .filter((link) => link.ns === 0 && link.exists !== undefined)
    .map((link) => link["*"]);
}

/**
 * Validates if a Wikipedia article exists
 */
export async function validateArticleExists(title: string): Promise<boolean> {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    format: "json",
    origin: "*",
  });

  const response = await fetch(`${WIKI_API_BASE}?${params}`);
  const data = await response.json();

  const pages = data.query?.pages;
  if (!pages) return false;

  // If the page ID is -1, the article doesn't exist
  const pageIds = Object.keys(pages);
  return pageIds.length > 0 && !pages[pageIds[0]].missing;
}

/**
 * Gets the canonical title of a Wikipedia article (follows redirects)
 */
export async function getCanonicalTitle(title: string): Promise<string> {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    format: "json",
    origin: "*",
    redirects: "1",
  });

  const response = await fetch(`${WIKI_API_BASE}?${params}`);
  const data = await response.json();

  const pages = data.query?.pages;
  if (!pages) return title;

  const pageIds = Object.keys(pages);
  if (pageIds.length === 0) return title;

  return pages[pageIds[0]].title || title;
}
