import { NextRequest, NextResponse } from "next/server";
import { fetchStocksData } from "@/lib/digest/sections/stocks";

const DEFAULT_TICKERS = ["SPY", "AAPL", "NVDA"];

// GET /api/stocks?tickers=AAPL,MSFT,SPY (defaults to SPY, AAPL, NVDA)
export async function GET(req: NextRequest) {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return NextResponse.json({ error: "ALPHA_VANTAGE_API_KEY is not configured" }, { status: 500 });
  }

  const raw = req.nextUrl.searchParams.get("tickers");
  const tickers = raw
    ? raw.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean)
    : DEFAULT_TICKERS;

  try {
    const quotes = await fetchStocksData(tickers);
    return NextResponse.json({ quotes });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/stocks]", err);
    return NextResponse.json({ error: "Failed to fetch stocks", detail: message }, { status: 500 });
  }
}
