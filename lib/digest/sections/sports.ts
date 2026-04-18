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
