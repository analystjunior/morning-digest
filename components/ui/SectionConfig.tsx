"use client";

import { useState } from "react";
import { DigestSection } from "@/lib/types";

// ─── Brand constants ──────────────────────────────────────────────────────────
const BG        = "#E8E6DF";
const DARK      = "#1a1a1a";
const BORDER    = "#d4d0c8";
const SECONDARY = "#555";
const CARD_BG   = "white";

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

// ─── TogglePill — a preset option that can be selected/deselected ─────────────
function TogglePill({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        ...pillBase,
        backgroundColor: selected ? DARK : CARD_BG,
        color: selected ? BG : SECONDARY,
        borderColor: selected ? DARK : BORDER,
      }}
    >
      {label}
    </button>
  );
}

// ─── SelectedPill — a confirmed item with an ✕ remove button ─────────────────
function SelectedPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div
      style={{
        ...pillBase,
        backgroundColor: DARK,
        color: BG,
        borderColor: DARK,
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        cursor: "default",
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        style={{
          fontSize: "10px",
          color: "#aaa",
          cursor: "pointer",
          border: "none",
          background: "none",
          padding: 0,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── TickerPicker ─────────────────────────────────────────────────────────────
const PRESET_TICKERS = ["SPY", "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "NFLX", "AMD", "SOFI", "PLTR"];

function TickerPicker({
  tickers,
  onChange,
}: {
  tickers: string[];
  onChange: (t: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  const toggle = (ticker: string) => {
    onChange(
      tickers.includes(ticker)
        ? tickers.filter((t) => t !== ticker)
        : [...tickers, ticker]
    );
  };

  const addCustom = () => {
    const t = custom.trim().toUpperCase();
    if (t && !tickers.includes(t)) {
      onChange([...tickers, t]);
    }
    setCustom("");
  };

  // Custom tickers = selected tickers not in presets
  const customTickers = tickers.filter((t) => !PRESET_TICKERS.includes(t));

  return (
    <div>
      <label style={labelStyle}>Tickers</label>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_TICKERS.map((t) => (
          <TogglePill
            key={t}
            label={t}
            selected={tickers.includes(t)}
            onToggle={() => toggle(t)}
          />
        ))}
      </div>

      {customTickers.length > 0 && (
        <div className="flex flex-wrap gap-1.5" style={{ marginTop: "8px" }}>
          {customTickers.map((t) => (
            <SelectedPill
              key={t}
              label={t}
              onRemove={() => onChange(tickers.filter((x) => x !== t))}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          className="rounded"
          placeholder="Add custom ticker (e.g. UBER)"
          value={custom}
          onChange={(e) => setCustom(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          style={{
            ...pillBase,
            backgroundColor: DARK,
            color: BG,
            borderColor: DARK,
            opacity: !custom.trim() ? 0.45 : 1,
            whiteSpace: "nowrap",
            padding: "4px 14px",
          }}
        >
          Add
        </button>
      </div>
      <p style={hintStyle}>
        {tickers.length === 0 ? "No tickers selected — defaults to SPY" : `${tickers.length} selected`}
      </p>
    </div>
  );
}

// ─── CoinPicker ───────────────────────────────────────────────────────────────
const PRESET_COINS: { id: string; label: string }[] = [
  { id: "bitcoin",   label: "BTC"  },
  { id: "ethereum",  label: "ETH"  },
  { id: "solana",    label: "SOL"  },
  { id: "ripple",    label: "XRP"  },
  { id: "dogecoin",  label: "DOGE" },
  { id: "cardano",   label: "ADA"  },
  { id: "avalanche-2", label: "AVAX" },
  { id: "chainlink", label: "LINK" },
  { id: "polkadot",  label: "DOT"  },
  { id: "litecoin",  label: "LTC"  },
];

const PRESET_COIN_IDS = PRESET_COINS.map((c) => c.id);

function CoinPicker({
  coins,
  onChange,
}: {
  coins: string[];
  onChange: (c: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  const toggle = (id: string) => {
    onChange(
      coins.includes(id)
        ? coins.filter((c) => c !== id)
        : [...coins, id]
    );
  };

  const addCustom = () => {
    const id = custom.trim().toLowerCase();
    if (id && !coins.includes(id)) {
      onChange([...coins, id]);
    }
    setCustom("");
  };

  const customCoins = coins.filter((c) => !PRESET_COIN_IDS.includes(c));

  return (
    <div>
      <label style={labelStyle}>Coins</label>
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COINS.map((c) => (
          <TogglePill
            key={c.id}
            label={c.label}
            selected={coins.includes(c.id)}
            onToggle={() => toggle(c.id)}
          />
        ))}
      </div>

      {customCoins.length > 0 && (
        <div className="flex flex-wrap gap-1.5" style={{ marginTop: "8px" }}>
          {customCoins.map((id) => (
            <SelectedPill
              key={id}
              label={id}
              onRemove={() => onChange(coins.filter((x) => x !== id))}
            />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          className="rounded"
          placeholder="Add custom coin ID (e.g. uniswap)"
          value={custom}
          onChange={(e) => setCustom(e.target.value.toLowerCase())}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          style={{
            ...pillBase,
            backgroundColor: DARK,
            color: BG,
            borderColor: DARK,
            opacity: !custom.trim() ? 0.45 : 1,
            whiteSpace: "nowrap",
            padding: "4px 14px",
          }}
        >
          Add
        </button>
      </div>
      <p style={hintStyle}>
        {coins.length === 0 ? "No coins selected — defaults to BTC, ETH, SOL" : `${coins.length} selected`}
        {" · "}Use CoinGecko IDs for custom coins
      </p>
    </div>
  );
}

// ─── HeadlinesSelector ────────────────────────────────────────────────────────
const LIMIT_OPTIONS = [
  { label: "3",   value: 3  },
  { label: "5",   value: 5  },
  { label: "10",  value: 10 },
  { label: "15",  value: 15 },
  { label: "20",  value: 20 },
  { label: "Max", value: 50 },
];

function HeadlinesSelector({ limit, onChange }: { limit: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label style={labelStyle}>Headlines</label>
      <div className="flex flex-wrap gap-1.5">
        {LIMIT_OPTIONS.map((opt) => (
          <TogglePill
            key={opt.value}
            label={opt.label}
            selected={limit === opt.value}
            onToggle={() => onChange(opt.value)}
          />
        ))}
      </div>
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

  const currentLimit = (config.limit as number | undefined) ?? 3;
  const limitSelector = (
    <HeadlinesSelector limit={currentLimit} onChange={(n) => set({ limit: n })} />
  );

  // ── Weather ────────────────────────────────────────────────────────────────
  if (section.type === "weather") {
    return (
      <div className="space-y-4">
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
      </div>
    );
  }

  // ── Sports ─────────────────────────────────────────────────────────────────
  if (section.type === "sports") {
    const selected = (config.leagues as string[] | undefined) ?? [];
    const LEAGUES = ["NFL", "NBA", "MLB", "NHL", "Soccer", "College Football", "College Basketball"];
    return (
      <div className="space-y-4">
        <div>
          <label style={labelStyle}>Leagues</label>
          <div className="flex flex-wrap gap-1.5">
            {LEAGUES.map((l) => (
              <TogglePill
                key={l}
                label={l}
                selected={selected.includes(l)}
                onToggle={() =>
                  set({
                    leagues: selected.includes(l)
                      ? selected.filter((x) => x !== l)
                      : [...selected, l],
                  })
                }
              />
            ))}
          </div>
          <p style={hintStyle}>Select any — defaults to top ESPN headlines if none chosen</p>
        </div>
        {limitSelector}
      </div>
    );
  }

  // ── News ───────────────────────────────────────────────────────────────────
  if (section.type === "news") {
    const selected: string[] = (config.categories as string[] | undefined)
      ?? [(config.category as string | undefined) ?? "general"];
    const CATS = ["General", "Business", "Technology", "Sports", "Entertainment", "Health", "Science"];
    return (
      <div className="space-y-4">
        <div>
          <label style={labelStyle}>Categories</label>
          <div className="flex flex-wrap gap-1.5">
            {CATS.map((c) => {
              const val = c.toLowerCase();
              return (
                <TogglePill
                  key={c}
                  label={c}
                  selected={selected.includes(val)}
                  onToggle={() =>
                    set({
                      categories: selected.includes(val)
                        ? selected.filter((x) => x !== val)
                        : [...selected, val],
                    })
                  }
                />
              );
            })}
          </div>
          <p style={hintStyle}>Select any — defaults to General if none chosen</p>
        </div>
        {limitSelector}
      </div>
    );
  }

  // ── Finance ────────────────────────────────────────────────────────────────
  if (section.type === "finance") {
    const tickers = (config.tickers as string[] | undefined) ?? [];
    return (
      <div className="space-y-4">
        <TickerPicker tickers={tickers} onChange={(t) => set({ tickers: t })} />
      </div>
    );
  }

  // ── Crypto ─────────────────────────────────────────────────────────────────
  if (section.type === "crypto") {
    const coins = (config.coins as string[] | undefined) ?? [];
    return (
      <div className="space-y-4">
        <CoinPicker coins={coins} onChange={(c) => set({ coins: c })} />
      </div>
    );
  }

  // ── Quote ──────────────────────────────────────────────────────────────────
  if (section.type === "quote") {
    const selected = (config.tone as string | undefined) ?? "any";
    const TONES = ["Any", "Motivational", "Funny", "Philosophical", "Historical"];
    return (
      <div className="space-y-4">
        <div>
          <label style={labelStyle}>Tone</label>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <TogglePill
                key={t}
                label={t}
                selected={selected === t.toLowerCase()}
                onToggle={() => set({ tone: t.toLowerCase() })}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Custom ─────────────────────────────────────────────────────────────────
  if (section.type === "custom") {
    return (
      <div className="space-y-4">
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
        {limitSelector}
      </div>
    );
  }

  return null;
}
