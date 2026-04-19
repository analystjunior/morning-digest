"use client";

import { useState, useCallback } from "react";
import { DigestSection } from "@/lib/types";
import { Autocomplete } from "./Autocomplete";
import { searchTeams, type EspnTeam } from "@/lib/sports-teams";

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

interface TickerResult { symbol: string; name: string; }

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

  const fetchTickers = useCallback(async (q: string): Promise<TickerResult[]> => {
    const res = await fetch(`/api/ticker-search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json() as { results: TickerResult[] };
    return data.results ?? [];
  }, []);

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
        <Autocomplete<TickerResult>
          value={custom}
          onChange={(v) => setCustom(v.toUpperCase())}
          onSelect={(item) => {
            if (!tickers.includes(item.symbol)) onChange([...tickers, item.symbol]);
            setCustom("");
          }}
          fetchSuggestions={fetchTickers}
          renderSuggestion={(item) => (
            <span>
              <span style={{ fontWeight: 600 }}>{item.symbol}</span>
              <span style={{ color: "#888", marginLeft: "6px" }}>{item.name}</span>
            </span>
          )}
          placeholder="Add custom ticker (e.g. UBER)"
          inputStyle={{ ...inputStyle, flex: 1 }}
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

interface CoinResult { id: string; name: string; symbol: string; }

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

  const fetchCoins = useCallback(async (q: string): Promise<CoinResult[]> => {
    const res = await fetch(`/api/coin-search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json() as { results: CoinResult[] };
    return data.results ?? [];
  }, []);

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
        <Autocomplete<CoinResult>
          value={custom}
          onChange={(v) => setCustom(v)}
          onSelect={(item) => {
            if (!coins.includes(item.id)) onChange([...coins, item.id]);
            setCustom("");
          }}
          fetchSuggestions={fetchCoins}
          renderSuggestion={(item) => (
            <span>
              <span style={{ fontWeight: 600 }}>{item.symbol}</span>
              <span style={{ color: "#888", marginLeft: "6px" }}>{item.name}</span>
            </span>
          )}
          placeholder="Search coins (e.g. Uniswap)"
          inputStyle={{ ...inputStyle, flex: 1 }}
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

// ─── FavoriteTeamsPicker ──────────────────────────────────────────────────────

const MAX_TEAMS = 5;

function FavoriteTeamsPicker({
  teams,
  onChange,
}: {
  teams: EspnTeam[];
  onChange: (t: EspnTeam[]) => void;
}) {
  const [query, setQuery] = useState("");

  const fetchTeamSuggestions = useCallback(
    async (q: string): Promise<EspnTeam[]> => Promise.resolve(searchTeams(q)),
    []
  );

  const addTeam = (team: EspnTeam) => {
    if (teams.length >= MAX_TEAMS) return;
    if (teams.some((t) => t.espnId === team.espnId)) return;
    onChange([...teams, team]);
    setQuery("");
  };

  const removeTeam = (espnId: string) =>
    onChange(teams.filter((t) => t.espnId !== espnId));

  return (
    <div>
      <label style={labelStyle}>
        Favorite Teams{" "}
        <span style={{ color: "#bbb", fontWeight: 400 }}>(optional · up to {MAX_TEAMS})</span>
      </label>

      {teams.length > 0 && (
        <div className="flex flex-wrap gap-1.5" style={{ marginBottom: "8px" }}>
          {teams.map((t) => (
            <SelectedPill
              key={t.espnId}
              label={`${t.name} · ${t.leagueLabel}`}
              onRemove={() => removeTeam(t.espnId)}
            />
          ))}
        </div>
      )}

      {teams.length < MAX_TEAMS && (
        <Autocomplete<EspnTeam>
          value={query}
          onChange={setQuery}
          onSelect={addTeam}
          fetchSuggestions={fetchTeamSuggestions}
          renderSuggestion={(team) => (
            <span>
              {team.name}
              <span style={{ color: "#888", marginLeft: "6px", fontSize: "11px" }}>
                {team.leagueLabel}
              </span>
            </span>
          )}
          placeholder="Search teams (e.g. Chiefs, Lakers, Arsenal)"
          inputStyle={inputStyle}
        />
      )}

      <p style={hintStyle}>
        {teams.length === 0
          ? "Get recent results and upcoming games in your digest"
          : `${teams.length} of ${MAX_TEAMS} selected · recent results and next game shown in digest`}
      </p>
    </div>
  );
}

// ─── WeatherConfig ────────────────────────────────────────────────────────────

interface CityResult { label: string; }

function WeatherConfig({
  config,
  set,
}: {
  config: Record<string, unknown>;
  set: (u: Record<string, unknown>) => void;
}) {
  const fetchCities = useCallback(async (q: string): Promise<CityResult[]> => {
    const res = await fetch(`/api/city-search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json() as { results: CityResult[] };
    return data.results ?? [];
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label style={labelStyle}>City</label>
        <Autocomplete<CityResult>
          value={(config.city as string | undefined) ?? ""}
          onChange={(v) => set({ city: v })}
          onSelect={(item) => set({ city: item.label })}
          fetchSuggestions={fetchCities}
          renderSuggestion={(item) => item.label}
          placeholder="New York"
          inputStyle={inputStyle}
        />
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
    return <WeatherConfig config={config} set={set} />;
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
        <FavoriteTeamsPicker
          teams={(config.favoriteTeams as EspnTeam[] | undefined) ?? []}
          onChange={(teams) => set({ favoriteTeams: teams })}
        />
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
    return (
      <p style={hintStyle}>A random quote is selected each day — no configuration needed.</p>
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
