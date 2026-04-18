import { NextRequest, NextResponse } from "next/server";

interface CGSearchResult {
  coins?: Array<{
    id?: string;
    name?: string;
    symbol?: string;
  }>;
}

// GET /api/coin-search?q=bitcoin
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ result: null });

  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return NextResponse.json({ result: null });

    const data = await res.json() as CGSearchResult;
    const coin = data.coins?.[0];
    if (!coin?.id) return NextResponse.json({ result: null });

    return NextResponse.json({
      result: {
        id: coin.id,
        name: coin.name ?? coin.id,
        symbol: (coin.symbol ?? "").toUpperCase(),
      },
    });
  } catch {
    return NextResponse.json({ result: null });
  }
}
