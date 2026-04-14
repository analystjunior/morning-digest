import { NextResponse } from "next/server";
import { fetchSportsHeadlines } from "@/lib/digest/sections/sports";

// GET /api/sports — returns top ESPN sports headlines from RSS
export async function GET() {
  try {
    const items = await fetchSportsHeadlines();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/sports]", err);
    return NextResponse.json({ error: "Failed to fetch sports headlines", detail: message }, { status: 500 });
  }
}
