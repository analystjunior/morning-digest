export interface StockQuote {
  ticker: string;
  price: string;
  changePct: string;
}

interface AlphaVantageResponse {
  "Global Quote"?: {
    "01. symbol"?: string;
    "05. price"?: string;
    "10. change percent"?: string;
  };
  Note?: string;
}

export async function fetchStocksData(tickers: string[]): Promise<StockQuote[]> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("ALPHA_VANTAGE_API_KEY is not configured");

  const res = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${key}`
  );
  if (!res.ok) throw new Error(`Alpha Vantage fetch failed: HTTP ${res.status}`);

  const data = await res.json() as AlphaVantageResponse;
  const quote = data["Global Quote"];

  if (!quote || !quote["05. price"]) {
    return [{ ticker: "SPY", price: "N/A", changePct: "Market data unavailable" }];
  }

  const price = parseFloat(quote["05. price"]).toFixed(2);
  const rawPct = quote["10. change percent"] ?? "0%";
  const pct = parseFloat(rawPct);
  const changePct = isNaN(pct)
    ? `Market closed — last close: $${price}`
    : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

  return [{ ticker: "SPY", price, changePct }];
}
