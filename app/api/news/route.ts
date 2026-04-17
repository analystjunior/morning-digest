import { NextRequest, NextResponse } from "next/server";
import { fetchNewsHeadlines } from "@/lib/digest/sections/news";

// GET /api/news?category=technology
export async function GET(req: NextRequest) {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "NEWS_API_KEY is not configured" }, { status: 500 });
  }

  const category = req.nextUrl.searchParams.get("category") ?? "general";

  try {
    const headlines = await fetchNewsHeadlines(5, category);
    return NextResponse.json({ headlines });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/news]", err);
    return NextResponse.json({ error: "Failed to fetch news", detail: message }, { status: 500 });
  }
}
