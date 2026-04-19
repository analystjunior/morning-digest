import { NextRequest, NextResponse } from "next/server";

interface CGCoin {
  id?: string;
  name?: string;
  symbol?: string;
}

interface CGSearchResult {
  coins?: CGCoin[];
}

// GET /api/coin-search?q=bitcoin
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = (await res.json()) as CGSearchResult;
    const results = (data.coins ?? [])
      .slice(0, 5)
      .filter((c) => c.id)
      .map((c) => ({
        id: c.id!,
        name: c.name ?? c.id!,
        symbol: (c.symbol ?? "").toUpperCase(),
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
