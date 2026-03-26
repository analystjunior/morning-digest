"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKind =
  | "weather"
  | "news"
  | "calendar"
  | "tasks"
  | "stocks"
  | "quote"
  | "sports"
  | "custom";

interface SectionItem {
  id: string;
  kind: SectionKind;
  title: string;
  source: string;
  instructions: string;
  enabled: boolean;
}

interface EditDraft {
  title: string;
  source: string;
  instructions: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USER = { name: "Michael", email: "michael@example.com" };

const INITIAL_SECTIONS: SectionItem[] = [
  {
    id: "s1",
    kind: "weather",
    title: "Today's Weather",
    source: "New York, NY",
    instructions: "Include hourly forecast if available.",
    enabled: true,
  },
  {
    id: "s2",
    kind: "news",
    title: "Morning Headlines",
    source: "Reuters, The Verge",
    instructions: "Focus on tech, science, and markets.",
    enabled: true,
  },
  {
    id: "s3",
    kind: "calendar",
    title: "Today's Schedule",
    source: "Google Calendar",
    instructions: "",
    enabled: true,
  },
  {
    id: "s4",
    kind: "tasks",
    title: "Tasks Due Today",
    source: "Todoist",
    instructions: "Include overdue items from yesterday.",
    enabled: false,
  },
  {
    id: "s5",
    kind: "stocks",
    title: "Market Snapshot",
    source: "AAPL, MSFT, SPY",
    instructions: "",
    enabled: true,
  },
];

const MOCK_DELIVERY = {
  time: "07:00",
  timezone: "America/New_York",
  channel: "Email" as const,
  email: "michael@example.com",
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  lastDelivered: "Today at 7:01 AM",
  totalSent: 34,
};

// ─── Mock digest content (shown in modal) ─────────────────────────────────────

const MOCK_DIGEST_CONTENT: Record<string, React.ReactNode> = {
  s1: (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <span className="text-4xl font-light" style={{ color: "#1a1a1a" }}>68°</span>
        <div className="pb-1 text-sm leading-snug" style={{ color: "#555" }}>
          <p className="font-medium" style={{ color: "#1a1a1a" }}>Partly Cloudy</p>
          <p>New York, NY</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs" style={{ color: "#888" }}>
        {[
          { label: "High", value: "72°" },
          { label: "Low", value: "58°" },
          { label: "Wind", value: "8 mph SW" },
          { label: "Humidity", value: "52%" },
          { label: "UV Index", value: "4 · Moderate" },
          { label: "Sunrise", value: "6:48 AM" },
        ].map(({ label, value }) => (
          <div key={label} className="px-3 py-2" style={{ backgroundColor: "#DEDAD2", borderRadius: "6px" }}>
            <p className="mb-0.5" style={{ color: "#888" }}>{label}</p>
            <p className="font-medium" style={{ color: "#1a1a1a" }}>{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: "#888" }}>
        Afternoon: Clearing up. Evening: Clear skies, 61°.
      </p>
    </div>
  ),
  s2: (
    <div className="space-y-3">
      {[
        {
          headline: "OpenAI releases new reasoning model with stronger STEM benchmarks",
          source: "The Verge",
          ago: "2h ago",
        },
        {
          headline: "Tesla reports record Q1 deliveries despite broader EV market slowdown",
          source: "Reuters",
          ago: "3h ago",
        },
        {
          headline: "Scientists identify potential early biomarker for Alzheimer's detection",
          source: "Nature",
          ago: "4h ago",
        },
        {
          headline: "Fed minutes suggest one rate cut likely in second half of 2026",
          source: "Wall Street Journal",
          ago: "5h ago",
        },
      ].map(({ headline, source, ago }) => (
        <div
          key={headline}
          className="flex items-start gap-3 py-3 last:border-0"
          style={{ borderBottom: "1px solid #D5D2CA" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug" style={{ color: "#1a1a1a" }}>{headline}</p>
            <p className="text-xs mt-1" style={{ color: "#888" }}>
              {source} · {ago}
            </p>
          </div>
        </div>
      ))}
    </div>
  ),
  s3: (
    <div className="space-y-1.5">
      {[
        { time: "9:00 AM", title: "Team standup", where: "Google Meet" },
        { time: "11:00 AM", title: "Design review — Q2 roadmap", where: "Conference Room B" },
        { time: "1:00 PM", title: "Lunch with Sarah Chen", where: "Nobu Downtown" },
        { time: "3:30 PM", title: "Product review", where: "Zoom" },
        { time: "5:00 PM", title: "Weekly 1:1 with manager", where: "Zoom" },
      ].map(({ time, title, where }) => (
        <div
          key={title}
          className="flex items-center gap-3 px-3 py-2.5 rounded"
          style={{ transition: "background 150ms" }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#D5D2CA")}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <span className="text-xs w-16 shrink-0 tabular-nums" style={{ color: "#888" }}>{time}</span>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#555" }} aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm leading-snug truncate" style={{ color: "#1a1a1a" }}>{title}</p>
            <p className="text-xs" style={{ color: "#888" }}>{where}</p>
          </div>
        </div>
      ))}
    </div>
  ),
  s5: (
    <div className="space-y-2">
      {[
        { ticker: "AAPL", name: "Apple Inc.", price: "214.73", change: "+1.24", pct: "+0.58%", up: true },
        { ticker: "MSFT", name: "Microsoft Corp.", price: "418.92", change: "+3.41", pct: "+0.82%", up: true },
        { ticker: "SPY", name: "S&P 500 ETF", price: "538.19", change: "-2.07", pct: "-0.38%", up: false },
      ].map(({ ticker, name, price, change, pct, up }) => (
        <div
          key={ticker}
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: "#DEDAD2", borderRadius: "6px" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{ticker}</p>
            <p className="text-xs" style={{ color: "#888" }}>{name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>${price}</p>
            <p className="text-xs font-medium" style={{ color: up ? "#2d6a2d" : "#8b2222" }}>
              {change} ({pct})
            </p>
          </div>
        </div>
      ))}
      <p className="text-xs pt-1" style={{ color: "#888" }}>Prices as of market close · Tue, Mar 24</p>
    </div>
  ),
};

// ─── Icon ─────────────────────────────────────────────────────────────────────

function SectionIcon({ kind, size = 16 }: { kind: SectionKind; size?: number }) {
  const p = {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "weather":
      return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>;
    case "news":
      return <svg {...p}><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>;
    case "calendar":
      return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case "tasks":
      return <svg {...p}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case "stocks":
      return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case "quote":
      return <svg {...p}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>;
    case "sports":
      return <svg {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
    default:
      return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  }
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        backgroundColor: checked ? "#1a1a1a" : "#C8C5BC",
        focusRingColor: "#1a1a1a",
        ["--tw-ring-offset-color" as string]: "#E8E6DF",
      }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const INPUT =
  "w-full rounded border px-3.5 py-2.5 text-sm placeholder:text-[#aaa] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] transition";
const INPUT_STYLE = { borderColor: "#C8C5BC", backgroundColor: "#fff", color: "#1a1a1a" };
const LABEL = "block text-xs font-medium mb-1.5";

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  onToggle,
  onSave,
}: {
  section: SectionItem;
  onToggle: () => void;
  onSave: (draft: EditDraft) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditDraft>({
    title: section.title,
    source: section.source,
    instructions: section.instructions,
  });

  function openEdit() {
    setDraft({ title: section.title, source: section.source, instructions: section.instructions });
    setEditing(true);
  }

  function save() {
    if (!draft.title.trim()) return;
    onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  const KIND_LABEL: Record<SectionKind, string> = {
    weather: "Weather",
    news: "News",
    calendar: "Calendar",
    tasks: "Tasks",
    stocks: "Stocks",
    quote: "Quote",
    sports: "Sports",
    custom: "Custom",
  };

  return (
    <div
      className="rounded border overflow-hidden transition-colors duration-200"
      style={{
        borderColor: "#C8C5BC",
        backgroundColor: section.enabled ? "#fff" : "#DEDAD2",
        opacity: section.enabled ? 1 : 0.7,
      }}
    >
      {/* Card header row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Icon */}
        <span
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded transition-colors"
          style={{
            backgroundColor: section.enabled ? "rgba(26,26,26,0.08)" : "#E8E6DF",
            color: section.enabled ? "#1a1a1a" : "#888",
          }}
        >
          <SectionIcon kind={section.kind} size={17} />
        </span>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold leading-snug"
              style={{ color: section.enabled ? "#1a1a1a" : "#888" }}
            >
              {section.title}
            </span>
            <span className="text-xs uppercase tracking-wider font-medium" style={{ color: "#aaa" }}>
              {KIND_LABEL[section.kind]}
            </span>
          </div>
          {section.source && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "#888" }}>{section.source}</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {!editing && (
            <button
              type="button"
              onClick={openEdit}
              className="text-xs font-medium transition-colors px-2.5 py-1 rounded border border-transparent hover:border-[#C8C5BC]"
              style={{ color: "#555" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#555")}
            >
              Edit
            </button>
          )}
          <Toggle
            checked={section.enabled}
            onChange={onToggle}
            label={`${section.enabled ? "Disable" : "Enable"} ${section.title}`}
          />
        </div>
      </div>

      {/* Inline edit panel */}
      {editing && (
        <div className="px-5 py-5 space-y-4" style={{ borderTop: "1px solid #D5D2CA", backgroundColor: "#F4F2EC" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL} style={{ color: "#555" }}>Section title</label>
              <input
                className={INPUT}
                style={INPUT_STYLE}
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Section title"
                autoFocus
              />
              {!draft.title.trim() && (
                <p className="mt-1.5 text-xs" style={{ color: "#cc3333" }}>Title is required.</p>
              )}
            </div>
            <div>
              <label className={LABEL} style={{ color: "#555" }}>
                Source{" "}
                <span style={{ color: "#aaa" }}>(optional)</span>
              </label>
              <input
                className={INPUT}
                style={INPUT_STYLE}
                value={draft.source}
                onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
                placeholder="e.g. RSS URL, city, tickers…"
              />
            </div>
          </div>
          <div>
            <label className={LABEL} style={{ color: "#555" }}>
              Instructions{" "}
              <span style={{ color: "#aaa" }}>(optional)</span>
            </label>
            <textarea
              className={`${INPUT} resize-none h-16`}
              style={INPUT_STYLE}
              value={draft.instructions}
              onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))}
              placeholder="Any preferences for this section…"
            />
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={!draft.title.trim()}
              className="inline-flex items-center gap-1.5 rounded font-semibold text-xs px-4 py-2 transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#1a1a1a", color: "#E8E6DF" }}
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-xs transition-colors px-3 py-2"
              style={{ color: "#888" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#888")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Instructions preview (when not editing) */}
      {!editing && section.instructions && section.enabled && (
        <div className="px-5 py-2.5" style={{ borderTop: "1px solid #D5D2CA" }}>
          <p className="text-xs italic leading-snug truncate" style={{ color: "#888" }}>
            &ldquo;{section.instructions}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Digest modal ─────────────────────────────────────────────────────────────

function DigestModal({
  sections,
  onClose,
}: {
  sections: SectionItem[];
  onClose: () => void;
}) {
  const enabled = sections.filter((s) => s.enabled);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const KIND_LABEL: Record<SectionKind, string> = {
    weather: "Weather",
    news: "Headlines",
    calendar: "Schedule",
    tasks: "Tasks",
    stocks: "Markets",
    quote: "Quote",
    sports: "Sports",
    custom: "Custom",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 py-10 sm:py-16 overflow-y-auto"
      style={{ backgroundColor: "rgba(26,26,26,0.4)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-xl rounded-lg border shadow-xl overflow-hidden"
        style={{ backgroundColor: "#E8E6DF", borderColor: "#C8C5BC" }}
      >
        {/* Modal toolbar */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #C8C5BC", backgroundColor: "#DEDAD2" }}
        >
          <div className="flex items-center gap-2.5 text-sm">
            <span className="font-semibold" style={{ color: "#1a1a1a", fontFamily: "var(--font-playfair), serif" }}>
              Today&apos;s Digest
            </span>
            <span style={{ color: "#C8C5BC" }}>·</span>
            <span className="text-xs" style={{ color: "#888" }}>{today}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex items-center justify-center w-7 h-7 rounded transition-colors"
            style={{ color: "#888" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#1a1a1a"; e.currentTarget.style.backgroundColor = "#D5D2CA"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#888"; e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Digest body */}
        <div className="px-6 py-6 space-y-1 overflow-y-auto max-h-[70vh]">

          {/* Greeting */}
          <div className="pb-5 mb-2" style={{ borderBottom: "1px solid #D5D2CA" }}>
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#888" }}>
              Good morning
            </p>
            <p className="text-xl font-semibold leading-snug" style={{ color: "#1a1a1a", fontFamily: "var(--font-playfair), serif" }}>
              {MOCK_USER.name}, here&apos;s your briefing.
            </p>
            <p className="text-sm mt-1" style={{ color: "#888" }}>
              {enabled.length} section{enabled.length !== 1 ? "s" : ""} ·{" "}
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>

          {/* Sections */}
          {enabled.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "#888" }}>
              All sections are disabled. Toggle some on to see your digest.
            </p>
          ) : (
            enabled.map((section) => (
              <div key={section.id} className="py-5 last:border-0" style={{ borderBottom: "1px solid #D5D2CA" }}>
                {/* Section label */}
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ color: "#555" }}>
                    <SectionIcon kind={section.kind} size={14} />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#888" }}>
                    {KIND_LABEL[section.kind]}
                  </span>
                  <span className="flex-1 h-px" style={{ backgroundColor: "#D5D2CA" }} aria-hidden="true" />
                </div>

                {/* Section content */}
                {MOCK_DIGEST_CONTENT[section.id] ?? (
                  <div className="space-y-2">
                    <div className="h-2.5 rounded-full w-4/5" style={{ backgroundColor: "#C8C5BC" }} />
                    <div className="h-2.5 rounded-full w-3/5" style={{ backgroundColor: "#C8C5BC" }} />
                    <div className="h-2.5 rounded-full w-2/3" style={{ backgroundColor: "#C8C5BC" }} />
                    <p className="text-xs pt-1 italic" style={{ color: "#888" }}>
                      Mock content for {section.title}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Footer */}
          <div className="pt-4 text-center">
            <p className="text-xs" style={{ color: "#aaa" }}>
              The Paper Route · Delivered at 7:00 AM · Tue, Mar 25
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [sections, setSections] = useState<SectionItem[]>(INITIAL_SECTIONS);
  const [digestActive, setDigestActive] = useState(true);
  const [showModal, setShowModal] = useState(false);

  function toggleSection(id: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  function saveSection(id: string, draft: EditDraft) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...draft } : s))
    );
  }

  const enabledCount = sections.filter((s) => s.enabled).length;
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "#E8E6DF", color: "#1a1a1a", fontFamily: "var(--font-inter), sans-serif" }}
      >

        {/* Nav */}
        <nav
          className="flex items-center justify-between px-6 py-5 sm:px-12 max-w-5xl mx-auto"
          style={{ borderBottom: "1px solid #D5D2CA" }}
        >
          <Link
            href="/"
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-playfair), serif", color: "#1a1a1a" }}
          >
            The Paper Route
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors rounded px-4 py-1.5"
              style={{ color: "#555", border: "1px solid #C8C5BC" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#1a1a1a"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#C8C5BC"; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Preview digest
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold select-none"
              style={{ backgroundColor: "rgba(26,26,26,0.1)", color: "#1a1a1a" }}
            >
              {MOCK_USER.name[0]}
            </div>
          </div>
        </nav>

        <main className="px-6 py-10 sm:px-12 max-w-5xl mx-auto space-y-8">

          {/* Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#888" }}>
                {todayName}
              </p>
              <h1
                className="text-2xl sm:text-3xl font-semibold tracking-tight"
                style={{ color: "#1a1a1a", fontFamily: "var(--font-playfair), serif" }}
              >
                Good morning, {MOCK_USER.name}.
              </h1>
            </div>
            <Link
              href="/setup"
              className="self-start sm:self-auto text-xs font-medium flex items-center gap-1.5 transition-colors"
              style={{ color: "#888" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#888")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Reconfigure digest
            </Link>
          </div>

          {/* Status banner */}
          <div
            className="flex items-center justify-between gap-4 rounded border px-6 py-4 transition-colors duration-300"
            style={{
              borderColor: "#C8C5BC",
              backgroundColor: digestActive ? "#fff" : "#DEDAD2",
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-colors"
                style={{ backgroundColor: digestActive ? "#1a1a1a" : "#C8C5BC" }}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: digestActive ? "#1a1a1a" : "#888" }}>
                  {digestActive ? "Digest active" : "Digest paused"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                  {digestActive
                    ? `Next delivery: Tomorrow at 7:00 AM · ${enabledCount} section${enabledCount !== 1 ? "s" : ""}`
                    : "No digest will be sent until you re-enable it"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {digestActive && (
                <span className="hidden sm:block text-xs" style={{ color: "#888" }}>
                  Last sent: {MOCK_DELIVERY.lastDelivered}
                </span>
              )}
              <Toggle
                checked={digestActive}
                onChange={() => setDigestActive((v) => !v)}
                label={digestActive ? "Pause digest" : "Resume digest"}
              />
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

            {/* Sections list (2/3) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#888" }}>
                  Sections
                  <span className="ml-2 font-normal normal-case tracking-normal" style={{ color: "#aaa" }}>
                    {enabledCount} of {sections.length} active
                  </span>
                </h2>
                <Link
                  href="/setup"
                  className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: "#888" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#1a1a1a")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#888")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add section
                </Link>
              </div>

              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  onToggle={() => toggleSection(section.id)}
                  onSave={(draft) => saveSection(section.id, draft)}
                />
              ))}
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-4 lg:sticky lg:top-8">

              {/* Delivery settings card */}
              <div className="rounded border overflow-hidden" style={{ borderColor: "#C8C5BC", backgroundColor: "#fff" }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #C8C5BC" }}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#888" }}>
                    Delivery
                  </h2>
                  <button
                    type="button"
                    className="text-xs font-medium transition-colors px-2.5 py-1 rounded border border-transparent"
                    style={{ color: "#555" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#1a1a1a"; e.currentTarget.style.borderColor = "#C8C5BC"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "transparent"; }}
                  >
                    Edit
                  </button>
                </div>

                <dl className="px-5 py-4 space-y-3.5">
                  {[
                    {
                      label: "Time",
                      value: (
                        <span className="font-semibold" style={{ color: "#1a1a1a" }}>7:00 AM</span>
                      ),
                    },
                    {
                      label: "Days",
                      value: (
                        <div className="flex gap-1 flex-wrap justify-end">
                          {["M","T","W","T","F"].map((d, i) => (
                            <span
                              key={i}
                              className="w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center"
                              style={{ backgroundColor: "rgba(26,26,26,0.08)", color: "#1a1a1a" }}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      ),
                    },
                    {
                      label: "Channel",
                      value: <span style={{ color: "#1a1a1a" }}>Email</span>,
                    },
                    {
                      label: "Sending to",
                      value: (
                        <span className="text-xs truncate max-w-[140px] text-right" style={{ color: "#555" }}>
                          {MOCK_DELIVERY.email}
                        </span>
                      ),
                    },
                    {
                      label: "Timezone",
                      value: (
                        <span className="text-xs" style={{ color: "#555" }}>New York</span>
                      ),
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-3 text-sm">
                      <dt style={{ color: "#888" }}>{label}</dt>
                      <dd className="text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Stats card */}
              <div className="rounded border px-5 py-4" style={{ borderColor: "#C8C5BC", backgroundColor: "#fff" }}>
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#888" }}>
                  Stats
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Digests sent", value: MOCK_DELIVERY.totalSent },
                    { label: "Sections active", value: enabledCount },
                    { label: "Streak", value: "12 days" },
                    { label: "Member since", value: "Jan 2026" },
                  ].map(({ label, value }) => (
                    <div key={label} className="px-3.5 py-3 rounded" style={{ backgroundColor: "#DEDAD2" }}>
                      <p className="text-lg font-semibold leading-none" style={{ color: "#1a1a1a" }}>{value}</p>
                      <p className="text-xs mt-1 leading-snug" style={{ color: "#888" }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview CTA — mobile */}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="lg:hidden w-full flex items-center justify-center gap-2 rounded border text-sm font-medium py-3 transition-colors"
                style={{ borderColor: "#C8C5BC", color: "#555" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.color = "#1a1a1a"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#C8C5BC"; e.currentTarget.style.color = "#555"; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Preview today&apos;s digest
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <DigestModal sections={sections} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
