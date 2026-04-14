export interface HeadlineItem {
  title: string;
  link?: string;
  pubDate?: string;
}

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

export async function fetchSportsHeadlines(limit = 8): Promise<HeadlineItem[]> {
  const res = await fetch("https://www.espn.com/espn/rss/news", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Briefd/1.0)" },
  });
  if (!res.ok) throw new Error(`ESPN RSS fetch failed: HTTP ${res.status}`);
  const xml = await res.text();
  return parseRSS(xml).slice(0, limit);
}
