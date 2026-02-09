import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";

// Popular, well-known articles for easy mode
const POPULAR_ARTICLES: string[] = [
  // Countries
  "United States", "France", "Japan", "Brazil", "India", "Germany", "Canada",
  "Australia", "China", "Italy", "Mexico", "United Kingdom", "Russia", "Egypt",
  "South Korea", "Argentina", "Nigeria", "Thailand", "Vietnam", "Peru",
  // Cities
  "New York City", "London", "Paris", "Tokyo", "Sydney", "Berlin", "Rome",
  "Los Angeles", "Chicago", "Toronto", "Madrid", "Mumbai", "Cairo", "Bangkok",
  // Famous people
  "Albert Einstein", "Leonardo da Vinci", "Isaac Newton", "Marie Curie",
  "William Shakespeare", "Wolfgang Amadeus Mozart", "Charles Darwin",
  "Nikola Tesla", "Alan Turing", "Cleopatra", "Napoleon Bonaparte",
  // Broadly well-known topics
  "World War II", "The Internet", "Soccer", "Olympic Games", "Space shuttle",
  "Mount Everest", "Amazon River", "Great Wall of China", "Coffee", "Pizza",
];

function getPopularArticle(): string {
  return POPULAR_ARTICLES[Math.floor(Math.random() * POPULAR_ARTICLES.length)];
}

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

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(ip, 10, 60_000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    // Check if this is for ranked mode (weighted difficulty)
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    // Determine difficulty
    let difficulty: string;
    if (mode === "ranked") {
      // Ranked distribution: 40% easy, 50% medium, 10% hard
      const roll = Math.random();
      if (roll < 0.4) difficulty = "easy";
      else if (roll < 0.9) difficulty = "medium";
      else difficulty = "hard";
    } else {
      // Default: equal distribution
      const difficulties = ["easy", "medium", "hard"];
      difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    }

    let startTitle: string | null = null;
    let targetTitle: string | null = null;

    if (difficulty === "easy") {
      // Both articles from POPULAR_ARTICLES
      startTitle = getPopularArticle();
      targetTitle = getPopularArticle();
      while (targetTitle === startTitle) {
        targetTitle = getPopularArticle();
      }
    } else if (difficulty === "hard") {
      // Hard: random start article, popular destination
      // The player needs to know where they're going to have a chance
      const randomArticles = await getRandomArticles(10);
      for (const candidate of randomArticles) {
        const valid = await validateArticleHasLinks(candidate);
        if (valid) {
          startTitle = candidate;
          break;
        }
      }
      if (!startTitle) {
        startTitle = randomArticles[0] || "Philosophy";
      }
      targetTitle = getPopularArticle();
      while (targetTitle === startTitle) {
        targetTitle = getPopularArticle();
      }
    } else {
      // Medium: obscure categories or random articles for both
      const useCategory = Math.random() < 0.5;

      let candidates: string[] = [];

      if (useCategory) {
        const category = OBSCURE_CATEGORIES[Math.floor(Math.random() * OBSCURE_CATEGORIES.length)];
        candidates = await getRandomFromCategory(category);
      }

      if (candidates.length < 10) {
        const randomArticles = await getRandomArticles(20);
        candidates = [...candidates, ...randomArticles];
      }

      candidates = candidates.sort(() => Math.random() - 0.5);

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
        const fallback = await getRandomArticles(2);
        startTitle = fallback[0] || "Philosophy";
        targetTitle = fallback[1] || "Mathematics";
      }
    }

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
