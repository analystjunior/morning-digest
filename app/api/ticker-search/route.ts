import { NextRequest, NextResponse } from "next/server";

interface YFSearchResult {
  quotes?: Array<{
    symbol?: string;
    longname?: string;
    shortname?: string;
    quoteType?: string;
  }>;
}

// GET /api/ticker-search?q=TSLA
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ result: null });

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=1&newsCount=0&enableFuzzyQuery=false`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Briefd/1.0)",
        "Accept": "application/json",
      },
    });
    if (!res.ok) return NextResponse.json({ result: null });

    const data = await res.json() as YFSearchResult;
    const quote = data.quotes?.[0];
    if (!quote?.symbol) return NextResponse.json({ result: null });

    return NextResponse.json({
      result: {
        symbol: quote.symbol.toUpperCase(),
        name: quote.longname ?? quote.shortname ?? quote.symbol,
      },
    });
  } catch {
    return NextResponse.json({ result: null });
  }
}
