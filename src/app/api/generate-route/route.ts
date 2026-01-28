import { NextResponse } from "next/server";

const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";

/**
 * Generates a random Wikipedia route
 * Uses Wikipedia's random article API to get two articles
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty") || "medium";

    // Get two random articles
    const article1 = await getRandomArticle();
    const article2 = await getRandomArticle();

    // Ensure they're different
    if (article1.title === article2.title) {
      const article2Retry = await getRandomArticle();
      return NextResponse.json({
        start_title: article1.title,
        target_title: article2Retry.title,
        difficulty,
      });
    }

    return NextResponse.json({
      start_title: article1.title,
      target_title: article2.title,
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

async function getRandomArticle(): Promise<{ title: string }> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "random",
    rnnamespace: "0", // Main namespace only
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
