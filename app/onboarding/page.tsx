"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Check, Plus, Trash2,
  Mail, MessageSquare, Clock, ChevronDown, GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "@/lib/store";
import { DigestSection, SectionType, DeliveryChannel } from "@/lib/types";
import {
  SECTION_EMOJIS, SECTION_LABELS, TIMEZONES, cn, generateId,
  isValidEmail, isValidPhone, DEFAULT_CONFIG,
} from "@/lib/utils";
import { SectionConfig } from "@/components/ui/SectionConfig";
import Toggle from "@/components/ui/Toggle";
import { createClient } from "@/lib/supabase/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "welcome", label: "You" },
  { id: "topics", label: "Topics" },
  { id: "delivery", label: "Delivery" },
  { id: "review", label: "Review" },
];

const SECTION_TYPES: SectionType[] = [
  "weather", "news", "sports", "finance", "crypto", "quote",
];

const DEFAULT_TITLES: Record<SectionType, string> = {
  weather:       "Today's Weather",
  news:          "Morning Headlines",
  sports:        "Sports News",
  finance:       "Market Snapshot",
  crypto:        "Crypto Prices",
  quote:         "Quote of the Day",
  custom:        "Custom Section",
  social:        "Social Feed",
  technology:    "Tech News",
  entertainment: "Entertainment",
};

// ─── Shared style tokens ──────────────────────────────────────────────────────

