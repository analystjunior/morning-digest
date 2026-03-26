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

interface WizardSection {
  id: string;
  kind: SectionKind;
  title: string;
  instructions: string;
  source: string;
}

interface DeliveryForm {
  time: string;
  timezone: string;
  channel: "email" | "sms" | "both";
  email: string;
  phone: string;
  days: Set<number>; // 0 = Sun … 6 = Sat
}

type StepErrors = Record<string, string>;

// ─── Static config ────────────────────────────────────────────────────────────

const SECTION_OPTIONS: {
  kind: SectionKind;
  label: string;
  hint: string;
  defaultTitle: string;
  sourcePlaceholder: string;
}[] = [
  {
    kind: "weather",
    label: "Weather",
    hint: "Forecast & conditions",
    defaultTitle: "Today's Weather",
    sourcePlaceholder: "e.g. New York, NY",
  },
  {
    kind: "news",
    label: "News",
    hint: "Top headlines",
    defaultTitle: "Morning Headlines",
    sourcePlaceholder: "e.g. Reuters, BBC",
  },
  {
    kind: "calendar",
    label: "Calendar",
    hint: "Events & meetings",
    defaultTitle: "Today's Schedule",
    sourcePlaceholder: "Google Calendar, Outlook…",
  },
  {
    kind: "tasks",
    label: "Tasks",
    hint: "Due & overdue to-dos",
    defaultTitle: "Tasks Due Today",
    sourcePlaceholder: "Todoist, Linear, Notion…",
  },
  {
    kind: "stocks",
    label: "Stocks",
    hint: "Market snapshot",
    defaultTitle: "Market Snapshot",
    sourcePlaceholder: "e.g. AAPL, MSFT, SPY",
  },
  {
    kind: "quote",
    label: "Daily Quote",
    hint: "Inspiration to start",
    defaultTitle: "Quote of the Day",
    sourcePlaceholder: "Any category or leave blank",
  },
  {
    kind: "sports",
    label: "Sports",
    hint: "Scores & schedules",
    defaultTitle: "Sports Roundup",
    sourcePlaceholder: "e.g. NBA, NFL, Man United",
  },
  {
    kind: "custom",
    label: "Custom Feed",
    hint: "Any RSS or API",
    defaultTitle: "Custom Section",
    sourcePlaceholder: "RSS URL or API endpoint",
  },
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Starter templates ────────────────────────────────────────────────────────

interface StarterTemplate {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  sections: Omit<WizardSection, "id">[];
}

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "sports",
    emoji: "🏆",
    name: "Sports Fan",
    tagline: "Scores, standings & today's games",
    sections: [
      {
        kind: "sports",
        title: "Sports Roundup",
        source: "NFL, NBA, MLB, EPL",
        instructions: "Include last night's scores and today's schedule. Flag any upsets.",
      },
      {
        kind: "news",
        title: "Sports Headlines",
        source: "ESPN, The Athletic",
        instructions: "Top 3 sports stories only — trades, injuries, big games.",
      },
      {
        kind: "weather",
        title: "Today's Weather",
        source: "",
        instructions: "",
      },
    ],
  },
  {
    id: "markets",
    emoji: "📈",
    name: "Markets",
    tagline: "Pre-market snapshot & financial news",
    sections: [
      {
        kind: "stocks",
        title: "Market Snapshot",
        source: "SPY, QQQ, AAPL, MSFT, BTC-USD",
        instructions: "Include pre-market moves and overnight futures.",
      },
      {
        kind: "news",
        title: "Market Brief",
        source: "Bloomberg, WSJ, Reuters",
        instructions:
          "Focus on Fed news, macro indicators, and earnings surprises. Skip political fluff.",
      },
      {
        kind: "weather",
        title: "Today's Weather",
        source: "",
        instructions: "",
      },
    ],
  },
  {
    id: "politics",
    emoji: "🗳️",
    name: "Politics",
    tagline: "What's happening in policy & government",
    sections: [
      {
        kind: "news",
        title: "Political Headlines",
        source: "AP News, Reuters, Politico, BBC",
        instructions:
          "US and world politics. Be neutral — present all sides. Top 5 stories.",
      },
      {
        kind: "quote",
        title: "Quote of the Day",
        source: "historical leaders and thinkers",
        instructions: "Preferably something thought-provoking about civic life or leadership.",
      },
      {
        kind: "weather",
        title: "Today's Weather",
        source: "",
        instructions: "",
      },
    ],
  },
  {
    id: "wildcard",
    emoji: "✨",
    name: "Wildcard",
    tagline: "Curious, funny & unexpected",
    sections: [
      {
        kind: "quote",
        title: "Quote of the Day",
        source: "comedy, philosophy, science",
        instructions: "Mix of funny, weird, and genuinely wise. No clichés.",
      },
      {
        kind: "news",
        title: "Weird & Wonderful",
        source: "Hacker News, Reddit, Fark, Atlas Obscura",
        instructions:
          "Unusual, surprising, or delightful stories only. Nothing grim.",
      },
      {
        kind: "sports",
        title: "Sports Scores",
        source: "Major sports only",
        instructions: "Just the highlights — one line per result.",
      },
      {
        kind: "weather",
        title: "Today's Weather",
        source: "",
        instructions: "",
      },
    ],
  },
];

