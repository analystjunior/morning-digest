"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Check, Plus, Trash2,
  Mail, MessageSquare, Clock, ChevronDown, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "@/lib/store";
import { DigestSection, SectionType, DeliveryChannel } from "@/lib/types";
import {
  SECTION_EMOJIS, SECTION_LABELS, TIMEZONES, cn, generateId,
  isValidEmail, isValidPhone,
} from "@/lib/utils";
import { DIGEST_TEMPLATES } from "@/lib/mock-data";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "welcome", label: "You" },
  { id: "topics", label: "Topics" },
  { id: "delivery", label: "Delivery" },
  { id: "review", label: "Review" },
];

const SECTION_TYPES: SectionType[] = [
  "news", "sports", "finance", "weather", "quote", "custom",
];

const DEFAULT_TITLES: Record<SectionType, string> = {
  news:          "Morning Headlines",
  sports:        "Sports News",
  finance:       "Market Snapshot",
  social:        "Social Feed",
  technology:    "Tech News",
  entertainment: "Entertainment",
  weather:       "Today's Weather",
  quote:         "Quote of the Day",
  custom:        "Custom Section",
};

// ─── Shared style tokens ──────────────────────────────────────────────────────

const BG = "#E8E6DF";
const DARK = "#1a1a1a";
const BORDER = "#d4d0c8";
const MUTED = "#888";
const SECONDARY = "#555";
const CARD_BG = "white";

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

const btnPrimary: React.CSSProperties = {
  backgroundColor: DARK,
  color: BG,
  borderRadius: "3px",
  width: "100%",
  padding: "12px",
  fontSize: "14px",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  cursor: "pointer",
  border: "none",
};

