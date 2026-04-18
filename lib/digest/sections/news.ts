export interface NewsHeadline {
  title: string;
  source: string;
  url?: string;
  category?: string;
}

interface NewsAPIArticle {
  title?: string;
  url?: string;
  source?: { name?: string };
}

interface NewsAPIResponse {
  status: string;
  articles?: NewsAPIArticle[];
  message?: string;
}

async function fetchCategoryHeadlines(category: string, key: string, limit: number): Promise<NewsHeadline[]> {
  const params = new URLSearchParams({
    country: "us",
    pageSize: String(Math.min(limit, 100)),
    apiKey: key,
  });
  if (category !== "general") params.set("category", category.toLowerCase());

  const res = await fetch(`https://newsapi.org/v2/top-headlines?${params}`);
  if (!res.ok) return [];

  const data = await res.json() as NewsAPIResponse;
  if (data.status !== "ok") return [];

  return (data.articles ?? [])
    .filter((a) => a.title && a.title !== "[Removed]")
    .slice(0, limit)
    .map((a) => ({
      title: a.title!,
      source: a.source?.name ?? "NewsAPI",
      url: a.url,
      category,
    }));
}

export async function fetchNewsHeadlines(limit = 5, categories?: string | string[]): Promise<NewsHeadline[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) throw new Error("NEWS_API_KEY is not configured");

  const cats: string[] = Array.isArray(categories)
    ? (categories.length > 0 ? categories : ["general"])
    : [categories ?? "general"];

  // Distribute limit evenly across categories; remainder goes to first
  const n = cats.length;
  const perSource = Math.floor(limit / n);
  const extra = limit % n;

  const batches = await Promise.all(
    cats.map((c, i) => fetchCategoryHeadlines(c, key, perSource + (i === 0 ? extra : 0)))
  );

  // Merge and deduplicate by title
  const seen = new Set<string>();
  const merged: NewsHeadline[] = [];
  for (const items of batches) {
    for (const item of items) {
      if (!seen.has(item.title)) {
        seen.add(item.title);
        merged.push(item);
      }
    }
  }
  return merged;
}
