export interface QuoteData {
  quote: string;
  author: string;
}

export async function fetchQuoteData(): Promise<QuoteData> {
  const res = await fetch("https://zenquotes.io/api/random");
  if (!res.ok) throw new Error(`ZenQuotes fetch failed: HTTP ${res.status}`);

  const data = await res.json() as Array<{ q: string; a: string }>;
  const item = data[0];
  if (!item?.q || !item?.a) throw new Error("ZenQuotes response missing fields");

  return { quote: item.q, author: item.a };
}