const STEPS = [
  { n: 1, label: "Sections" },
  { n: 2, label: "Delivery" },
  { n: 3, label: "Confirm" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────

function SectionIcon({
  kind,
  size = 18,
}: {
  kind: SectionKind;
  size?: number;
}) {
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
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "news":
      return (
        <svg {...p}>
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "tasks":
      return (
        <svg {...p}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "stocks":
      return (
        <svg {...p}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "quote":
      return (
        <svg {...p}>
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
      );
    case "sports":
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    case "custom":
      return (
        <svg {...p}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmt12(time: string) {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function validateStep1(sections: WizardSection[]): StepErrors {
  const e: StepErrors = {};
  if (sections.length === 0) e.sections = "Add at least one section to your digest.";
  sections.forEach((s, i) => {
    if (!s.title.trim()) e[`title_${i}`] = "Section title is required.";
  });
  return e;
}

function validateStep2(form: DeliveryForm): StepErrors {
  const e: StepErrors = {};
  if (!form.time) e.time = "Delivery time is required.";
  if (!form.timezone) e.timezone = "Timezone is required.";
  if (form.days.size === 0) e.days = "Select at least one delivery day.";
  if (form.channel === "email" || form.channel === "both") {
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address.";
  }
  if ((form.channel === "sms" || form.channel === "both") && !form.phone.trim())
    e.phone = "Phone number is required.";
  return e;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition";
const INPUT_ERR = "border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60";
const LABEL = "block text-xs font-medium text-zinc-400 mb-1.5";
const ERR = "mt-1.5 text-xs text-red-400";

// ─── Step 1: Sections ─────────────────────────────────────────────────────────

function SectionsStep({
  sections,
  setSections,
  errors,
}: {
  sections: WizardSection[];
  setSections: React.Dispatch<React.SetStateAction<WizardSection[]>>;
  errors: StepErrors;
}) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const addedKinds = new Set(sections.map((s) => s.kind));

  function applyTemplate(template: StarterTemplate) {
    setActiveTemplate(template.id);
    setSections(template.sections.map((s) => ({ ...s, id: uid() })));
  }

  function clearTemplate() {
    setActiveTemplate(null);
    setSections([]);
  }

  function add(kind: SectionKind) {
    if (addedKinds.has(kind)) return;
    // Adding a section manually diverges from the template
    setActiveTemplate(null);
    const opt = SECTION_OPTIONS.find((o) => o.kind === kind)!;
    setSections((prev) => [
      ...prev,
      { id: uid(), kind, title: opt.defaultTitle, instructions: "", source: "" },
    ]);
  }

  function remove(id: string) {
    setActiveTemplate(null);
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function update(id: string, field: keyof WizardSection, value: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Choose your sections</h2>
        <p className="text-sm text-zinc-400">
          Start from a template or build your digest section by section.
        </p>
      </div>

      {/* ── Starter templates ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Quick-start templates
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {STARTER_TEMPLATES.map((tpl) => {
            const active = activeTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className={`relative flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left transition-all duration-150 ${
                  active
                    ? "border-amber-400/60 bg-amber-400/8 ring-1 ring-amber-400/30"
                    : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-800"
                }`}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {tpl.emoji}
                </span>
                <span className={`text-sm font-semibold leading-snug ${active ? "text-amber-400" : "text-white"}`}>
                  {tpl.name}
                </span>
                <span className="text-xs text-zinc-500 leading-snug">
                  {tpl.tagline}
                </span>
                {/* Section count pill */}
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                  active
                    ? "border-amber-400/30 text-amber-400 bg-amber-400/10"
                    : "border-zinc-700 text-zinc-600"
                }`}>
                  {tpl.sections.length} sections
                </span>
                {active && (
                  <span className="absolute top-2.5 right-2.5 flex items-center justify-center w-4 h-4 rounded-full bg-amber-400/20 text-amber-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTemplate && (
          <p className="text-xs text-zinc-500">
            Template applied.{" "}
            <button
              type="button"
              onClick={clearTemplate}
              className="text-zinc-400 underline underline-offset-2 hover:text-white transition-colors"
            >
              Clear and start from scratch
            </button>
          </p>
        )}
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-zinc-800" aria-hidden="true" />
        <span className="text-xs text-zinc-600 shrink-0">or add sections manually</span>
        <span className="flex-1 h-px bg-zinc-800" aria-hidden="true" />
      </div>

      {/* ── Section type picker ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SECTION_OPTIONS.map(({ kind, label, hint }) => {
          const added = addedKinds.has(kind);
          return (
            <button
              key={kind}
              type="button"
              onClick={() => add(kind)}
              disabled={added}
              className={`relative flex flex-col items-start gap-2 rounded-xl border px-3.5 py-3.5 text-left text-sm transition-all duration-150 ${
                added
                  ? "border-amber-400/40 bg-amber-400/5 text-amber-400 cursor-default"
                  : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer"
              }`}
            >
              <SectionIcon kind={kind} />
              <span className="font-medium leading-none">{label}</span>
              <span className="text-xs text-zinc-500 leading-snug">{hint}</span>
              {added && (
                <span className="absolute top-2.5 right-2.5 flex items-center justify-center w-4 h-4 rounded-full bg-amber-400/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {errors.sections && (
        <p className={ERR + " -mt-4"}>{errors.sections}</p>
      )}

      {/* Added sections */}
      {sections.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-600">
            Your sections — {sections.length} added
          </p>

          {sections.map((section, i) => {
            const opt = SECTION_OPTIONS.find((o) => o.kind === section.kind)!;
            return (
              <div
                key={section.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4"
              >
                {/* Section header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400">
                    <SectionIcon kind={section.kind} size={15} />
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {opt.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(section.id)}
                    aria-label={`Remove ${section.title}`}
                    className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>
                      Section title <span className="text-amber-500">*</span>
                    </label>
                    <input
                      className={`${INPUT} ${errors[`title_${i}`] ? INPUT_ERR : ""}`}
                      value={section.title}
                      onChange={(e) => update(section.id, "title", e.target.value)}
                      placeholder="Section title"
                    />
                    {errors[`title_${i}`] && (
                      <p className={ERR}>{errors[`title_${i}`]}</p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL}>
                      Source{" "}
                      <span className="text-zinc-600">(optional)</span>
                    </label>
                    <input
                      className={INPUT}
                      value={section.source}
                      onChange={(e) => update(section.id, "source", e.target.value)}
                      placeholder={opt.sourcePlaceholder}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>
                    Instructions{" "}
                    <span className="text-zinc-600">(optional)</span>
                  </label>
                  <textarea
                    className={`${INPUT} resize-none h-[4.5rem]`}
                    value={section.instructions}
                    onChange={(e) =>
                      update(section.id, "instructions", e.target.value)
                    }
                    placeholder="Any specific preferences for this section…"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Delivery ─────────────────────────────────────────────────────────

function DeliveryStep({
  form,
  setForm,
  errors,
}: {
  form: DeliveryForm;
  setForm: React.Dispatch<React.SetStateAction<DeliveryForm>>;
  errors: StepErrors;
}) {
  function toggleDay(d: number) {
    setForm((prev) => {
      const days = new Set(prev.days);
      days.has(d) ? days.delete(d) : days.add(d);
      return { ...prev, days };
    });
  }

  const channels: {
    value: "email" | "sms" | "both";
    label: string;
    hint: string;
  }[] = [
    { value: "email", label: "Email", hint: "Full digest in your inbox" },
    { value: "sms", label: "SMS", hint: "Short summary via text" },
    { value: "both", label: "Both", hint: "Email + SMS" },
  ];

  const needsEmail = form.channel === "email" || form.channel === "both";
  const needsSms = form.channel === "sms" || form.channel === "both";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Delivery settings</h2>
        <p className="text-sm text-zinc-400">
          Choose when and how you&apos;d like to receive your digest.
        </p>
      </div>

      {/* Time + timezone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={LABEL}>
            Delivery time <span className="text-amber-500">*</span>
          </label>
          <input
            type="time"
            className={`${INPUT} [color-scheme:dark] ${errors.time ? INPUT_ERR : ""}`}
            value={form.time}
            onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
          />
          {errors.time && <p className={ERR}>{errors.time}</p>}
        </div>
        <div>
          <label className={LABEL}>
            Timezone <span className="text-amber-500">*</span>
          </label>
          <select
            className={`${INPUT} ${errors.timezone ? INPUT_ERR : ""}`}
            value={form.timezone}
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
          >
            <option value="">Select timezone…</option>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {errors.timezone && <p className={ERR}>{errors.timezone}</p>}
        </div>
      </div>

      {/* Days of week */}
      <div>
        <label className={LABEL}>
          Delivery days <span className="text-amber-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DAY_LABELS.map((label, i) => {
            const active = form.days.has(i);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(i)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150 ${
                  active
                    ? "bg-amber-400/10 border-amber-400/50 text-amber-400"
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {errors.days && <p className={ERR}>{errors.days}</p>}
      </div>

      {/* Channel */}
      <div>
        <label className={LABEL}>
          Delivery channel <span className="text-amber-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2.5 mt-1">
          {channels.map(({ value, label, hint }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, channel: value }))}
              className={`flex flex-col items-start gap-1.5 rounded-xl border px-4 py-4 text-left transition-all duration-150 ${
                form.channel === value
                  ? "border-amber-400/50 bg-amber-400/5 text-white"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-zinc-500 leading-snug">{hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contact info — conditional */}
      {(needsEmail || needsSms) && (
        <div className="space-y-4">
          {needsEmail && (
            <div>
              <label className={LABEL}>
                Email address <span className="text-amber-500">*</span>
              </label>
              <input
                type="email"
                className={`${INPUT} ${errors.email ? INPUT_ERR : ""}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
              {errors.email && <p className={ERR}>{errors.email}</p>}
            </div>
          )}
          {needsSms && (
            <div>
              <label className={LABEL}>
                Phone number <span className="text-amber-500">*</span>
              </label>
              <input
                type="tel"
                className={`${INPUT} ${errors.phone ? INPUT_ERR : ""}`}
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                autoComplete="tel"
              />
              {errors.phone && <p className={ERR}>{errors.phone}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Preview & Confirm ────────────────────────────────────────────────

function PreviewStep({
  sections,
  delivery,
}: {
  sections: WizardSection[];
  delivery: DeliveryForm;
}) {
  const dayNames = Array.from(delivery.days)
    .sort()
    .map((d) => DAY_LABELS[d])
    .join(", ");
  const channelLabel = {
    email: "Email",
    sms: "SMS",
    both: "Email + SMS",
  }[delivery.channel];

  const tzShort =
    delivery.timezone.split("/")[1]?.replace(/_/g, " ") ?? delivery.timezone;

  const deliverySummary = [
    {
      label: "Sends at",
      value: `${fmt12(delivery.time)}${tzShort ? ` · ${tzShort}` : ""}`,
    },
    { label: "Days", value: dayNames || "—" },
    { label: "Channel", value: channelLabel },
    ...(delivery.email ? [{ label: "Email", value: delivery.email }] : []),
    ...(delivery.phone ? [{ label: "Phone", value: delivery.phone }] : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Looks good?</h2>
        <p className="text-sm text-zinc-400">
          Review your digest below, then launch when you&apos;re ready.
        </p>
      </div>

      {/* Digest preview card */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        {/* Mock email header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="text-amber-400 text-[10px]">●</span>
            <span>Briefd · Daily Digest</span>
            <span className="ml-auto">{fmt12(delivery.time)}</span>
          </div>
          <p className="text-sm font-semibold text-white">
            Good morning — here&apos;s your briefing
          </p>
        </div>

        {/* Section previews */}
        <div className="divide-y divide-zinc-800/50 bg-zinc-900/40">
          {sections.map((s, i) => (
            <div key={s.id} className="flex items-start gap-4 px-6 py-4">
              <span className="flex-shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-amber-400/70">
                <SectionIcon kind={s.kind} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white leading-snug">
                  {s.title}
                </p>
                {s.source && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Source: {s.source}
                  </p>
                )}
                {s.instructions && (
                  <p className="text-xs text-zinc-600 mt-0.5 italic leading-snug">
                    &ldquo;{s.instructions}&rdquo;
                  </p>
                )}
                {/* Mock content bar */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="h-2 rounded-full bg-zinc-800 w-4/5" />
                  <div className="h-2 rounded-full bg-zinc-800 w-3/5" />
                </div>
              </div>
              <span className="ml-auto text-xs text-zinc-700 shrink-0">
                #{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-5">
        <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-4">
          Delivery summary
        </p>
        <dl className="space-y-3">
          {deliverySummary.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-zinc-500 shrink-0">{label}</dt>
              <dd className="text-zinc-200 text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map(({ n, label }, idx) => {
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-0">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors duration-200 ${
                  done
                    ? "bg-amber-400 text-zinc-900"
                    : active
                    ? "border-2 border-amber-400 text-amber-400 bg-transparent"
                    : "border border-zinc-700 text-zinc-600 bg-transparent"
                }`}
              >
                {done ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  active ? "text-amber-400" : done ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`h-px w-16 sm:w-24 mb-5 mx-2 transition-colors duration-300 ${
                  n < current ? "bg-amber-400/50" : "bg-zinc-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ deliveryTime }: { deliveryTime: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-400/10 text-amber-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">You&apos;re all set.</h2>
        <p className="text-zinc-400 max-w-sm">
          Your first digest will arrive at{" "}
          <span className="text-amber-400 font-medium">{fmt12(deliveryTime)}</span>{" "}
          tomorrow morning. We&apos;ll handle the rest.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-400 text-zinc-900 font-semibold text-sm px-7 py-3 hover:bg-amber-300 transition-colors duration-150"
      >
        Go to dashboard
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<StepErrors>({});

  const [sections, setSections] = useState<WizardSection[]>([]);
  const [delivery, setDelivery] = useState<DeliveryForm>({
    time: "07:00",
    timezone: "America/New_York",
    channel: "email",
    email: "",
    phone: "",
    days: new Set([1, 2, 3, 4, 5]), // Mon–Fri
  });

  function advance() {
    let errs: StepErrors = {};
    if (step === 1) errs = validateStep1(sections);
    if (step === 2) errs = validateStep2(delivery);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      setTimeout(() => {
        document.querySelector("[data-error]")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
      return;
    }

    setErrors({});
    setStep((s) => s + 1);
  }

  function retreat() {
    setErrors({});
    setStep((s) => s - 1);
  }

  function confirm() {
    // No real API yet — simulate submit
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#0c0c0e] font-[family-name:var(--font-geist-sans)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10 max-w-3xl mx-auto">
        <Link href="/" className="text-base font-semibold tracking-tight">
          <span className="text-amber-400">●</span>
          <span className="ml-2 text-white">Briefd</span>
        </Link>
        {!submitted && (
          <span className="text-xs text-zinc-600">
            Step {step} of {STEPS.length}
          </span>
        )}
      </nav>

      {/* Wizard card */}
      <main className="px-6 py-8 sm:px-10 pb-24 max-w-3xl mx-auto">
        {submitted ? (
          <SuccessScreen deliveryTime={delivery.time} />
        ) : (
          <>
            <StepIndicator current={step} />

            {/* Step content */}
            <div>
              {step === 1 && (
                <SectionsStep
                  sections={sections}
                  setSections={setSections}
                  errors={errors}
                />
              )}
              {step === 2 && (
                <DeliveryStep
                  form={delivery}
                  setForm={setDelivery}
                  errors={errors}
                />
              )}
              {step === 3 && (
                <PreviewStep sections={sections} delivery={delivery} />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-zinc-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={retreat}
                  className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <Link
                  href="/"
                  className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  ← Home
                </Link>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={advance}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 text-zinc-900 font-semibold text-sm px-7 py-2.5 hover:bg-amber-300 active:bg-amber-500 transition-colors duration-150"
                >
                  Continue
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={confirm}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 text-zinc-900 font-semibold text-sm px-7 py-2.5 hover:bg-amber-300 active:bg-amber-500 transition-colors duration-150"
                >
                  Launch Briefd
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
