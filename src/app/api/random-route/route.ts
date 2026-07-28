import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { generateRandomRoute } from "@/lib/wiki/randomRoute";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = rateLimit(ip, 10, 60_000);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const route = await generateRandomRoute(searchParams.get("mode"));
    return NextResponse.json(route);
  } catch (error) {
    console.error("Failed to generate random route:", error);
    return NextResponse.json(
      { error: "Failed to generate route" },
      { status: 500 }
    );
  }
}
