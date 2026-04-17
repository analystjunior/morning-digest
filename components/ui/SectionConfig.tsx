"use client";

import { useState, useEffect } from "react";
import { DigestSection } from "@/lib/types";

// ─── Brand constants (shared across onboarding + dashboard) ──────────────────
const BG       = "#E8E6DF";
const DARK     = "#1a1a1a";
const BORDER   = "#d4d0c8";
const SECONDARY = "#555";
const CARD_BG  = "white";

const inputStyle: React.CSSProperties = {
  backgroundColor: CARD_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: "4px",
  color: DARK,
  width: "100%",
  padding: "10px 12px",
  fontSize: "14px",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: SECONDARY,
  marginBottom: "6px",
};

const hintStyle: React.CSSProperties = {
  marginTop: "6px",
  fontSize: "11px",
  color: "#bbb",
};

const pillBase: React.CSSProperties = {
  borderRadius: "4px",
  padding: "4px 10px",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid",
  transition: "all 0.1s",
};

// ─── TickerInput ──────────────────────────────────────────────────────────────

export function TickerInput({
  tickers,
  onChange,
}: {
  tickers: string[];
  onChange: (t: string[]) => void;
}) {
  const [raw, setRaw] = useState(tickers.join(", "));

  useEffect(() => {
    setRaw(tickers.join(", "));
  }, [tickers.join(",")]);  // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (val: string) => {
    const parsed = val
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 3);
    onChange(parsed);
    setRaw(parsed.join(", "));
  };

  return (
    <div>
      <label style={labelStyle}>
        Ticker symbols{" "}
        <span style={{ color: "#bbb", fontWeight: 400 }}>(up to 3)</span>
      </label>
      <input
        style={inputStyle}
        className="rounded"
        placeholder="SPY, AAPL, NVDA"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
      />
      <p style={hintStyle}>Separate with commas — e.g. SPY, AAPL, NVDA</p>
    </div>
  );
}

// ─── SectionConfig ────────────────────────────────────────────────────────────

export function SectionConfig({
  section,
  onUpdate,
}: {
  section: DigestSection;
  onUpdate: (s: DigestSection) => void;
}) {
  const config = section.config ?? {};
  const set = (updates: Record<string, unknown>) =>
    onUpdate({ ...section, config: { ...config, ...updates } });

  // ── Weather ────────────────────────────────────────────────────────────────
  if (section.type === "weather") {
    return (
      <div>
        <label style={labelStyle}>City</label>
        <input
          style={inputStyle}
          className="rounded"
          placeholder="New York"
          value={(config.city as string | undefined) ?? ""}
          onChange={(e) => set({ city: e.target.value })}
        />
      </div>
    );
  }

  // ── Sports ─────────────────────────────────────────────────────────────────
  if (section.type === "sports") {
    const selected = (config.leagues as string[] | undefined) ?? [];
    const LEAGUES = ["NFL", "NBA", "MLB", "NHL", "MLS", "College Football", "College Basketball"];
    const toggle = (l: string) =>
      set({
        leagues: selected.includes(l)
          ? selected.filter((x) => x !== l)
          : [...selected, l],
      });
    return (
      <div>
        <label style={labelStyle}>Leagues</label>
        <div className="flex flex-wrap gap-1.5">
          {LEAGUES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => toggle(l)}
              style={{
                ...pillBase,
                backgroundColor: selected.includes(l) ? DARK : CARD_BG,
                color: selected.includes(l) ? BG : SECONDARY,
                borderColor: selected.includes(l) ? DARK : BORDER,
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <p style={hintStyle}>
          Select any — defaults to top ESPN headlines if none chosen
        </p>
      </div>
    );
  }

  // ── News ───────────────────────────────────────────────────────────────────
  if (section.type === "news") {
    const selected = (config.category as string | undefined) ?? "general";
    const CATS = ["General", "Business", "Technology", "Sports", "Entertainment", "Health", "Science"];
    return (
      <div>
        <label style={labelStyle}>Category</label>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set({ category: c.toLowerCase() })}
              style={{
                ...pillBase,
                backgroundColor: selected === c.toLowerCase() ? DARK : CARD_BG,
                color: selected === c.toLowerCase() ? BG : SECONDARY,
                borderColor: selected === c.toLowerCase() ? DARK : BORDER,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Finance ────────────────────────────────────────────────────────────────
  if (section.type === "finance") {
    const tickers = (config.tickers as string[] | undefined) ?? ["SPY", "AAPL", "NVDA"];
    return (
      <TickerInput tickers={tickers} onChange={(t) => set({ tickers: t })} />
    );
  }

  // ── Quote ──────────────────────────────────────────────────────────────────
  if (section.type === "quote") {
    const selected = (config.tone as string | undefined) ?? "any";
    const TONES = ["Any", "Motivational", "Funny", "Philosophical", "Historical"];
    return (
      <div>
        <label style={labelStyle}>Tone</label>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set({ tone: t.toLowerCase() })}
              style={{
                ...pillBase,
                backgroundColor: selected === t.toLowerCase() ? DARK : CARD_BG,
                color: selected === t.toLowerCase() ? BG : SECONDARY,
                borderColor: selected === t.toLowerCase() ? DARK : BORDER,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Custom ─────────────────────────────────────────────────────────────────
  if (section.type === "custom") {
    return (
      <div>
        <label style={labelStyle}>Instructions</label>
        <textarea
          className="w-full rounded resize-none"
          rows={3}
          style={{ ...inputStyle, height: "auto" }}
          placeholder="What should this section cover? e.g. A daily Stoic quote and one habit tip"
          value={section.prompt ?? ""}
          onChange={(e) => onUpdate({ ...section, prompt: e.target.value })}
        />
      </div>
    );
  }

  return null;
}
