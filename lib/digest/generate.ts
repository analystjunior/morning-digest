/**
 * lib/digest/generate.ts
 *
 * Core digest generation pipeline.
 * For each enabled section, fetches real data where available and shows a
 * "Coming soon" placeholder for sections not yet wired to a live source.
 */

import type { DigestSection, GeneratedDigest, GeneratedSection, GeneratedItem } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { fetchStocksData } from "./sections/stocks";
import { fetchCryptoData } from "./sections/crypto";
import { fetchSportsHeadlines } from "./sections/sports";
import { fetchWeatherData } from "./sections/weather";
import { fetchQuoteData } from "./sections/quote";
import { fetchNewsHeadlines } from "./sections/news";

// ── News ──────────────────────────────────────────────────────────────────────

async function buildNewsSection(section: DigestSection): Promise<GeneratedSection> {
  const limit = (section.config?.limit as number | undefined) ?? (section.mode === "brief" ? 3 : 5);
  const categories = (section.config?.categories as string[] | undefined)
    ?? [(section.config?.category as string | undefined) ?? "general"];
  const headlines = await fetchNewsHeadlines(limit, categories);

  const items: GeneratedItem[] = headlines.map((h) => ({
    text: h.title,
    source: h.source,
    url: h.url,
    group: categories.length > 1 ? (h.category ? h.category.charAt(0).toUpperCase() + h.category.slice(1) : undefined) : undefined,
  }));

  return {
    sectionId: section.id,
    title: section.title,
    emoji: "📰",
    items,
  };
}

// ── Sports ────────────────────────────────────────────────────────────────────

async function buildSportsSection(section: DigestSection): Promise<GeneratedSection> {
  const limit = (section.config?.limit as number | undefined) ?? (section.mode === "brief" ? 3 : 8);
  const leagues = (section.config?.leagues as string[] | undefined) ?? [];
  const headlines = await fetchSportsHeadlines(limit, leagues);

  const items: GeneratedItem[] = headlines.map((h) => ({
    text: h.title,
    source: "ESPN",
    url: h.link,
    group: leagues.length > 1 ? h.league : undefined,
  }));

  return {
    sectionId: section.id,
    title: section.title,
    emoji: "🏆",
    items,
  };
}

// ── Stocks ────────────────────────────────────────────────────────────────────

async function buildStocksSection(section: DigestSection): Promise<GeneratedSection> {
  const config = section.config ?? {};
  const tickers = (config.tickers as string[] | undefined) ?? ["SPY", "AAPL", "NVDA"];

  const results = await fetchStocksData(tickers);

  const items: GeneratedItem[] = results.map(({ ticker, price, changePct, url }) => ({
    text: `${ticker}  $${price}  ${changePct}`,
    source: "Yahoo Finance",
    url,
  }));

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
  const coins = (config.coins as string[] | undefined) ?? ["bitcoin", "ethereum", "solana"];

  const data = await fetchCryptoData(coins);

  const items: GeneratedItem[] = data.map((coin) => {
    const arrow = coin.change24h >= 0 ? "▲" : "▼";
    return {
      text: `${coin.name} (${coin.symbol})  $${coin.price.toLocaleString()}  ${arrow} ${Math.abs(coin.change24h).toFixed(2)}% (24h)`,
      source: "CoinGecko",
      url: coin.url,
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
  const tone = (section.config?.tone as string | undefined) ?? "any";
  try {
    const data = await fetchQuoteData(tone);
    return {
      sectionId: section.id,
      title: section.title,
      emoji: "💬",
      items: [{ text: `"${data.quote}" — ${data.author}`, source: "ZenQuotes" }],
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
        if (section.type === "news") {
          const result = await buildNewsSection(section);
          console.log(`[digest/generate] "${section.title}" (news) → real data (NewsAPI)`);
          return result;
        }

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
          console.log(`[digest/generate] "${section.title}" (quote) → real data (ZenQuotes)`);
          return result;
        }

        if (section.type === "finance") {
          const result = await buildStocksSection(section);
          console.log(`[digest/generate] "${section.title}" (finance) → real data (Alpha Vantage)`);
          return result;
        }

        if (section.type === "crypto") {
          const result = await buildCryptoSection(section);
          console.log(`[digest/generate] "${section.title}" (crypto) → real data (CoinGecko)`);
          return result;
        }

        // All other section types: show placeholder
        console.log(`[digest/generate] "${section.title}" (${section.type}) → coming soon`);
        return {
          sectionId: section.id,
          title: section.title,
          emoji: "📌",
          items: [{ text: "Coming soon" }],
        };
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

// ── HTML formatter ────────────────────────────────────────────────────────────

export function digestToHTML(digest: GeneratedDigest, userName: string): string {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const firstName = userName.split(" ")[0];

  const sectionsHTML = digest.sections
    .map((section, i) => {
      let currentGroup: string | undefined = undefined;
      const items = section.items
        .map((item, idx) => {
          let groupHeader = "";
          if (item.group && item.group !== currentGroup) {
            const isFirst = idx === 0;
            currentGroup = item.group;
            groupHeader = `<div style="margin:${isFirst ? "0" : "12px"} 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#111;">${item.group}</div>`;
          }
          const headline = item.url
            ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color:#1a1a1a;text-decoration:none;">${item.text}<span style="margin-left:4px;color:#bbb;font-size:11px;">↗</span></a>`
            : `<span style="color:#1a1a1a;">${item.text}</span>`;
          const bullet = `
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <div style="margin-top:6px;width:6px;height:6px;min-width:6px;border-radius:50%;background:#1a1a1a;flex-shrink:0;"></div>
            <div style="min-width:0;flex:1;">
              <p style="margin:0;font-size:14px;line-height:1.6;">${headline}</p>
              ${item.source ? `<p style="margin:4px 0 0;font-size:11px;color:#888;">${item.source}</p>` : ""}
            </div>
          </div>`;
          return groupHeader + bullet;
        })
        .join("\n");

      const sectionBlock = `
      <div style="margin-bottom:24px;">
        <div style="margin-bottom:12px;">
          <h2 style="margin:0;font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${section.title}</h2>
        </div>
        <div style="background:#f9f8f5;border:1px solid #eceae3;border-radius:8px;padding:16px;">
          ${items}
        </div>
      </div>`;

      const divider =
        i < digest.sections.length - 1
          ? `<hr style="border:none;border-top:1px solid #f0ede6;margin:0 0 24px;" />`
          : "";

      return sectionBlock + divider;
    })
    .join("\n");

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;">
  <div style="padding-bottom:24px;border-bottom:1px solid #f0ede6;margin-bottom:24px;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#1a1a1a;">The Paper Route</p>
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a1a;">Good morning, ${firstName} ☀️</h1>
    <p style="margin:0;font-size:13px;color:#888;">${date} · Your personalized briefing</p>
  </div>
  ${sectionsHTML}
  <div style="padding-top:20px;border-top:1px solid #f0ede6;text-align:center;">
    <p style="margin:0;font-size:10px;letter-spacing:0.1em;color:#bbb;">THE PAPER ROUTE</p>
  </div>
</div>`;
}
