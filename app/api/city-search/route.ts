import { NextRequest, NextResponse } from "next/server";

interface GeoResult {
  name: string;
  state?: string;
  country: string;
}

// Country priority: US first, then major English-speaking + global cities
const COUNTRY_PRIORITY: Record<string, number> = {
  US: 0, GB: 1, CA: 2, AU: 3, NZ: 4,
  DE: 5, FR: 6, JP: 7, IN: 8, BR: 9, MX: 10, IT: 11, ES: 12,
};

function countryRank(country: string): number {
  return COUNTRY_PRIORITY[country] ?? 99;
}

// GET /api/city-search?q=Chicago
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    // Fetch more than we need so sorting has enough to work with
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=10&appid=${process.env.OPENWEATHER_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json({ results: [] });

    const data = (await res.json()) as GeoResult[];

    const seen = new Set<string>();
    const results = data
      .sort((a, b) => countryRank(a.country) - countryRank(b.country))
      .map((r) => ({ label: [r.name, r.state, r.country].filter(Boolean).join(", ") }))
      .filter(({ label }) => {
        if (seen.has(label)) return false;
        seen.add(label);
        return true;
      })
      .slice(0, 5);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
