export interface StockQuote {
  ticker: string;
  price: string;
  changePct: string;
  url: string;
}

interface AlphaVantageResponse {
  "Global Quote"?: {
    "01. symbol"?: string;
    "05. price"?: string;
    "10. change percent"?: string;
  };
  Note?: string;
}

async function fetchSingleQuote(symbol: string, key: string): Promise<StockQuote> {
  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
  const res = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${key}`
  );
  if (!res.ok) return { ticker: symbol, price: "N/A", changePct: "fetch error", url };

  const data = await res.json() as AlphaVantageResponse;
  const quote = data["Global Quote"];

  if (!quote || !quote["05. price"]) {
    return { ticker: symbol, price: "N/A", changePct: "data unavailable", url };
  }

  const price = parseFloat(quote["05. price"]).toFixed(2);
  const rawPct = quote["10. change percent"] ?? "";
  const pct = parseFloat(rawPct);
  const changePct = isNaN(pct)
    ? `Market closed — last close: $${price}`
    : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

  return { ticker: symbol, price, changePct, url };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchStocksData(tickers: string[]): Promise<StockQuote[]> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("ALPHA_VANTAGE_API_KEY is not configured");

  const symbols = tickers.length > 0 ? tickers : ["SPY"];
  const results: StockQuote[] = [];
  for (let i = 0; i < symbols.length; i++) {
    if (i > 0) await delay(1000);
    let quote = await fetchSingleQuote(symbols[i], key);
    if (quote.price === "N/A") {
      await delay(1000);
      quote = await fetchSingleQuote(symbols[i], key);
    }
    results.push(quote);
  }
  return results;
}
