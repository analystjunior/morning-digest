/**
 * AI Digest Generation Agent
 *
 * Fetches real data from existing lib functions, then calls the Anthropic API
 * (claude-sonnet-4-6 with web search) to produce a formatted HTML digest.
 *
 * Falls back to mock data if ANTHROPIC_API_KEY is not set or if the API call fails.
 */

import Anthropic from "@anthropic-ai/sdk";
import { DigestSection, GeneratedDigest } from "@/lib/types";
import { fetchWeatherData } from "@/lib/digest/sections/weather";
import { fetchSportsData } from "@/lib/digest/sections/sports";
import { fetchQuoteData } from "@/lib/digest/sections/quote";
import { fetchCryptoData } from "@/lib/digest/sections/crypto";
import { fetchStocksData } from "@/lib/digest/sections/stocks";
import type { StocksConfig } from "@/types";
import { generateMockDigest } from "@/lib/mock-data";

// ─── Mock → HTML fallback ─────────────────────────────────────────────────────

export function digestToHTML(digest: GeneratedDigest, userName: string): string {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const firstName = userName.split(" ")[0];

  const sectionsHTML = digest.sections
    .map((section, i) => {
      const items = section.items
        .map(
          (item) => `
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
            <div style="margin-top:6px;width:6px;height:6px;min-width:6px;border-radius:50%;background:#1a1a1a;flex-shrink:0;"></div>
            <div style="min-width:0;flex:1;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;">${item.text}</p>
              ${item.source ? `<p style="margin:4px 0 0;font-size:11px;color:#888;">${item.source}</p>` : ""}
            </div>
          </div>`
        )
        .join("\n");

      const sectionBlock = `
      <div style="margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="font-size:20px;">${section.emoji}</span>
          <h2 style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#888;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${section.title}</h2>
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

// ─── Per-section data fetching ────────────────────────────────────────────────

interface SectionDataResult {
  section: DigestSection;
  rawData?: string;
  error?: string;
}

async function gatherSectionData(section: DigestSection): Promise<SectionDataResult> {
  try {
    const config = section.config ?? {};

    // Weather
    if (section.type === "weather") {
      const city = (config.city as string) ?? "New York";
      const data = await fetchWeatherData(city);
      const forecastStr = data.forecast
        .map((d) => `${d.date}: ${d.conditions}, H:${d.high}°F L:${d.low}°F`)
        .join("; ");
      return {
        section,
        rawData: `Weather in ${data.city}: ${data.temperature}°F, ${data.conditions}. Today H:${data.todayHigh}°F L:${data.todayLow}°F, humidity ${data.humidity}%. 3-day forecast: ${forecastStr}`,
      };
    }

    // Sports
    if (section.type === "sports") {
      const leagues = (config.leagues as string[]) ?? ["NBA"];
      const teams = config.teams as string[] | undefined;
      const results = await fetchSportsData({ leagues, teams });
      const lines: string[] = [];
      for (const r of results) {
        if (r.error) {
          lines.push(`${r.league}: fetch error — ${r.error}`);
          continue;
        }
        for (const event of r.events) {
          const comps = event.competitions?.[0]?.competitors ?? [];
          if (comps.length >= 2) {
            const home = comps.find((c) => c.homeAway === "home") ?? comps[1];
            const away = comps.find((c) => c.homeAway === "away") ?? comps[0];
            const status = event.status?.type?.description ?? "Unknown";
            lines.push(
              `${r.league}: ${away.team.displayName} ${away.score ?? ""} @ ${home.team.displayName} ${home.score ?? ""} (${status})`
            );
          } else {
            lines.push(`${r.league}: ${event.name} — ${event.status?.type?.description ?? ""}`);
          }
        }
        if (r.events.length === 0) lines.push(`${r.league}: No games today`);
      }
      return { section, rawData: lines.join("\n") };
    }

    // Quote of the Day
    if (section.type === "quote") {
      const data = await fetchQuoteData();
      return { section, rawData: `"${data.quote}" — ${data.author}` };
    }

    // Finance: crypto
    if (section.type === "finance" && config.coins) {
      const coins = config.coins as string[];
      const data = await fetchCryptoData({ coins });
      const lines = Object.entries(data).map(([coin, prices]) => {
        const change = prices.usd_24h_change?.toFixed(2) ?? "0.00";
        const direction = prices.usd_24h_change >= 0 ? "+" : "";
        return `${coin}: $${prices.usd.toLocaleString()} (${direction}${change}% 24h)`;
      });
      return { section, rawData: lines.join("\n") };
    }

    // Finance: stocks
    if (section.type === "finance" && config.tickers) {
      const tickers = config.tickers as string[];
      const results = await fetchStocksData({ tickers } as StocksConfig);
      const lines = results.map((r) => {
        if (!r.quote || r.error) return `${r.ticker}: data unavailable`;
        const q = r.quote;
        return `${r.ticker}: $${parseFloat(q["05. price"]).toFixed(2)} (${q["10. change percent"]} today)`;
      });
      return { section, rawData: lines.join("\n") };
    }

    // news, technology, entertainment, custom, social — Claude will web-search
    return { section };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[agent] Failed to fetch data for "${section.title}":`, message);
    return { section, error: message };
  }
}

