export interface QuoteData {
  quote: string;
  author: string;
}

const FALLBACK_QUOTES: Array<{ q: string; a: string }> = [
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius" },
  { q: "Life is what happens when you're busy making other plans.", a: "John Lennon" },
  { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
  { q: "In the middle of every difficulty lies opportunity.", a: "Albert Einstein" },
  { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
  { q: "Ask not what your country can do for you — ask what you can do for your country.", a: "John F. Kennedy" },
  { q: "I have not failed. I've just found 10,000 ways that won't work.", a: "Thomas Edison" },
  { q: "Be the change you wish to see in the world.", a: "Mahatma Gandhi" },
  { q: "The unexamined life is not worth living.", a: "Socrates" },
  { q: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", a: "Albert Einstein" },
  { q: "Well-behaved women seldom make history.", a: "Laurel Thatcher Ulrich" },
];

function pickFallback(): QuoteData {
  const pick = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  return { quote: pick.q, author: pick.a };
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

export async function fetchQuoteData(): Promise<QuoteData> {
  try {
    const r = await fetchWithTimeout("https://zenquotes.io/api/random", 4000);
    if (!r.ok) return pickFallback();

    const data = (await r.json()) as Array<{ q: string; a: string }>;
    const item = data[0];
    if (!item?.q || !item?.a) return pickFallback();

    return { quote: item.q, author: item.a };
  } catch {
    return pickFallback();
  }
}
