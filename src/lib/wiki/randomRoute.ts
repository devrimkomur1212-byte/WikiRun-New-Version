import { getPopularArticle, getCategoricallyUnrelatedPair } from "@/lib/articles";
import { fetchWikiJson } from "@/lib/wiki/api";

export type RouteDifficulty = "easy" | "medium" | "hard";

export interface GeneratedRoute {
  startTitle: string;
  targetTitle: string;
  difficulty: RouteDifficulty;
}

/**
 * Gets truly random articles from Wikipedia. Returns [] on any API failure.
 */
async function getRandomArticles(count: number): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "random",
    rnnamespace: "0",
    rnlimit: String(count * 5),
    origin: "*",
  });

  const data = (await fetchWikiJson(params)) as {
    query?: { random?: { title: string }[] };
  } | null;

  if (!data?.query?.random) return [];

  return data.query.random
    .filter(
      (article) =>
        article.title.length > 4 &&
        !article.title.includes("(disambiguation)") &&
        !article.title.startsWith("List of") &&
        !article.title.includes(":")
    )
    .slice(0, count)
    .map((article) => article.title);
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

  const data = (await fetchWikiJson(params)) as {
    error?: unknown;
    parse?: { links?: { ns: number }[] };
  } | null;

  if (!data || data.error) return false;

  const links = data.parse?.links?.filter((l) => l.ns === 0) || [];
  return links.length >= 10;
}

function getEasyPair(): { startTitle: string; targetTitle: string } {
  const startTitle = getPopularArticle();
  let targetTitle = getPopularArticle();
  while (targetTitle === startTitle) {
    targetTitle = getPopularArticle();
  }
  return { startTitle, targetTitle };
}

/**
 * Generates a start/target article pair. Never throws: hard-mode Wikipedia
 * lookups degrade to the popular-article list on failure, so matchmaking can
 * rely on this always returning a playable route.
 */
export async function generateRandomRoute(
  mode?: string | null
): Promise<GeneratedRoute> {
  let difficulty: RouteDifficulty;
  if (mode === "ranked") {
    // Ranked distribution: 40% easy, 50% medium, 10% hard
    const roll = Math.random();
    if (roll < 0.4) difficulty = "easy";
    else if (roll < 0.9) difficulty = "medium";
    else difficulty = "hard";
  } else {
    const difficulties: RouteDifficulty[] = ["easy", "medium", "hard"];
    difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  if (difficulty === "easy") {
    return { ...getEasyPair(), difficulty };
  }

  if (difficulty === "medium") {
    // Both well-known but from different categories
    const pair = getCategoricallyUnrelatedPair();
    return { startTitle: pair.start, targetTitle: pair.target, difficulty };
  }

  // Hard: random start, well-known destination
  let startTitle: string | null = null;
  const randomArticles = await getRandomArticles(10);
  for (const candidate of randomArticles) {
    if (await validateArticleHasLinks(candidate)) {
      startTitle = candidate;
      break;
    }
  }
  if (!startTitle) {
    startTitle = randomArticles[0] || getPopularArticle();
  }

  let targetTitle = getPopularArticle();
  while (targetTitle === startTitle) {
    targetTitle = getPopularArticle();
  }

  return { startTitle, targetTitle, difficulty };
}
