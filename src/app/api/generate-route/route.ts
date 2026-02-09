import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getPopularArticle, getCategoricallyUnrelatedPair } from "@/lib/articles";

const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(ip, 10, 60_000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty") || "medium";

    let startTitle: string;
    let targetTitle: string;

    switch (difficulty) {
      case "easy": {
        // Both articles from well-known list
        startTitle = getPopularArticle();
        targetTitle = getPopularArticle();
        while (targetTitle === startTitle) {
          targetTitle = getPopularArticle();
        }
        break;
      }
      case "medium": {
        // Both well-known but from different categories
        const pair = getCategoricallyUnrelatedPair();
        startTitle = pair.start;
        targetTitle = pair.target;
        break;
      }
      case "hard":
      default: {
        // Random start, well-known destination
        let randomTitle: string;
        try {
          const randomArticle = await getRandomArticle();
          randomTitle = randomArticle.title;
        } catch {
          randomTitle = getPopularArticle();
        }
        startTitle = randomTitle;
        targetTitle = getPopularArticle();
        while (targetTitle === startTitle) {
          targetTitle = getPopularArticle();
        }
        break;
      }
    }

    return NextResponse.json({ start_title: startTitle, target_title: targetTitle, difficulty });
  } catch (error) {
    console.error("Failed to generate random route:", error);
    return NextResponse.json(
      { error: "Failed to generate route" },
      { status: 500 }
    );
  }
}

async function getRandomArticle(): Promise<{ title: string }> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "random",
    rnnamespace: "0",
    rnlimit: "1",
    origin: "*",
  });

  const response = await fetch(`${WIKI_API_BASE}?${params}`);
  const data = await response.json();

  if (!data.query?.random?.[0]) {
    throw new Error("Failed to get random article");
  }

  return {
    title: data.query.random[0].title,
  };
}
