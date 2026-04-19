// ── Favorite team game results ────────────────────────────────────────────────

export interface TeamGame {
  teamName: string;
  recent: {
    opponent: string;
    homeAway: "home" | "away";
    teamScore: number;
    opponentScore: number;
    result: "W" | "L" | "T";
    url?: string;
  } | null;
  upcoming: {
    opponent: string;
    homeAway: "home" | "away";
    isoDate: string;
    url?: string;
    broadcasts?: string;
  } | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EspnEvent = any;

// Score is a string for NFL/NBA/MLB/NHL and an object {displayValue, value} for soccer
function parseScore(raw: unknown): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "string") return parseInt(raw, 10) || 0;
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.displayValue === "string") return parseInt(obj.displayValue, 10) || 0;
    if (typeof obj.value === "number") return Math.round(obj.value);
  }
  return 0;
}

function parseTeamGame(events: EspnEvent[], teamId: string, teamName: string): TeamGame {
  const now = Date.now();
  const window24h = now - 24 * 60 * 60 * 1000;
  const window48h = now + 48 * 60 * 60 * 1000;

  let recent: TeamGame["recent"] = null;
  let upcoming: TeamGame["upcoming"] = null;

  for (const event of events) {
    const eventMs = new Date(event.date as string).getTime();
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const competitors: EspnEvent[] = competition.competitors ?? [];
    const teamComp = competitors.find((c: EspnEvent) => String(c.team?.id) === String(teamId));
    const oppComp  = competitors.find((c: EspnEvent) => String(c.team?.id) !== String(teamId));
    if (!teamComp || !oppComp) continue;

    const summaryLink: string | undefined = (event.links ?? []).find(
      (l: EspnEvent) => Array.isArray(l.rel) && l.rel.includes("summary")
    )?.href;

    // Determine past vs. future: use status when present; fall back to date comparison.
    // (Soccer returns status: null so we rely on date.)
    const state: string = event.status?.type?.state ?? (eventMs < now ? "post" : "pre");
    const completed: boolean = event.status?.type?.completed ?? (eventMs < now);

    if (state === "post" && completed && eventMs >= window24h && !recent) {
      recent = {
        opponent: oppComp.team?.displayName ?? "Unknown",
        homeAway: teamComp.homeAway === "home" ? "home" : "away",
        teamScore: parseScore(teamComp.score),
        opponentScore: parseScore(oppComp.score),
        result: teamComp.winner ? "W" : oppComp.winner ? "L" : "T",
        url: summaryLink,
      };
    }

    if (state === "pre" && eventMs >= now && eventMs <= window48h && !upcoming) {
      const broadcastNames: string[] = (competition.broadcasts ?? [])
        .map((b: EspnEvent) => b?.media?.shortName as string | undefined)
        .filter((n: string | undefined): n is string => !!n);
      upcoming = {
        opponent: oppComp.team?.displayName ?? "Unknown",
        homeAway: teamComp.homeAway === "home" ? "home" : "away",
        isoDate: event.date as string,
        url: summaryLink,
        broadcasts: broadcastNames.length > 0 ? broadcastNames.join(" / ") : undefined,
      };
    }

    if (recent && upcoming) break;
  }

  return { teamName, recent, upcoming };
}

export async function fetchTeamGames(
  sport: string,
  league: string,
  espnId: string,
  teamName: string
): Promise<TeamGame> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${espnId}/schedule`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return { teamName, recent: null, upcoming: null };
    const data = await res.json() as { events?: EspnEvent[] };
    return parseTeamGame(data.events ?? [], espnId, teamName);
  } catch {
    return { teamName, recent: null, upcoming: null };
  }
}

export function formatTeamGameItems(game: TeamGame): string[] {
  const lines: string[] = [];

  if (game.recent) {
    const g = game.recent;
    const vs = g.homeAway === "home" ? `vs. ${g.opponent}` : `@ ${g.opponent}`;
    lines.push(`${g.result} ${g.teamScore}–${g.opponentScore} ${vs}`);
  }

  if (game.upcoming) {
    const g = game.upcoming;
    const vs = g.homeAway === "home" ? `vs. ${g.opponent}` : `@ ${g.opponent}`;
    const dt = new Date(g.isoDate);
    const label = dt.toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const bcast = g.broadcasts ? ` · ${g.broadcasts}` : "";
    lines.push(`Next: ${vs} · ${label} ET${bcast}`);
  }

  return lines;
}

// ── Headlines ─────────────────────────────────────────────────────────────────

export interface HeadlineItem {
  title: string;
  link?: string;
  pubDate?: string;
  league?: string;
}

interface LeagueConfig {
  url: string;
}

const LEAGUE_CONFIG: Record<string, LeagueConfig> = {
  NFL:                  { url: "https://www.espn.com/espn/rss/nfl/news" },
  NBA:                  { url: "https://www.espn.com/espn/rss/nba/news" },
  MLB:                  { url: "https://www.espn.com/espn/rss/mlb/news" },
  NHL:                  { url: "https://www.espn.com/espn/rss/nhl/news" },
  Soccer:               { url: "https://www.espn.com/espn/rss/soccer/news" },
  "College Football":   { url: "https://www.espn.com/espn/rss/ncf/news" },
  "College Basketball": { url: "https://www.espn.com/espn/rss/mens-college-basketball/news" },
};

const GENERAL_RSS = "https://www.espn.com/espn/rss/news";

function stripCDATA(s: string): string {
  return s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1").trim();
}

function parseRSS(xml: string): HeadlineItem[] {
  const items: HeadlineItem[] = [];
  for (const match of Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))) {
    const block = match[1];

    const rawTitle =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
      block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const title = stripCDATA(rawTitle).trim();

    const rawLink =
      block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/)?.[1] ??
      block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "";
    const link = stripCDATA(rawLink).trim();

    const rawDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
    const pubDate = stripCDATA(rawDate).trim();

    if (title) items.push({ title, link: link || undefined, pubDate: pubDate || undefined });
  }
  return items;
}

async function fetchRSS(url: string): Promise<HeadlineItem[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Briefd/1.0)" },
    });
    if (!res.ok) return [];
    return parseRSS(await res.text());
  } catch {
    return [];
  }
}

export async function fetchSportsHeadlines(limit = 8, leagues: string[] = []): Promise<HeadlineItem[]> {
  const normalized = leagues.filter((l) => l in LEAGUE_CONFIG);

  if (normalized.length === 0) {
    return (await fetchRSS(GENERAL_RSS)).slice(0, limit);
  }

  // Fetch unique URLs once (Premier League + Champions League share the soccer feed)
  const urlSet = new Set(normalized.map((l) => LEAGUE_CONFIG[l]?.url ?? GENERAL_RSS));
  const urlResults = new Map<string, HeadlineItem[]>();
  await Promise.all(
    Array.from(urlSet).map(async (url) => {
      urlResults.set(url, await fetchRSS(url));
    })
  );

  // Distribute limit evenly across leagues; remainder goes to first
  const n = normalized.length;
  const perSource = Math.floor(limit / n);
  const extra = limit % n;

  const seen = new Set<string>();
  const merged: HeadlineItem[] = [];

  normalized.forEach((l, i) => {
    const cfg = LEAGUE_CONFIG[l] ?? { url: GENERAL_RSS };
    const items = urlResults.get(cfg.url) ?? [];
    const alloc = perSource + (i === 0 ? extra : 0);
    let added = 0;
    for (const item of items) {
      if (added >= alloc) break;
      if (!seen.has(item.title)) {
        seen.add(item.title);
        merged.push({ ...item, league: l });
        added++;
      }
    }
  });

  return merged;
}