// ─── Anthropic call with web-search tool loop ─────────────────────────────────

type MessageParam = Anthropic.Messages.MessageParam;

/**
 * Calls claude-sonnet-4-6 with the web_search_20260209 tool and runs the
 * required multi-turn loop until stop_reason is "end_turn".
 *
 * Flow per turn:
 *   1. Call the API.
 *   2. Collect any text blocks from this response (streamed partial answers
 *      may appear before or after tool_use blocks).
 *   3. If stop_reason is "tool_use":
 *      a. Append the full assistant content (which already contains the
 *         web_search_tool_result blocks Anthropic filled in alongside the
 *         tool_use blocks) as the next "assistant" message.
 *      b. Append a "user" message with tool_result blocks referencing each
 *         tool_use id — this signals the model to continue writing.
 *      c. Loop.
 *   4. When stop_reason is "end_turn", return all accumulated text.
 */
async function callWithWebSearch(
  client: Anthropic,
  params: {
    system: string;
    messages: MessageParam[];
    maxTokens: number;
  }
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }];

  let messages: MessageParam[] = [...params.messages];
  let turn = 0;
  const MAX_TURNS = 12;
  let accumulatedText = "";

  while (turn < MAX_TURNS) {
    turn++;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: params.maxTokens,
      system: params.system,
      tools,
      messages,
    });

    // Collect text blocks from this turn (final answer may arrive here)
    const textFromThisTurn = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    accumulatedText += textFromThisTurn;

    console.log(
      `[agent] Turn ${turn}: stop_reason=${response.stop_reason}` +
      ` | blocks=[${response.content.map((b) => b.type).join(", ")}]` +
      (textFromThisTurn ? ` | text_len=${textFromThisTurn.length}` : "")
    );

    // Done — no more tool calls
    if (response.stop_reason !== "tool_use") break;

    // Extract the tool_use blocks the model requested
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );

    if (toolUseBlocks.length === 0) break;

    console.log(
      `[agent] Web searches requested: ${toolUseBlocks.map((b) => JSON.stringify(b.input)).join(", ")}`
    );

    // Append the full assistant turn. The response.content already contains
    // the web_search_tool_result blocks that Anthropic populated server-side,
    // so passing the whole content array gives the model its search results.
    messages = [
      ...messages,
      { role: "assistant", content: response.content },
      // tool_result blocks tell the model which searches were handled so it
      // can proceed to write the final answer.
      {
        role: "user",
        content: toolUseBlocks.map((tu) => ({
          type: "tool_result" as const,
          tool_use_id: tu.id,
          content: [{ type: "text" as const, text: "Search completed." }],
        })),
      },
    ];
  }

  console.log(`[agent] Tool loop finished after ${turn} turn(s)`);

  return accumulatedText
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateDigestHTML(
  sections: DigestSection[],
  userName: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[agent] ANTHROPIC_API_KEY not set — using mock digest");
    const today = new Date().toISOString().split("T")[0];
    return digestToHTML(generateMockDigest(sections, today), userName);
  }

  const enabledSections = sections.filter((s) => s.enabled);
  if (enabledSections.length === 0) {
    return `<div style="font-family:-apple-system,sans-serif;color:#888;text-align:center;padding:40px;">No sections enabled.</div>`;
  }

  // Gather pre-fetched data for structured sections in parallel
  const gathered = await Promise.allSettled(enabledSections.map(gatherSectionData));

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const firstName = userName.split(" ")[0];

  // Build per-section context for the prompt
  const NEWS_TYPES = new Set(["news", "technology", "entertainment", "social"]);

  const sectionInstructions = gathered
    .map((result, i) => {
      const section = enabledSections[i];
      const bulletCount = section.mode === "brief" ? "2-3" : "4-6";

      if (result.status === "rejected") {
        return `## ${section.title} (${section.type})\nData fetch failed. Use web search as needed.\nTask: ${section.prompt ?? `Provide ${bulletCount} items for ${section.title}`}`;
      }

      const { rawData, error } = result.value;

      if (rawData) {
        return `## ${section.title} (${section.type})\nPre-fetched live data:\n${rawData}\nWrite ${bulletCount} crisp bullet points based on this data.\nUser note: ${section.prompt ?? ""}`;
      }

      // No pre-fetched data — Claude needs to research this section
      const errNote = error ? `(Data fetch failed: ${error}) ` : "";
      const sourcesNote = section.sources?.length
        ? `\nPreferred sources: ${section.sources.join(", ")}`
        : "";

      if (section.type === "custom") {
        // Custom section: the user wrote specific instructions — execute them literally.
        const task = section.prompt?.trim()
          ?? `Provide ${bulletCount} interesting items about ${section.title}`;
        return `## ${section.title} (custom)\n${errNote}Research and write the following for the user, using web search as needed:\n${task}${sourcesNote}`;
      }

      if (NEWS_TYPES.has(section.type)) {
        // News-style section: search for the most current headlines matching
        // the user's topic focus.
        const focus = section.prompt?.trim() ?? section.title;
        return `## ${section.title} (${section.type})\n${errNote}Search the web for the ${bulletCount} most recent, newsworthy items on this topic and write them up:\n${focus}${sourcesNote}`;
      }

      // Any other section type: use the user's prompt as a direct task
      const task = section.prompt?.trim() ?? `Provide ${bulletCount} items about ${section.title}`;
      return `## ${section.title} (${section.type})\n${errNote}Research and write the following, using web search as needed:\n${task}${sourcesNote}`;
    })
    .join("\n\n---\n\n");

  const systemPrompt = `You are The Paper Route, a personal morning digest assistant writing for ${firstName}. Today is ${date}.

Write a morning briefing as clean HTML with inline styles only — no <style> tags, no class names.

HTML structure rules (follow exactly):
- Single root <div> with font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif
- Header block: "The Paper Route" label (font-size:13px, font-weight:600) + h1 greeting "Good morning, ${firstName} ☀️" (font-size:22px, font-weight:700, color:#1a1a1a) + date subline (font-size:13px, color:#888) + border-bottom:1px solid #f0ede6 + margin-bottom:24px
- Each section: flex row with emoji (font-size:20px) + uppercase title (font-size:11px, font-weight:700, letter-spacing:0.12em, color:#888), then a content card
- Content card: background:#f9f8f5; border:1px solid #eceae3; border-radius:8px; padding:16px
- Each bullet: flex row, 6×6px circle (background:#1a1a1a, border-radius:50%, margin-top:6px, flex-shrink:0) + text div (font-size:14px, line-height:1.6, color:#1a1a1a)
- Source label below bullet text: font-size:11px, color:#888
- <hr style="border:none;border-top:1px solid #f0ede6;margin:0 0 24px;"> between sections
- Footer: "THE PAPER ROUTE" centered, font-size:10px, letter-spacing:0.1em, color:#bbb, border-top:1px solid #f0ede6, padding-top:20px

Writing style: direct and concise. One sentence per bullet, two max. Skip openers like "In today's news..." — just the fact.
Output: HTML fragment only, no markdown fences, no <html>/<head>/<body> tags.`;

  const userPrompt = `Write ${firstName}'s morning digest. Sections below — use web search for any section marked as needing research.

${sectionInstructions}

Output the complete digest as a single HTML fragment starting with the root <div>.`;

  try {
    const client = new Anthropic({ apiKey });
    const html = await callWithWebSearch(client, {
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4096,
    });

    if (!html) {
      console.warn("[agent] Claude returned empty response — using mock digest");
      const today = new Date().toISOString().split("T")[0];
      return digestToHTML(generateMockDigest(sections, today), userName);
    }

    return html;
  } catch (err) {
    console.warn("[agent] Anthropic API call failed, using mock digest:", err instanceof Error ? err.message : err);
    const today = new Date().toISOString().split("T")[0];
    return digestToHTML(generateMockDigest(sections, today), userName);
  }
}
