export interface CryptoConfig {
  coins: string[]; // CoinGecko slugs, e.g. ["bitcoin", "ethereum", "solana"]
}

export interface CoinPrice {
  usd: number;
  usd_24h_change: number;
}

export type CryptoData = Record<string, CoinPrice>;

export async function fetchCryptoData(config: CryptoConfig): Promise<CryptoData> {
  const ids = config.coins.map((c) => encodeURIComponent(c)).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`Crypto fetch failed: HTTP ${res.status}`);
  return res.json() as Promise<CryptoData>;
}
