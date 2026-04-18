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

const FALLBACK_QUOTES: Array<{ q: string; a: string; tones: string[] }> = [
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain", tones: ["motivational"] },
  { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius", tones: ["motivational"] },
  { q: "Life is what happens when you're busy making other plans.", a: "John Lennon", tones: ["philosophical"] },
  { q: "The only way to do great work is to love what you do.", a: "Steve Jobs", tones: ["motivational"] },
  { q: "In the middle of every difficulty lies opportunity.", a: "Albert Einstein", tones: ["motivational", "philosophical"] },
  { q: "It always seems impossible until it's done.", a: "Nelson Mandela", tones: ["motivational", "historical"] },
  { q: "Ask not what your country can do for you — ask what you can do for your country.", a: "John F. Kennedy", tones: ["historical"] },
  { q: "I have not failed. I've just found 10,000 ways that won't work.", a: "Thomas Edison", tones: ["motivational", "funny"] },
  { q: "Be the change you wish to see in the world.", a: "Mahatma Gandhi", tones: ["philosophical", "historical"] },
  { q: "The unexamined life is not worth living.", a: "Socrates", tones: ["philosophical"] },
  { q: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", a: "Albert Einstein", tones: ["funny", "philosophical"] },
  { q: "Well-behaved women seldom make history.", a: "Laurel Thatcher Ulrich", tones: ["historical", "motivational"] },
];

function pickFallback(tone: string): QuoteData {
  const pool = tone === "any"
    ? FALLBACK_QUOTES
    : FALLBACK_QUOTES.filter((q) => q.tones.includes(tone));
  const source = pool.length > 0 ? pool : FALLBACK_QUOTES;
  const pick = source[Math.floor(Math.random() * source.length)];
  return { quote: pick.q, author: pick.a, tone };
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchQuoteData(tone = "any"): Promise<QuoteData> {
  try {
    const r = await fetchWithTimeout("https://zenquotes.io/api/random", 4000);
    if (!r.ok) return pickFallback(tone);

    const data = (await r.json()) as Array<{ q: string; a: string }>;
    const item = data[0];
    if (!item?.q || !item?.a) return pickFallback(tone);

    if (tone === "any") return { quote: item.q, author: item.a, tone };

    // If tone-matching is requested, score the single result; fall back to
    // the hardcoded pool if it scores 0 (no relevant keywords).
    if (scoreQuote(item.q, tone) > 0) return { quote: item.q, author: item.a, tone };
    return pickFallback(tone);
  } catch {
    return pickFallback(tone);
  }
}
