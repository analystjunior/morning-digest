import { NextRequest, NextResponse } from "next/server";
import { fetchQuoteData } from "@/lib/digest/sections/quote";

// GET /api/quote?tone=motivational
// tone is stored for future filtering; ZenQuotes returns random quotes for now
export async function GET(req: NextRequest) {
  const tone = req.nextUrl.searchParams.get("tone") ?? "any";
  try {
    const data = await fetchQuoteData(tone);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/quote] Error:", err);
    return NextResponse.json({ error: "Failed to fetch quote", detail: message }, { status: 500 });
  }
}
