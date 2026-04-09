import { NextRequest, NextResponse } from "next/server";
import { fetchSportsData } from "@/lib/digest/sections/sports";

// GET /api/sports?leagues=NBA,NFL&teams=Los Angeles Lakers
export async function GET(req: NextRequest) {
  const rawLeagues = req.nextUrl.searchParams.get("leagues");
  if (!rawLeagues?.trim()) {
    return NextResponse.json({ error: "Missing leagues parameter" }, { status: 400 });
  }

  const leagues = rawLeagues
    .split(",")
    .map((l) => l.trim().toUpperCase())
    .filter(Boolean);

  if (!leagues.length) {
    return NextResponse.json({ error: "No valid leagues provided" }, { status: 400 });
  }

  const rawTeams = req.nextUrl.searchParams.get("teams");
  const teams = rawTeams
    ? rawTeams.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;

  try {
    const data = await fetchSportsData({ leagues, teams });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/sports]", err);
    return NextResponse.json({ error: "Failed to fetch sports data", detail: message }, { status: 500 });
  }
}
