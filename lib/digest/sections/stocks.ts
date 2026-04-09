import type { StocksConfig } from "@/types";

export interface GlobalQuote {
  "01. symbol": string;
  "02. open": string;
  "03. high": string;
  "04. low": string;
  "05. price": string;
  "06. volume": string;
  "07. latest trading day": string;
  "08. previous close": string;
  "09. change": string;
  "10. change percent": string;
}

export interface StockQuoteResult {
  ticker: string;
  quote: GlobalQuote | null;
  error?: string;
}

export async function fetchStocksData(config: StocksConfig): Promise<StockQuoteResult[]> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("ALPHA_VANTAGE_API_KEY is not configured");

  const results = await Promise.all(
    config.tickers.map(async (ticker): Promise<StockQuoteResult> => {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${key}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { "Global Quote": GlobalQuote };
        const quote = data["Global Quote"];
        if (!quote || !quote["01. symbol"]) throw new Error("Empty response from Alpha Vantage");
        return { ticker, quote };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ticker, quote: null, error: message };
      }
    })
  );

  return results;
}
