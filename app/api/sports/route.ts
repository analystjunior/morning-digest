import { NextRequest, NextResponse } from "next/server";
import { fetchSportsHeadlines } from "@/lib/digest/sections/sports";

// GET /api/sports?leagues=NFL,NBA,MLB
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("leagues");
  const leagues = raw
    ? raw.split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  try {
    const items = await fetchSportsHeadlines(10, leagues);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/sports]", err);
    return NextResponse.json({ error: "Failed to fetch sports headlines", detail: message }, { status: 500 });
  }
}
