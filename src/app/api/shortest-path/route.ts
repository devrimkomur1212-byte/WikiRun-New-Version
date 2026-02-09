import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";

/**
 * Fetches all outgoing links from a Wikipedia article (namespace 0 only).
 */
async function getOutgoingLinks(title: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "links",
    titles: title,
    pllimit: "500",
    plnamespace: "0",
    origin: "*",
  });

  const res = await fetch(`${WIKI_API_BASE}?${params}`);
  const data = await res.json();

  const pages = data.query?.pages;
  if (!pages) return [];

  const pageId = Object.keys(pages)[0];
  const links = pages[pageId]?.links || [];
  return links.map((l: { title: string }) => l.title);
}

/**
 * Fetches backlinks — articles that link TO the given title (namespace 0 only).
 */
async function getBacklinks(title: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    list: "backlinks",
    bltitle: title,
    bllimit: "500",
    blnamespace: "0",
    origin: "*",
  });

  const res = await fetch(`${WIKI_API_BASE}?${params}`);
  const data = await res.json();

  const backlinks = data.query?.backlinks || [];
  return backlinks.map((b: { title: string }) => b.title);
}

/**
 * GET /api/shortest-path?start=TITLE&target=TITLE
 *
 * Computes the shortest Wikipedia path between two articles using:
 *   - Depth 1: direct link check (start → target)
 *   - Depth 2: bidirectional check (start's links ∩ target's backlinks)
 *   - Falls back to "3+" if no path found within 2 hops
 */
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(ip, 15, 60_000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const target = searchParams.get("target");

    if (!start || !target) {
      return NextResponse.json(
        { error: "Both start and target params are required" },
        { status: 400 }
      );
    }

    // Normalise: capitalise first letter (Wikipedia convention)
    const normalise = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
    const startNorm = normalise(start);
    const targetNorm = normalise(target);

    // --- Depth 1: does start link directly to target? ---
    const startLinks = await getOutgoingLinks(startNorm);
    const startLinksLower = startLinks.map((t) => t.toLowerCase());

    if (startLinksLower.includes(targetNorm.toLowerCase())) {
      return NextResponse.json({
        found: true,
        path: [startNorm, targetNorm],
        hops: 1,
      });
    }

    // --- Depth 2: find a bridge article in (start's links) ∩ (target's backlinks) ---
    const targetBacklinks = await getBacklinks(targetNorm);
    const backlinksLower = new Set(targetBacklinks.map((t) => t.toLowerCase()));

    for (const link of startLinks) {
      if (backlinksLower.has(link.toLowerCase())) {
        return NextResponse.json({
          found: true,
          path: [startNorm, link, targetNorm],
          hops: 2,
        });
      }
    }

    // --- No path found within 2 hops ---
    return NextResponse.json({ found: false, minHops: "3+" });
  } catch (error) {
    console.error("Shortest path computation failed:", error);
    return NextResponse.json({ found: false, minHops: "unknown" });
  }
}
