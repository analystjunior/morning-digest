export interface NewsHeadline {
  title: string;
  source: string;
}

interface NewsAPIArticle {
  title?: string;
  source?: { name?: string };
}

interface NewsAPIResponse {
  status: string;
  articles?: NewsAPIArticle[];
  message?: string;
}

export async function fetchNewsHeadlines(limit = 5, category?: string): Promise<NewsHeadline[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) throw new Error("NEWS_API_KEY is not configured");

  const params = new URLSearchParams({
    country: "us",
    pageSize: String(limit),
    apiKey: key,
  });
  if (category && category !== "general") params.set("category", category.toLowerCase());

  const res = await fetch(`https://newsapi.org/v2/top-headlines?${params}`);
  if (!res.ok) throw new Error(`NewsAPI fetch failed: HTTP ${res.status}`);

  const data = await res.json() as NewsAPIResponse;
  if (data.status !== "ok") throw new Error(data.message ?? "NewsAPI error");

  return (data.articles ?? [])
    .filter((a) => a.title && a.title !== "[Removed]")
    .slice(0, limit)
    .map((a) => ({
      title: a.title!,
      source: a.source?.name ?? "NewsAPI",
    }));
}