const BG       = "#E8E6DF";
const DARK     = "#1a1a1a";
const BORDER   = "#d4d0c8";
const MUTED    = "#888";
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
            <span className="text-[10px] font-medium" style={{ color: i === idx ? DARK : "#bbb" }}>
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
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  section: DigestSection;
  onUpdate: (s: DigestSection) => void;
  onRemove: () => void;
  index: number;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleTypeChange = (t: SectionType) => {
    const isDefaultTitle = !section.title.trim() || section.title === DEFAULT_TITLES[section.type];
    onUpdate({
      ...section,
      type: t,
      title: isDefaultTitle ? DEFAULT_TITLES[t] : section.title,
      config: DEFAULT_CONFIG[t] ?? {},
      prompt: undefined,
    });
  };

  const displayTitle = section.title.trim() || DEFAULT_TITLES[section.type];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="overflow-hidden rounded-lg transition-all"
      style={{
        backgroundColor: CARD_BG,
        border: isDragOver ? `1px solid ${DARK}` : `1px solid ${BORDER}`,
        opacity: section.enabled ? 1 : 0.55,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-3">
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab" style={{ color: "#ccc" }} />

        {/* Expand toggle */}
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left min-w-0"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="text-lg shrink-0">{SECTION_EMOJIS[section.type]}</span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium"
              style={{ color: section.enabled ? DARK : MUTED }}
            >
              {displayTitle}
            </p>
            <p className="text-xs" style={{ color: "#bbb" }}>{SECTION_LABELS[section.type]}</p>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
            style={{ color: "#aaa" }}
          />
        </button>

        {/* Enable/disable toggle */}
        <Toggle
          size="sm"
          checked={section.enabled}
          onChange={(v) => onUpdate({ ...section, enabled: v })}
        />

        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-1.5 transition-colors hover:bg-red-50"
          style={{ color: "#c0392b" }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="space-y-4 px-4 pb-4" style={{ borderTop: `1px solid #ece9e2` }}>
          <div className="pt-4">
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

          <div>
            <label style={labelStyle}>
              Section title{" "}
              <span style={{ color: "#bbb", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              style={inputStyle}
              className="rounded"
              placeholder={DEFAULT_TITLES[section.type]}
              value={section.title}
              onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            />
          </div>

          <SectionConfig section={section} onUpdate={onUpdate} />
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
  const authError = searchParams.get("error");

  const { onboarding, updateOnboarding, setOnboardingStep, completeOnboarding } = useAppStore();
  const { step, name, sections, delivery } = onboarding;

  // On mount: if the user has already verified their magic link and we have a
  // session, skip the welcome/verify steps and jump to topic selection.
  // If they have an existing digest profile, they're a returning user — send
  // them straight to the dashboard.
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("digest_profiles")
        .select("id")
        .maybeSingle();

      if (profile) {
        router.replace("/dashboard");
      } else if (step === "welcome") {
        setOnboardingStep("topics");
      }
    };
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Legacy template deep-link support (keeps existing URLs working)
  useEffect(() => {
    if (templateId && sections.length === 0) {
      // No-op: templates removed from UI but deep-links shouldn't crash
    }
  }, [templateId]);

  // ── Welcome ────────────────────────────────────────────────────────────────
  const [nameInput, setNameInput] = useState(name || "");
  const [emailInput, setEmailInput] = useState(delivery.email || "");
  const [phoneInput, setPhoneInput] = useState(delivery.phone || "");
  const [channels, setChannels] = useState<DeliveryChannel[]>(delivery.channels || ["email"]);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const toggleChannel = (ch: DeliveryChannel) =>
    setChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);

  const handleWelcomeNext = async () => {
    if (!nameInput.trim()) { toast.error("Please enter your name"); return; }
    if (!emailInput || !isValidEmail(emailInput)) {
      toast.error("Please enter a valid email address"); return;
    }
    if (channels.includes("sms") && phoneInput && !isValidPhone(phoneInput)) {
      toast.error("Please enter a valid phone number"); return;
    }
    if (channels.length === 0) { toast.error("Please select at least one delivery channel"); return; }

    // Commit to store first so the data survives the magic-link redirect.
    updateOnboarding({ name: nameInput.trim(), delivery: { ...delivery, email: emailInput, phone: phoneInput, channels } });

    setSendingOtp(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: { full_name: nameInput.trim() },
        },
      });
      if (error) throw error;
      setOtpSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send magic link. Try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Topics ─────────────────────────────────────────────────────────────────
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const reordered = [...sections];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(toIdx, 0, moved);
    updateOnboarding({ sections: reordered.map((s, i) => ({ ...s, order: i })) });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const addSection = () => {
    updateOnboarding({
      sections: [
        ...sections,
        {
          id: generateId(),
          title: DEFAULT_TITLES["news"],
          type: "news",
          config: DEFAULT_CONFIG["news"],
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

  const handleTopicsNext = () => {
    const hasEnabled = sections.some((s) => s.enabled);
    if (!hasEnabled) { toast.error("Enable at least one section for your digest"); return; }
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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { name: onboarding.name, email: onboarding.delivery.email, timezone: onboarding.delivery.timezone },
          subscription: {
            name: "My Morning Digest",
            sections: onboarding.sections,
            delivery: onboarding.delivery,
            status: "active",
          },
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to save preferences");
      }

      completeOnboarding();
      toast.success("Your digest is live!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
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
        {step === "welcome" && !otpSent && (
          <div className="animate-in space-y-6">
            {authError && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
              >
                The magic link expired or was invalid. Enter your email below to get a new one.
              </div>
            )}

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
              <label style={labelStyle}>Email address *</label>
              <input
                style={inputStyle}
                className="rounded"
                type="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleWelcomeNext()}
              />
              <p className="mt-1.5 text-[11px]" style={{ color: "#bbb" }}>
                We&apos;ll send a magic link to verify your email — no password needed.
              </p>
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

            <button
              onClick={handleWelcomeNext}
              disabled={sendingOtp}
              style={btnPrimary}
              className="transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingOtp ? "Sending link…" : "Continue"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP: Magic link sent ── */}
        {step === "welcome" && otpSent && (
          <div className="animate-in space-y-6">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: DARK }}
            >
              <Mail className="h-6 w-6" style={{ color: BG }} />
            </div>
            <div>
              <h1
                className="mb-2 text-2xl font-bold"
                style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
              >
                Check your inbox
              </h1>
              <p className="text-sm" style={{ color: "#555" }}>
                We sent a magic link to{" "}
                <span className="font-medium" style={{ color: DARK }}>{emailInput}</span>.
                Click it to verify your email and continue building your digest.
              </p>
            </div>
            <p className="text-xs" style={{ color: "#bbb" }}>
              The link expires in 1 hour. If you don&apos;t see it, check your spam folder.
            </p>
            <button
              onClick={() => setOtpSent(false)}
              className="text-sm transition-opacity hover:opacity-60"
              style={{ color: SECONDARY }}
            >
              ← Use a different email
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
                  Toggle sections on or off. Expand any section to configure it.
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

            {/* Section list */}
            <div className="space-y-2">
              {sections.map((s, i) => (
                <SectionCard
                  key={s.id}
                  section={s}
                  index={i}
                  isDragOver={dragOverIdx === i && dragIdx !== i}
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  onUpdate={(updated) => updateSection(s.id, updated)}
                  onRemove={() => removeSection(s.id)}
                />
              ))}
            </div>

            {/* Add section */}
            <button
              type="button"
              onClick={addSection}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ border: `1px dashed ${BORDER}`, color: SECONDARY, backgroundColor: "transparent" }}
            >
              <Plus className="h-4 w-4" /> Add section
            </button>

            <button
              onClick={handleTopicsNext}
              style={btnPrimary}
              className="transition-opacity hover:opacity-80"
            >
              Continue to delivery <ArrowRight className="h-4 w-4" />
            </button>
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
                <div
                  key={s.id}
                  className="flex items-center gap-3"
                  style={{ opacity: s.enabled ? 1 : 0.45 }}
                >
                  <span className="text-base">{SECTION_EMOJIS[s.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm" style={{ color: DARK }}>
                      {s.title.trim() || DEFAULT_TITLES[s.type]}
                    </p>
                  </div>
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: s.enabled ? "#f5f3ee" : "#ece9e2",
                      border: `1px solid #e0ddd6`,
                      color: s.enabled ? SECONDARY : MUTED,
                    }}
                  >
                    {s.enabled ? "on" : "off"}
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
              disabled={submitting}
              style={btnPrimary}
              className="transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving…" : "Launch my digest"}
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