const btnSecondary: React.CSSProperties = {
  backgroundColor: CARD_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: "3px",
  width: "100%",
  padding: "12px",
  fontSize: "14px",
  fontWeight: 500,
  color: DARK,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  cursor: "pointer",
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: string }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
              style={
                i < idx
                  ? { backgroundColor: DARK, color: "white" }
                  : i === idx
                  ? { backgroundColor: "transparent", color: DARK, border: `2px solid ${DARK}` }
                  : { backgroundColor: "#d4d0c8", color: MUTED }
              }
            >
              {i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className="text-[10px] font-medium"
              style={{ color: i === idx ? DARK : "#bbb" }}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="mx-2 mb-4 h-px w-8 transition-all"
              style={{ backgroundColor: i < idx ? DARK : "#d4d0c8" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  onUpdate,
  onRemove,
  index,
}: {
  section: DigestSection;
  onUpdate: (s: DigestSection) => void;
  onRemove: () => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  const handleTypeChange = (t: SectionType) => {
    // Auto-fill title only if it's empty or still the default for the current type
    const isDefaultTitle = !section.title.trim() || section.title === DEFAULT_TITLES[section.type];
    onUpdate({
      ...section,
      type: t,
      title: isDefaultTitle ? DEFAULT_TITLES[t] : section.title,
    });
  };

  const displayTitle = section.title.trim() || DEFAULT_TITLES[section.type];

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Header row — always visible */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Left: toggle expand */}
        <button
          type="button"
          className="flex flex-1 items-center gap-3 text-left min-w-0"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="text-lg shrink-0">{SECTION_EMOJIS[section.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" style={{ color: DARK }}>{displayTitle}</p>
            <p className="text-xs" style={{ color: MUTED }}>{SECTION_LABELS[section.type]}</p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
            style={{ color: "#aaa" }}
          />
        </button>

        {/* Right: delete — always visible */}
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-red-50"
          style={{ color: "#c0392b", border: `1px solid #f5c6c6`, borderRadius: "4px" }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="space-y-4 px-4 pb-4" style={{ borderTop: `1px solid #ece9e2` }}>
          <div className="pt-4">
            {/* Content type selector — always shown and always changeable */}
            <label style={labelStyle}>Content type</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-all rounded"
                  style={
                    section.type === t
                      ? { backgroundColor: DARK, color: BG, border: `1px solid ${DARK}` }
                      : { backgroundColor: CARD_BG, color: SECONDARY, border: `1px solid ${BORDER}` }
                  }
                >
                  {SECTION_EMOJIS[t]} {SECTION_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>
              Section title <span style={{ color: "#bbb", fontWeight: 400 }}>(optional — auto-filled above)</span>
            </label>
            <input
              style={inputStyle}
              className="rounded"
              placeholder={DEFAULT_TITLES[section.type]}
              value={section.title}
              onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            />
          </div>

          {/* Instructions */}
          <div>
            <label style={labelStyle}>
              Instructions <span style={{ color: "#bbb", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="w-full rounded resize-none"
              rows={2}
              style={{ ...inputStyle, height: "auto" }}
              placeholder="e.g. Focus on my team only, skip trade rumors"
              value={section.prompt ?? ""}
              onChange={(e) => onUpdate({ ...section, prompt: e.target.value })}
            />
          </div>

          {/* Sources */}
          <div>
            <label style={labelStyle}>
              Preferred sources <span style={{ color: "#bbb", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              style={inputStyle}
              className="rounded"
              placeholder="e.g. ESPN, The Athletic, WSJ"
              value={(section.sources ?? []).join(", ")}
              onChange={(e) =>
                onUpdate({
                  ...section,
                  sources: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
            <p className="mt-1 text-[11px]" style={{ color: "#bbb" }}>Separate multiple with commas</p>
          </div>

          {/* Mode */}
          <div>
            <label style={labelStyle}>Detail level</label>
            <div className="flex gap-2">
              {(["brief", "detailed"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onUpdate({ ...section, mode: m })}
                  className="flex-1 rounded py-2 text-xs font-medium transition-all"
                  style={
                    section.mode === m
                      ? { backgroundColor: DARK, color: BG, border: `1px solid ${DARK}` }
                      : { backgroundColor: CARD_BG, color: SECONDARY, border: `1px solid ${BORDER}` }
                  }
                >
                  {m === "brief" ? "Brief (2–3 bullets)" : "Detailed (5+ bullets)"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");

  const { onboarding, updateOnboarding, setOnboardingStep, completeOnboarding } = useAppStore();
  const { step, name, sections, delivery } = onboarding;

  useEffect(() => {
    if (templateId && sections.length === 0) {
      const template = DIGEST_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        const loaded = template.sections.map((s, i) => ({ ...s, id: generateId(), order: i }));
        updateOnboarding({ sections: loaded, templateId });
      }
    }
  }, [templateId]);

  // ── Welcome ────────────────────────────────────────────────────────────────
  const [nameInput, setNameInput] = useState(name || "");
  const [emailInput, setEmailInput] = useState(delivery.email || "");
  const [phoneInput, setPhoneInput] = useState(delivery.phone || "");
  const [channels, setChannels] = useState<DeliveryChannel[]>(delivery.channels || ["email"]);

  const toggleChannel = (ch: DeliveryChannel) =>
    setChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);

  const handleWelcomeNext = () => {
    if (!nameInput.trim()) { toast.error("Please enter your name"); return; }
    if (channels.includes("email") && emailInput && !isValidEmail(emailInput)) {
      toast.error("Please enter a valid email address"); return;
    }
    if (channels.includes("sms") && phoneInput && !isValidPhone(phoneInput)) {
      toast.error("Please enter a valid phone number"); return;
    }
    if (channels.length === 0) { toast.error("Please select at least one delivery channel"); return; }
    updateOnboarding({ name: nameInput.trim(), delivery: { ...delivery, email: emailInput, phone: phoneInput, channels } });
    setOnboardingStep("topics");
  };

  // ── Topics ─────────────────────────────────────────────────────────────────
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const applyTemplate = (templateId: string, mode: "replace" | "add") => {
    const template = DIGEST_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const loaded = template.sections.map((s, i) => ({
      ...s, id: generateId(), order: (mode === "add" ? sections.length : 0) + i,
    }));
    updateOnboarding({
      sections: mode === "replace" ? loaded : [...sections, ...loaded],
      templateId,
    });
    setPreviewTemplateId(null);
    toast.success(
      mode === "replace"
        ? `Applied "${template.name}" template`
        : `Added "${template.name}" sections`
    );
  };

  const addSection = () => {
    updateOnboarding({
      sections: [
        ...sections,
        {
          id: generateId(),
          title: DEFAULT_TITLES["news"],
          type: "news",
          order: sections.length,
          enabled: true,
          mode: "brief",
        },
      ],
    });
  };

  const updateSection = (id: string, updated: DigestSection) =>
    updateOnboarding({ sections: sections.map((s) => (s.id === id ? updated : s)) });

  const removeSection = (id: string) =>
    updateOnboarding({ sections: sections.filter((s) => s.id !== id) });

  // Only requires at least one section — no title check
  const handleTopicsNext = () => {
    if (sections.length === 0) { toast.error("Add at least one section to your digest"); return; }
    setOnboardingStep("delivery");
  };

  // ── Delivery ───────────────────────────────────────────────────────────────
  const [deliveryTime, setDeliveryTime] = useState(delivery.time || "07:00");
  const [timezone, setTimezone] = useState(delivery.timezone || "America/New_York");

  const handleDeliveryNext = () => {
    updateOnboarding({ delivery: { ...delivery, time: deliveryTime, timezone } });
    setOnboardingStep("review");
  };

  // ── Review → Submit ────────────────────────────────────────────────────────
  const handleSubmit = () => {
    completeOnboarding();
    toast.success("Your digest is live!");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(232,230,223,0.95)", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
          >
            The Paper Route
          </Link>
          <StepIndicator current={step} />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">

        {/* ── STEP: Welcome ── */}
        {step === "welcome" && (
          <div className="animate-in space-y-6">
            <div>
              <h1
                className="mb-2 text-2xl font-bold"
                style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
              >
                Let&apos;s get to know you
              </h1>
              <p className="text-sm" style={{ color: "#666" }}>
                We&apos;ll use this to personalize your digest and know where to send it.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Your name *</label>
              <input
                style={inputStyle}
                className="rounded"
                placeholder="Alex Morgan"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWelcomeNext()}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, marginBottom: "12px" }}>
                How do you want to receive your digest? *
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["email", "sms"] as DeliveryChannel[]).map((ch) => {
                  const active = channels.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className="flex items-start gap-3 rounded-lg p-4 text-left transition-all"
                      style={{
                        backgroundColor: active ? DARK : CARD_BG,
                        border: `1px solid ${active ? DARK : BORDER}`,
                      }}
                    >
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: active ? "rgba(255,255,255,0.1)" : "#f5f3ee" }}
                      >
                        {ch === "email"
                          ? <Mail className="h-4 w-4" style={{ color: active ? "white" : SECONDARY }} />
                          : <MessageSquare className="h-4 w-4" style={{ color: active ? "white" : SECONDARY }} />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: active ? "white" : DARK }}>
                          {ch === "email" ? "Email" : "SMS / Text"}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: active ? "rgba(255,255,255,0.55)" : MUTED }}>
                          {ch === "email" ? "Beautifully formatted email" : "Quick text to your phone"}
                        </p>
                      </div>
                      {active && <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "white" }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {channels.includes("email") && (
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  style={inputStyle}
                  className="rounded"
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
            )}

            {channels.includes("sms") && (
              <div>
                <label style={labelStyle}>Phone number</label>
                <input
                  style={inputStyle}
                  className="rounded"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
                <p className="mt-1 text-[11px]" style={{ color: "#bbb" }}>Standard messaging rates may apply</p>
              </div>
            )}

            <button onClick={handleWelcomeNext} style={btnPrimary} className="transition-opacity hover:opacity-80">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP: Topics ── */}
        {step === "topics" && (
          <div className="animate-in space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="mb-1 text-2xl font-bold"
                  style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
                >
                  Build your digest
                </h1>
                <p className="text-sm" style={{ color: "#666" }}>
                  Add the sections you want in your morning briefing.
                </p>
              </div>
              <button
                onClick={() => setOnboardingStep("welcome")}
                className="mt-1 flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
                style={{ color: SECONDARY }}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>

            {/* Template quickstart */}
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
            >
              <p
                className="mb-3 flex items-center gap-1.5 text-xs font-medium"
                style={{ color: SECONDARY }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Start from a template
              </p>

              {/* Template tiles */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DIGEST_TEMPLATES.map((t) => {
                  const active = previewTemplateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreviewTemplateId(active ? null : t.id)}
                      className="flex items-center gap-2 rounded p-2.5 text-left text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? DARK : "#f5f3ee",
                        border: `1px solid ${active ? DARK : "#e0ddd6"}`,
                        color: active ? BG : DARK,
                      }}
                    >
                      <span className="text-base">{t.emoji}</span>
                      {t.name}
                    </button>
                  );
                })}
              </div>

              {/* Inline preview panel */}
              {previewTemplateId && (() => {
                const t = DIGEST_TEMPLATES.find((t) => t.id === previewTemplateId)!;
                const hasExisting = sections.length > 0;
                return (
                  <div className="mt-3 rounded-lg p-3 space-y-3" style={{ backgroundColor: "#f5f3ee", border: `1px solid #e0ddd6` }}>
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: DARK }}>{t.emoji} {t.name}</p>
                      <p className="text-xs" style={{ color: MUTED }}>{t.description}</p>
                    </div>

                    {/* Section list preview */}
                    <div className="space-y-1.5">
                      {t.sections.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm">{SECTION_EMOJIS[s.type]}</span>
                          <span className="text-xs" style={{ color: SECONDARY }}>{s.title}</span>
                          <span
                            className="ml-auto text-[10px] rounded px-1.5 py-0.5"
                            style={{ backgroundColor: "#e8e5de", color: MUTED }}
                          >
                            {s.mode}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Apply actions */}
                    {hasExisting ? (
                      <div className="pt-1 space-y-2">
                        <p className="text-xs font-medium" style={{ color: SECONDARY }}>
                          You already have sections — what would you like to do?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => applyTemplate(t.id, "replace")}
                            className="flex-1 rounded py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ backgroundColor: DARK, color: BG, border: `1px solid ${DARK}` }}
                          >
                            Replace existing
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTemplate(t.id, "add")}
                            className="flex-1 rounded py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                            style={{ backgroundColor: CARD_BG, color: DARK, border: `1px solid ${BORDER}` }}
                          >
                            Add to existing
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => applyTemplate(t.id, "replace")}
                        className="w-full rounded py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: DARK, color: BG, border: `1px solid ${DARK}` }}
                      >
                        Use this template
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Section list */}
            {sections.length > 0 && (
              <div className="space-y-3">
                {sections.map((s, i) => (
                  <SectionCard
                    key={s.id}
                    section={s}
                    index={i}
                    onUpdate={(updated) => updateSection(s.id, updated)}
                    onRemove={() => removeSection(s.id)}
                  />
                ))}
              </div>
            )}

            {/* Add section — prominent primary button */}
            <button
              type="button"
              onClick={addSection}
              style={btnPrimary}
              className="transition-opacity hover:opacity-80"
            >
              <Plus className="h-4 w-4" /> Add section
            </button>

            {/* Continue — secondary, only shown once there's a section */}
            {sections.length > 0 && (
              <button
                onClick={handleTopicsNext}
                style={btnSecondary}
                className="transition-opacity hover:opacity-70"
              >
                Continue to delivery <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* ── STEP: Delivery ── */}
        {step === "delivery" && (
          <div className="animate-in space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="mb-1 text-2xl font-bold"
                  style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
                >
                  When should we send it?
                </h1>
                <p className="text-sm" style={{ color: "#666" }}>
                  Pick the time your digest hits your inbox each morning.
                </p>
              </div>
              <button
                onClick={() => setOnboardingStep("topics")}
                className="mt-1 flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
                style={{ color: SECONDARY }}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>

            <div>
              <label style={labelStyle}>
                <Clock className="inline mr-1.5 h-3.5 w-3.5" />
                Delivery time *
              </label>
              <input
                type="time"
                style={inputStyle}
                className="rounded"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
              <p className="mt-1.5 text-[11px]" style={{ color: "#bbb" }}>
                Your digest will be generated and sent at this time every morning
              </p>
            </div>

            <div>
              <label style={labelStyle}>Timezone *</label>
              <div className="relative">
                <select
                  className="w-full cursor-pointer appearance-none rounded"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: MUTED }}
                />
              </div>
            </div>

            {/* Channel reminder */}
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
            >
              <p className="mb-2 text-xs font-medium" style={{ color: SECONDARY }}>Delivering to</p>
              <div className="flex flex-wrap gap-2">
                {delivery.channels.map((ch) => (
                  <span
                    key={ch}
                    className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: "#f5f3ee", border: `1px solid #e0ddd6`, color: "#333" }}
                  >
                    {ch === "email" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                    {ch === "email" ? (delivery.email || "Email") : (delivery.phone || "SMS")}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleDeliveryNext}
              style={btnPrimary}
              className="transition-opacity hover:opacity-80"
            >
              Review my digest <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP: Review ── */}
        {step === "review" && (
          <div className="animate-in space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="mb-1 text-2xl font-bold"
                  style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
                >
                  Looks good, {onboarding.name.split(" ")[0]}?
                </h1>
                <p className="text-sm" style={{ color: "#666" }}>Review your digest setup before we go live.</p>
              </div>
              <button
                onClick={() => setOnboardingStep("delivery")}
                className="mt-1 flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
                style={{ color: SECONDARY }}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </div>

            {/* Sections summary */}
            <div
              className="rounded-lg p-5 space-y-3"
              style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: DARK }}>Your sections</h3>
                <button
                  onClick={() => setOnboardingStep("topics")}
                  className="text-xs transition-opacity hover:opacity-60"
                  style={{ color: SECONDARY }}
                >
                  Edit
                </button>
              </div>
              {sections.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-base">{SECTION_EMOJIS[s.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm" style={{ color: DARK }}>
                      {s.title.trim() || DEFAULT_TITLES[s.type]}
                    </p>
                    {s.sources && s.sources.length > 0 && (
                      <p className="text-xs" style={{ color: MUTED }}>Sources: {s.sources.join(", ")}</p>
                    )}
                  </div>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "#f5f3ee", border: `1px solid #e0ddd6`, color: SECONDARY }}
                  >
                    {s.mode}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery summary */}
            <div
              className="rounded-lg p-5 space-y-3"
              style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: DARK }}>Delivery settings</h3>
                <button
                  onClick={() => setOnboardingStep("delivery")}
                  className="text-xs transition-opacity hover:opacity-60"
                  style={{ color: SECONDARY }}
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs" style={{ color: MUTED }}>Time</p>
                  <p className="font-medium" style={{ color: DARK }}>{delivery.time}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: MUTED }}>Timezone</p>
                  <p className="font-medium" style={{ color: DARK }}>
                    {TIMEZONES.find((t) => t.value === delivery.timezone)?.label ?? delivery.timezone}
                  </p>
                </div>
                {delivery.email && (
                  <div>
                    <p className="text-xs" style={{ color: MUTED }}>Email</p>
                    <p className="truncate font-medium" style={{ color: DARK }}>{delivery.email}</p>
                  </div>
                )}
                {delivery.phone && (
                  <div>
                    <p className="text-xs" style={{ color: MUTED }}>SMS</p>
                    <p className="font-medium" style={{ color: DARK }}>{delivery.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              style={btnPrimary}
              className="transition-opacity hover:opacity-80"
            >
              Launch my digest
            </button>
            <p className="text-center text-xs" style={{ color: "#bbb" }}>
              You can edit everything at any time from your dashboard
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG }}>
          <p className="text-sm" style={{ color: MUTED }}>Loading...</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
