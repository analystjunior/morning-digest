import { NextRequest, NextResponse } from "next/server";
import { fetchStocksData } from "@/lib/digest/sections/stocks";

// GET /api/stocks?tickers=AAPL,MSFT,SPY
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("tickers");
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Missing tickers parameter" }, { status: 400 });
  }

  const tickers = raw
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (!tickers.length) {
    return NextResponse.json({ error: "No valid tickers provided" }, { status: 400 });
  }

  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return NextResponse.json({ error: "ALPHA_VANTAGE_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const data = await fetchStocksData({ tickers });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/stocks]", err);
    return NextResponse.json({ error: "Failed to fetch stocks", detail: message }, { status: 500 });
  }
}
