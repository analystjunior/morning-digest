/**
 * lib/digest/generate.ts
 *
 * Core digest generation pipeline.
 * For each enabled section, fetches real data where available and falls back
 * to mock content for sections not yet wired to a live source.
 */

import type { DigestSection, GeneratedDigest, GeneratedSection, GeneratedItem } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { generateMockDigest } from "@/lib/mock-data";
import { fetchStocksData } from "./sections/stocks";
import { fetchCryptoData } from "./sections/crypto";
import { fetchSportsData } from "./sections/sports";

// ── Sports ────────────────────────────────────────────────────────────────────

async function buildSportsSection(section: DigestSection): Promise<GeneratedSection> {
  const config = section.config ?? {};
  const leagues = (config.leagues as string[] | undefined) ?? ["NBA"];
  const teams = config.teams as string[] | undefined;

  const results = await fetchSportsData({ leagues, teams });

  const items: GeneratedItem[] = results.flatMap(({ league, events, error }) => {
    if (error) return [{ text: `${league}: ${error}` }];
    if (!events.length) return [{ text: `${league}: No games scheduled` }];
    return events.map((event) => ({
      text: [
        event.shortName ?? event.name,
        event.status?.type?.description,
      ]
        .filter(Boolean)
        .join(" — "),
      source: "ESPN",
    }));
  });

  const limit = section.mode === "brief" ? 3 : items.length;
  return {
    sectionId: section.id,
    title: section.title,
    emoji: "🏆",
    items: items.slice(0, limit),
  };
}

// ── Stocks ────────────────────────────────────────────────────────────────────

async function buildStocksSection(section: DigestSection): Promise<GeneratedSection> {
  const config = section.config ?? {};
  const tickers = (config.tickers as string[] | undefined) ?? [];

  const results = await fetchStocksData({ tickers });

  const items: GeneratedItem[] = results.map(({ ticker, quote, error }) => {
    if (error || !quote) {
      return { text: `${ticker}: data unavailable`, source: "Alpha Vantage" };
    }
    const price = parseFloat(quote["05. price"]).toFixed(2);
    const change = parseFloat(quote["09. change"]);
    const changePct = quote["10. change percent"];
    const arrow = change >= 0 ? "▲" : "▼";
    return {
      text: `${ticker}  $${price}  ${arrow} ${changePct}`,
      source: "Alpha Vantage",
    };
  });

  return {
    sectionId: section.id,
    title: section.title,
    emoji: "📈",
    items,
  };
}

// ── Crypto ────────────────────────────────────────────────────────────────────

async function buildCryptoSection(section: DigestSection): Promise<GeneratedSection> {
  const config = section.config ?? {};
  const coins = (config.coins as string[] | undefined) ?? ["bitcoin", "ethereum"];

  const data = await fetchCryptoData({ coins });

  const items: GeneratedItem[] = Object.entries(data).map(([coin, price]) => {
    const change = price.usd_24h_change;
    const arrow = change >= 0 ? "▲" : "▼";
    const label = coin.charAt(0).toUpperCase() + coin.slice(1);
    return {
      text: `${label}  $${price.usd.toLocaleString()}  ${arrow} ${Math.abs(change).toFixed(2)}% (24h)`,
      source: "CoinGecko",
    };
  });

  return {
    sectionId: section.id,
    title: section.title,
    emoji: "🪙",
    items,
  };
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function generateDigest(
  sections: DigestSection[],
  date: string
): Promise<GeneratedDigest> {
  const enabled = sections.filter((s) => s.enabled);

  const generatedSections = await Promise.all(
    enabled.map(async (section): Promise<GeneratedSection> => {
      try {
        if (section.type === "sports") {
          return await buildSportsSection(section);
        }

        if (section.type === "finance") {
          const config = section.config ?? {};
          if (config.tickers) return await buildStocksSection(section);
          if (config.coins) return await buildCryptoSection(section);
          // No structured config — fall through to mock
        }

        // All other section types: use mock until their fetchers are built
        const mock = generateMockDigest([section], date);
        return (
          mock.sections[0] ?? {
            sectionId: section.id,
            title: section.title,
            emoji: "📌",
            items: [{ text: `${section.title} — content coming soon` }],
          }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          sectionId: section.id,
          title: section.title,
          emoji: "⚠️",
          items: [{ text: `Failed to load ${section.title}: ${message}` }],
        };
      }
    })
  );

  return {
    id: generateId(),
    subscriptionId: "live",
    userId: "live",
    date,
    sections: generatedSections,
    generatedAt: new Date().toISOString(),
    status: "pending",
    channels: [],
  };
}
