import { NextResponse } from "next/server";

const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";

// List of obscure topic categories to pick from for more interesting routes
const OBSCURE_CATEGORIES = [
  "Category:Medieval_people",
  "Category:Ancient_Roman_cities",
  "Category:Extinct_mammals",
  "Category:Microorganisms",
  "Category:Philosophers",
  "Category:Islands",
  "Category:Mountains",
  "Category:Battles",
  "Category:Minerals",
  "Category:Asteroids",
  "Category:Rivers",
  "Category:Bridges",
  "Category:Castles",
  "Category:Inventors",
  "Category:Chemical_compounds",
  "Category:Musical_instruments",
  "Category:Festivals",
  "Category:Archaeological_sites",
  "Category:Mythology",
  "Category:Explorers",
];

/**
 * Gets random articles from a specific category for more interesting obscure articles
 */
async function getRandomFromCategory(category: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "categorymembers",
    cmtitle: category,
    cmlimit: "50",
    cmtype: "page",
    origin: "*",
  });

  try {
    const response = await fetch(`${WIKI_API_BASE}?${params}`);
    const data = await response.json();

    if (data.query?.categorymembers) {
      return data.query.categorymembers.map((m: { title: string }) => m.title);
    }
  } catch (error) {
    console.error("Failed to fetch category members:", error);
  }

  return [];
}

/**
 * Gets truly random articles from Wikipedia
 */
async function getRandomArticles(count: number): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "random",
    rnnamespace: "0",
    rnlimit: String(count * 5), // Get extra to filter
    origin: "*",
  });

  try {
    const response = await fetch(`${WIKI_API_BASE}?${params}`);
    const data = await response.json();

    if (data.query?.random) {
      return data.query.random
        .filter((article: { title: string }) =>
          article.title.length > 4 &&
          !article.title.includes("(disambiguation)") &&
          !article.title.startsWith("List of") &&
          !article.title.includes(":")
        )
        .slice(0, count)
        .map((article: { title: string }) => article.title);
    }
  } catch (error) {
    console.error("Failed to fetch random articles:", error);
  }

  return [];
}

/**
 * Validates that an article exists and has enough outgoing links
 */
async function validateArticleHasLinks(title: string): Promise<boolean> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    format: "json",
    origin: "*",
    prop: "links",
  });

  try {
    const response = await fetch(`${WIKI_API_BASE}?${params}`);
    const data = await response.json();

    if (data.error) return false;

    // Article should have at least 10 outgoing links to be useful
    const links = data.parse?.links?.filter(
      (l: { ns: number }) => l.ns === 0
    ) || [];

    return links.length >= 10;
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    // Strategy: Use a mix of random and category-based articles for variety
    const useCategory = Math.random() < 0.5;

    let candidates: string[] = [];

    if (useCategory) {
      // Pick a random obscure category
      const category = OBSCURE_CATEGORIES[Math.floor(Math.random() * OBSCURE_CATEGORIES.length)];
      candidates = await getRandomFromCategory(category);
    }

    // If category didn't yield enough, fall back to random
    if (candidates.length < 10) {
      const randomArticles = await getRandomArticles(20);
      candidates = [...candidates, ...randomArticles];
    }

    // Shuffle candidates
    candidates = candidates.sort(() => Math.random() - 0.5);

    // Find two valid articles (with enough links)
    let startTitle: string | null = null;
    let targetTitle: string | null = null;

    for (const candidate of candidates) {
      if (!startTitle) {
        const valid = await validateArticleHasLinks(candidate);
        if (valid) {
          startTitle = candidate;
          continue;
        }
      } else if (!targetTitle && candidate !== startTitle) {
        const valid = await validateArticleHasLinks(candidate);
        if (valid) {
          targetTitle = candidate;
          break;
        }
      }
    }

    if (!startTitle || !targetTitle) {
      // Fallback: just get any two random articles
      const fallback = await getRandomArticles(2);
      startTitle = fallback[0] || "Philosophy";
      targetTitle = fallback[1] || "Mathematics";
    }

    // Randomly assign difficulty based on obscurity
    const difficulties = ["easy", "medium", "hard"];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    return NextResponse.json({
      startTitle,
      targetTitle,
      difficulty,
    });
  } catch (error) {
    console.error("Failed to generate random route:", error);
    return NextResponse.json(
      { error: "Failed to generate route" },
      { status: 500 }
    );
  }
}
