import { NextRequest, NextResponse } from "next/server";

interface AVMatch {
  "1. symbol": string;
  "2. name": string;
  "3. type": string;
  "4. region": string;
}

interface AVResponse {
  bestMatches?: AVMatch[];
}

// GET /api/ticker-search?q=TSLA
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(q)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = (await res.json()) as AVResponse;
    const results = (data.bestMatches ?? [])
      .slice(0, 5)
      .map((m) => ({
        symbol: m["1. symbol"],
        name: m["2. name"],
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
