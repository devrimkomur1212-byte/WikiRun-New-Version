import { NextRequest, NextResponse } from "next/server";
import DOMPurify from "isomorphic-dompurify";
import { rateLimit } from "@/lib/rate-limit";

const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ title: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(ip, 60, 60_000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { title } = await params;

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const decodedTitle = decodeURIComponent(title);

  // Fetch from Wikipedia API
  const wikiParams = new URLSearchParams({
    action: "parse",
    page: decodedTitle,
    format: "json",
    origin: "*",
    prop: "text|displaytitle",
    disableeditsection: "1",
    disabletoc: "1",
    redirects: "1",
  });

  try {
    const response = await fetch(`${WIKI_API_BASE}?${wikiParams}`);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.info || "Article not found" },
        { status: 404 }
      );
    }

    const rawHtml = data.parse?.text?.["*"];
    if (!rawHtml) {
      return NextResponse.json(
        { error: "Failed to fetch article content" },
        { status: 500 }
      );
    }

    // Sanitize the HTML
    const sanitized = DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ["target", "data-wiki-link", "data-wiki-title", "href"],
      FORBID_TAGS: ["style", "script"],
    });

    const displayTitle = data.parse?.displaytitle || decodedTitle;

    return NextResponse.json({
      title: data.parse?.title || decodedTitle,
      displayTitle,
      html: sanitized,
    });
  } catch (error) {
    console.error("Failed to fetch article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}
