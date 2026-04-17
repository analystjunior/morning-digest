export interface HeadlineItem {
  title: string;
  link?: string;
  pubDate?: string;
}

const LEAGUE_RSS: Record<string, string> = {
  NFL:                   "https://www.espn.com/espn/rss/nfl/news",
  NBA:                   "https://www.espn.com/espn/rss/nba/news",
  MLB:                   "https://www.espn.com/espn/rss/mlb/news",
  NHL:                   "https://www.espn.com/espn/rss/nhl/news",
};
const GENERAL_RSS = "https://www.espn.com/espn/rss/news";

function parseRSS(xml: string): HeadlineItem[] {
  const items: HeadlineItem[] = [];
  for (const match of Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))) {
    const block = match[1];
    const cdataTitle = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1];
    const plainTitle = block.match(/<title>(.*?)<\/title>/)?.[1];
    const title = (cdataTitle ?? plainTitle ?? "").trim();
    const link = (block.match(/<link>(.*?)<\/link>/)?.[1] ?? "").trim();
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "").trim();
    if (title) items.push({ title, link, pubDate });
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
  const normalized = leagues.map((l) => l.toUpperCase());
  const urls = normalized.length > 0
    ? Array.from(new Set(normalized.map((l) => LEAGUE_RSS[l] ?? GENERAL_RSS)))
    : [GENERAL_RSS];

  const batches = await Promise.all(urls.map(fetchRSS));

  // Merge and deduplicate by title
  const seen = new Set<string>();
  const merged: HeadlineItem[] = [];
  for (const items of batches) {
    for (const item of items) {
      if (!seen.has(item.title)) {
        seen.add(item.title);
        merged.push(item);
      }
    }
  }
  return merged.slice(0, limit);
}
