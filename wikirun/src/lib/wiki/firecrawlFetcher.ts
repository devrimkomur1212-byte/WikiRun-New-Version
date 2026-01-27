import Firecrawl from "@mendable/firecrawl-js";
import DOMPurify from "isomorphic-dompurify";
import type { WikiArticle } from "./types";

// Lazy initialization of Firecrawl client
let firecrawlClient: Firecrawl | null = null;

function getFirecrawl(): Firecrawl {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is not set");
    }
    firecrawlClient = new Firecrawl({ apiKey });
  }
  return firecrawlClient;
}

/**
 * Fetches a Wikipedia article using Firecrawl
 */
export async function fetchWikiArticleWithFirecrawl(
  title: string
): Promise<WikiArticle> {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

  try {
    const firecrawl = getFirecrawl();
    const response = await firecrawl.scrape(url, {
      formats: ["html"],
      onlyMainContent: true,
    });

    if (!response.html) {
      throw new Error("Failed to scrape article");
    }

    // Sanitize the HTML
    const sanitized = DOMPurify.sanitize(response.html, {
      ADD_ATTR: ["target", "data-wiki-link", "data-wiki-title"],
      FORBID_TAGS: ["style", "script"],
    });

    // Extract the title from the page (Firecrawl should provide this)
    const displayTitle = response.metadata?.title?.replace(" - Wikipedia", "") || title;

    return {
      title: title,
      displayTitle: displayTitle,
      html: sanitized,
    };
  } catch (error) {
    console.error("Firecrawl error:", error);
    throw new Error(`Failed to fetch article: ${title}`);
  }
}

/**
 * Gets random Wikipedia articles for game routes
 * Uses Wikipedia's random article API to get truly random obscure articles
 */
export async function getRandomWikipediaArticles(count: number = 2): Promise<string[]> {
  const articles: string[] = [];

  // Fetch random articles from Wikipedia API
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "random",
    rnnamespace: "0", // Main namespace only (actual articles)
    rnlimit: String(count * 3), // Get extra in case we need to filter
    origin: "*",
  });

  try {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?${params}`
    );
    const data = await response.json();

    if (data.query?.random) {
      // Filter to get articles that are likely good for the game
      // (exclude very short titles which are often disambiguations)
      const validArticles = data.query.random
        .filter((article: { title: string }) =>
          article.title.length > 3 &&
          !article.title.includes("(disambiguation)") &&
          !article.title.startsWith("List of")
        )
        .slice(0, count)
        .map((article: { title: string }) => article.title);

      articles.push(...validArticles);
    }
  } catch (error) {
    console.error("Failed to fetch random articles:", error);
    throw new Error("Could not generate random articles");
  }

  // Make sure we have enough articles
  if (articles.length < count) {
    throw new Error("Not enough valid articles found");
  }

  return articles;
}

/**
 * Validates if a Wikipedia article exists and is suitable for the game
 */
export async function validateArticle(title: string): Promise<boolean> {
  const params = new URLSearchParams({
    action: "query",
    titles: title,
    format: "json",
    origin: "*",
    prop: "info",
  });

  try {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?${params}`
    );
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return false;

    const pageIds = Object.keys(pages);
    return pageIds.length > 0 && !pages[pageIds[0]].missing;
  } catch {
    return false;
  }
}
