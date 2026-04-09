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
import { fetchWeatherData } from "./sections/weather";
import { fetchQuoteData } from "./sections/quote";

// ── Sports ────────────────────────────────────────────────────────────────────

async function buildSportsSection(section: DigestSection): Promise<GeneratedSection> {
  const config = section.config ?? {};
  const leagues = (config.leagues as string[] | undefined) ?? ["NBA"];
  const teams = config.teams as string[] | undefined;

  const results = await fetchSportsData({ leagues, teams });

  const items: GeneratedItem[] = results.flatMap(({ league, events, error }) => {
    if (error) return [{ text: `${league}: ${error}` }];
    if (!events.length) return [{ text: `${league}: No games scheduled` }];
    return events.map((event) => {
      const competitors = event.competitions?.[0]?.competitors ?? [];
      const away = competitors.find((c) => c.homeAway === "away") ?? competitors[1];
      const home = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
      const status = event.status?.type?.description ?? "";
      const isFinal = status.toLowerCase().includes("final");
      const isInProgress = status.toLowerCase().includes("in progress") || /^\d/.test(status);

      if (away && home) {
        const awayName = away.team.displayName;
        const homeName = home.team.displayName;

        if ((isFinal || isInProgress) && away.score && home.score) {
          // "Atlanta Hawks 108, Cleveland Cavaliers 115 — Final"
          return {
            text: `${awayName} ${away.score}, ${homeName} ${home.score} — ${status}`,
            source: "ESPN",
          };
        }
        // Scheduled: "Atlanta Hawks vs. Cleveland Cavaliers — Scheduled"
        return {
          text: `${awayName} vs. ${homeName}${status ? ` — ${status}` : ""}`,
          source: "ESPN",
        };
      }

      // Fallback if competitors data is missing
      return {
        text: `${event.name}${status ? ` — ${status}` : ""}`,
        source: "ESPN",
      };
    });
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

// ── Weather ───────────────────────────────────────────────────────────────────

async function buildWeatherSection(section: DigestSection): Promise<GeneratedSection> {
  const city = (section.config?.city as string | undefined) ?? "New York";
  const data = await fetchWeatherData(city);

  const items: GeneratedItem[] = [
    {
      text: `${data.city}: ${data.temperature}°F, ${data.conditions} (H ${data.todayHigh}° / L ${data.todayLow}°, ${data.humidity}% humidity)`,
      source: "OpenWeatherMap",
    },
    ...data.forecast.map((day) => ({
      text: `${day.date}: ${day.conditions}, H ${day.high}° / L ${day.low}°`,
      source: "OpenWeatherMap",
    })),
  ];

  const limit = section.mode === "brief" ? 2 : items.length;
  return {
    sectionId: section.id,
    title: section.title,
    emoji: "🌤️",
    items: items.slice(0, limit),
  };
}

// ── Quote ─────────────────────────────────────────────────────────────────────

async function buildQuoteSection(section: DigestSection): Promise<GeneratedSection> {
  try {
    const data = await fetchQuoteData();
    return {
      sectionId: section.id,
      title: section.title,
      emoji: "💬",
      items: [{ text: `"${data.quote}" — ${data.author}`, source: "Gemini" }],
    };
  } catch (err) {
    console.error("[digest/generate] Quote fetch failed:", err);
    return {
      sectionId: section.id,
      title: section.title,
      emoji: "💬",
      items: [{ text: "Quote unavailable today — check back tomorrow" }],
    };
  }
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
          const result = await buildSportsSection(section);
          console.log(`[digest/generate] "${section.title}" (sports) → real data (ESPN)`);
          return result;
        }

        if (section.type === "weather") {
          const city = (section.config?.city as string | undefined) ?? "New York";
          const result = await buildWeatherSection(section);
          console.log(`[digest/generate] "${section.title}" (weather) → real data (OpenWeatherMap, city: ${city})`);
          return result;
        }

        if (section.type === "quote") {
          const result = await buildQuoteSection(section);
          console.log(`[digest/generate] "${section.title}" (quote) → real data (Gemini)`);
          return result;
        }

        if (section.type === "finance") {
          const config = section.config ?? {};
          if (config.tickers) {
            const result = await buildStocksSection(section);
            console.log(`[digest/generate] "${section.title}" (finance/stocks) → real data (Alpha Vantage)`);
            return result;
          }
          if (config.coins) {
            const result = await buildCryptoSection(section);
            console.log(`[digest/generate] "${section.title}" (finance/crypto) → real data (CoinGecko)`);
            return result;
          }
          // No structured config — fall through to mock
        }

        // All other section types: use mock until their fetchers are built
        const mock = generateMockDigest([section], date);
        console.log(`[digest/generate] "${section.title}" (${section.type}) → mock data`);
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
        console.log(`[digest/generate] "${section.title}" (${section.type}) → error: ${message}`);
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
