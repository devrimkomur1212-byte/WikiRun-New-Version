import { NextResponse } from "next/server";

const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty") || "medium";

    let startTitle: string;
    let targetTitle: string;

    switch (difficulty) {
      case "easy": {
        // Both articles from popular list - familiar territory
        startTitle = getPopularArticle();
        targetTitle = getPopularArticle();
        while (targetTitle === startTitle) {
          targetTitle = getPopularArticle();
        }
        break;
      }
      case "medium": {
        // Both popular articles - slightly harder combinations
        startTitle = getPopularArticle();
        targetTitle = getPopularArticle();
        while (targetTitle === startTitle) {
          targetTitle = getPopularArticle();
        }
        break;
      }
      case "hard":
      default: {
        // Popular start, random target - the real challenge
        startTitle = getPopularArticle();
        const randomArticle = await getRandomArticle();
        targetTitle = randomArticle.title;
        if (targetTitle === startTitle) {
          const retry = await getRandomArticle();
          targetTitle = retry.title;
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
