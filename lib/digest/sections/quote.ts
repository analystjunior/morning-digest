export interface QuoteData {
  quote: string;
  author: string;
  tone?: string;
}

// Keyword sets for tone scoring
const TONE_KEYWORDS: Record<string, string[]> = {
  motivational: ["success", "achieve", "dream", "goal", "courage", "strength", "believe", "persist", "effort", "win", "action", "never", "greatness", "work", "possible", "rise", "overcome", "determination"],
  funny:        ["laugh", "humor", "smile", "joy", "fun", "wit", "happy", "fool", "silly", "mistake", "problem", "coffee", "money", "age", "trouble", "wrong"],
  philosophical: ["life", "truth", "wisdom", "mind", "soul", "meaning", "reality", "knowledge", "think", "exist", "nature", "time", "change", "world", "understand", "question", "death", "beauty"],
  historical:   ["freedom", "nation", "democracy", "war", "peace", "history", "people", "government", "justice", "liberty", "power", "duty", "honor", "country", "rights"],
};

function scoreQuote(text: string, tone: string): number {
  const keywords = TONE_KEYWORDS[tone];
  if (!keywords) return 0;
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => score + (lower.includes(kw) ? 1 : 0), 0);
}

export async function fetchQuoteData(tone = "any"): Promise<QuoteData> {
  // Fetch 5 quotes in parallel and pick the best match for the requested tone
  const fetches = Array.from({ length: 5 }, () =>
    fetch("https://zenquotes.io/api/random")
      .then((r) => r.ok ? r.json() as Promise<Array<{ q: string; a: string }>> : Promise.resolve([]))
      .catch(() => [] as Array<{ q: string; a: string }>)
  );

  const results = await Promise.all(fetches);
  const candidates = results
    .map((data) => data[0])
    .filter((item): item is { q: string; a: string } => !!item?.q && !!item?.a);

  if (candidates.length === 0) throw new Error("ZenQuotes returned no results");

  let chosen = candidates[0];

  if (tone !== "any") {
    let best = -1;
    for (const candidate of candidates) {
      const score = scoreQuote(candidate.q, tone);
      if (score > best) {
        best = score;
        chosen = candidate;
      }
    }
  }

  return { quote: chosen.q, author: chosen.a, tone };
}
