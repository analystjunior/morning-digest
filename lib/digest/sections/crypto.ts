export interface CoinData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  url: string;
}

interface CoinGeckoMarket {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export async function fetchCryptoData(coins: string[]): Promise<CoinData[]> {
  const ids = coins.map((c) => encodeURIComponent(c.toLowerCase())).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=25&page=1`
  );
  if (!res.ok) throw new Error(`CoinGecko fetch failed: HTTP ${res.status}`);
  const data = await res.json() as CoinGeckoMarket[];
  return data.map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price,
    change24h: coin.price_change_percentage_24h,
    url: `https://www.coingecko.com/en/coins/${coin.id}`,
  }));
}
