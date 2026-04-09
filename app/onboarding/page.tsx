"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sun, ArrowRight, ArrowLeft, Check, Plus, Trash2,
  Mail, MessageSquare, Clock, ChevronDown, GripVertical,
  Sparkles, X
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "@/lib/store";
import { DigestSection, SectionType, DeliveryChannel } from "@/lib/types";
import {
  SECTION_EMOJIS, SECTION_LABELS, TIMEZONES, cn, generateId,
  isValidEmail, isValidPhone
} from "@/lib/utils";
import { DIGEST_TEMPLATES } from "@/lib/mock-data";

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { id: "welcome", label: "You" },
  { id: "topics", label: "Topics" },
  { id: "delivery", label: "Delivery" },
  { id: "review", label: "Review" },
];

function StepIndicator({ current }: { current: string }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                i < idx
                  ? "bg-brand-500 text-surface-0"
                  : i === idx
                  ? "bg-brand-500/20 text-brand-400 ring-2 ring-brand-500/40"
                  : "bg-surface-3 text-white/20"
              )}
            >
              {i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn("text-[10px] font-medium", i === idx ? "text-brand-400" : "text-white/25")}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn("mx-2 mb-4 h-px w-8 transition-all", i < idx ? "bg-brand-500/60" : "bg-surface-4")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Section type picker ──────────────────────────────────────────────────────
const SECTION_TYPES: SectionType[] = [
  "news", "sports", "finance", "social", "technology",
  "entertainment", "weather", "quote", "custom",
];

function TypeBadge({ type, selected, onClick }: { type: SectionType; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
        selected
          ? "border-brand-500/40 bg-brand-500/15 text-brand-400"
          : "border-white/[0.07] bg-surface-3 text-white/40 hover:border-white/15 hover:text-white/70"
      )}
    >
      <span>{SECTION_EMOJIS[type]}</span>
      {SECTION_LABELS[type]}
    </button>
  );
}

// ─── A single section editor card ────────────────────────────────────────────
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

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-surface-2 overflow-hidden">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-3 p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <GripVertical className="h-4 w-4 text-white/20 shrink-0 cursor-grab" />
        <span className="text-lg">{SECTION_EMOJIS[section.type]}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/90">
            {section.title || "Untitled section"}
          </p>
          <p className="text-xs text-white/30">{SECTION_LABELS[section.type]}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("badge", section.enabled ? "badge-green" : "badge-neutral")}>
            {section.enabled ? "On" : "Off"}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-white/30 transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-white/[0.05] p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">Section title *</label>
            <input
              className="input"
              placeholder="e.g. Lakers News, Pre-Market Movers, Quote of the Day"
              value={section.title}
              onChange={(e) => onUpdate({ ...section, title: e.target.value })}
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-2 block text-xs font-medium text-white/50">Content type</label>
            <div className="flex flex-wrap gap-2">
              {SECTION_TYPES.map((t) => (
                <TypeBadge
                  key={t}
                  type={t}
                  selected={section.type === t}
                  onClick={() => onUpdate({ ...section, type: t })}
                />
              ))}
            </div>
          </div>

          {/* Prompt / instructions */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Instructions <span className="text-white/25">(optional)</span>
            </label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="e.g. Latest score, top performer, injury report for my team only"
              value={section.prompt ?? ""}
              onChange={(e) => onUpdate({ ...section, prompt: e.target.value })}
            />
          </div>

          {/* Sources */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              Preferred sources <span className="text-white/25">(optional)</span>
            </label>
            <input
              className="input"
              placeholder="e.g. ESPN, The Athletic, WSJ"
              value={(section.sources ?? []).join(", ")}
              onChange={(e) =>
                onUpdate({
                  ...section,
                  sources: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
            />
            <p className="mt-1 text-[11px] text-white/25">Separate multiple sources with commas</p>
          </div>

          {/* Mode */}
          <div>
            <label className="mb-2 block text-xs font-medium text-white/50">Detail level</label>
            <div className="flex gap-2">
              {(["brief", "detailed"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onUpdate({ ...section, mode: m })}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-xs font-medium transition-all capitalize",
                    section.mode === m
                      ? "border-brand-500/40 bg-brand-500/15 text-brand-400"
                      : "border-white/[0.07] bg-surface-3 text-white/40 hover:border-white/15"
                  )}
                >
                  {m === "brief" ? "Brief (2–3 bullets)" : "Detailed (5+ bullets)"}
                </button>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => onUpdate({ ...section, enabled: !section.enabled })}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              {section.enabled ? "Disable this section" : "Enable this section"}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
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

  // Load template sections on mount if ?template= is set
  useEffect(() => {
    if (templateId && sections.length === 0) {
      const template = DIGEST_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        const loaded = template.sections.map((s, i) => ({
          ...s,
          id: generateId(),
          order: i,
        }));
        updateOnboarding({ sections: loaded, templateId });
      }
    }
  }, [templateId]);

  // ── Step: Welcome ──────────────────────────────────────────────────────────
  const [nameInput, setNameInput] = useState(name || "");
  const [emailInput, setEmailInput] = useState(delivery.email || "");
  const [phoneInput, setPhoneInput] = useState(delivery.phone || "");
  const [channels, setChannels] = useState<DeliveryChannel[]>(delivery.channels || ["email"]);

  const toggleChannel = (ch: DeliveryChannel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleWelcomeNext = () => {
    if (!nameInput.trim()) { toast.error("Please enter your name"); return; }
    if (channels.includes("email") && emailInput && !isValidEmail(emailInput)) {
      toast.error("Please enter a valid email address"); return;
    }
    if (channels.includes("sms") && phoneInput && !isValidPhone(phoneInput)) {
      toast.error("Please enter a valid phone number"); return;
    }
    if (channels.length === 0) { toast.error("Please select at least one delivery channel"); return; }
    updateOnboarding({
      name: nameInput.trim(),
      delivery: { ...delivery, email: emailInput, phone: phoneInput, channels },
    });
    setOnboardingStep("topics");
  };

  // ── Step: Topics ───────────────────────────────────────────────────────────
  const addSection = () => {
    const newSection: DigestSection = {
      id: generateId(),
      title: "",
      type: "custom",
      order: sections.length,
      enabled: true,
      mode: "brief",
    };
    updateOnboarding({ sections: [...sections, newSection] });
  };

  const updateSection = (id: string, updated: DigestSection) => {
    updateOnboarding({ sections: sections.map((s) => (s.id === id ? updated : s)) });
  };

  const removeSection = (id: string) => {
    updateOnboarding({ sections: sections.filter((s) => s.id !== id) });
  };

  const handleTopicsNext = () => {
    if (sections.length === 0) { toast.error("Add at least one section to your digest"); return; }
    const untitled = sections.find((s) => !s.title.trim());
    if (untitled) { toast.error("Give every section a title"); return; }
    setOnboardingStep("delivery");
  };

  // ── Step: Delivery ─────────────────────────────────────────────────────────
  const [deliveryTime, setDeliveryTime] = useState(delivery.time || "07:00");
  const [timezone, setTimezone] = useState(delivery.timezone || "America/New_York");

  const handleDeliveryNext = () => {
    updateOnboarding({ delivery: { ...delivery, time: deliveryTime, timezone } });
    setOnboardingStep("review");
  };

  // ── Step: Review → Submit ──────────────────────────────────────────────────
  const handleSubmit = () => {
    completeOnboarding();
    toast.success("🎉 Your digest is live!");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-surface-0 pt-16">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.05] bg-surface-0/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-brand-400" />
            <span className="text-sm font-semibold text-white/80">
              MorningDigest <span className="text-white/30">— Setup</span>
            </span>
          </div>
          <StepIndicator current={step} />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* ── STEP: Welcome ── */}
        {step === "welcome" && (
          <div className="animate-in space-y-6">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-white">Let's get to know you</h1>
              <p className="text-sm text-white/40">We'll use this to personalize your digest and know where to send it.</p>
            </div>

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Your name *</label>
              <input
                className="input"
                placeholder="Alex Morgan"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
            </div>

            {/* Delivery channels */}
            <div>
              <label className="mb-3 block text-xs font-medium text-white/50">How do you want to receive your digest? *</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["email", "sms"] as DeliveryChannel[]).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                      channels.includes(ch)
                        ? "border-brand-500/40 bg-brand-500/10"
                        : "border-white/[0.07] bg-surface-2 hover:border-white/15"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                      channels.includes(ch) ? "bg-brand-500/20" : "bg-surface-3"
                    )}>
                      {ch === "email"
                        ? <Mail className={cn("h-4 w-4", channels.includes(ch) ? "text-brand-400" : "text-white/30")} />
                        : <MessageSquare className={cn("h-4 w-4", channels.includes(ch) ? "text-brand-400" : "text-white/30")} />
                      }
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", channels.includes(ch) ? "text-white" : "text-white/60")}>
                        {ch === "email" ? "Email" : "SMS / Text"}
                      </p>
                      <p className="mt-0.5 text-xs text-white/30">
                        {ch === "email" ? "Beautifully formatted email" : "Quick text to your phone"}
                      </p>
                    </div>
                    {channels.includes(ch) && (
                      <Check className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Email input */}
            {channels.includes("email") && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Email address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
            )}

            {/* Phone input */}
            {channels.includes("sms") && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Phone number</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-white/25">Standard messaging rates may apply</p>
              </div>
            )}

            <button onClick={handleWelcomeNext} className="btn-primary w-full py-3">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP: Topics ── */}
        {step === "topics" && (
          <div className="animate-in space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="mb-1 text-2xl font-bold text-white">Build your digest</h1>
                <p className="text-sm text-white/40">Add the sections you want in your morning briefing.</p>
              </div>
              <button onClick={() => setOnboardingStep("welcome")} className="btn-ghost mt-1">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Template quickstart */}
            {sections.length === 0 && (
              <div className="rounded-2xl border border-white/[0.05] bg-surface-2 p-4">
                <p className="mb-3 text-xs font-medium text-white/40">
                  <Sparkles className="inline mr-1 h-3.5 w-3.5 text-brand-400" />
                  Start from a template
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DIGEST_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const loaded = t.sections.map((s, i) => ({ ...s, id: generateId(), order: i }));
                        updateOnboarding({ sections: loaded, templateId: t.id });
                        toast.success(`Loaded "${t.name}" template`);
                      }}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-surface-3 p-2.5 text-left text-xs hover:border-brand-500/30 hover:bg-surface-4 transition-all"
                    >
                      <span className="text-base">{t.emoji}</span>
                      <span className="text-white/70">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section list */}
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

            {/* Add section */}
            <button
              type="button"
              onClick={addSection}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.10] py-4 text-sm text-white/30 transition-all hover:border-brand-500/30 hover:text-brand-400"
            >
              <Plus className="h-4 w-4" /> Add section
            </button>

            {sections.length > 0 && (
              <button onClick={handleTopicsNext} className="btn-primary w-full py-3">
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
                <h1 className="mb-1 text-2xl font-bold text-white">When should we send it?</h1>
                <p className="text-sm text-white/40">Pick the time your digest hits your inbox each morning.</p>
              </div>
              <button onClick={() => setOnboardingStep("topics")} className="btn-ghost mt-1">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Time picker */}
            <div>
              <label className="mb-2 block text-xs font-medium text-white/50">
                <Clock className="inline mr-1.5 h-3.5 w-3.5" />
                Delivery time *
              </label>
              <input
                type="time"
                className="input"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
              <p className="mt-1.5 text-[11px] text-white/25">
                Your digest will be generated and sent at this time every morning
              </p>
            </div>

            {/* Timezone picker */}
            <div>
              <label className="mb-2 block text-xs font-medium text-white/50">Timezone *</label>
              <div className="relative">
                <select
                  className="input cursor-pointer appearance-none pr-10"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            {/* Channel reminder */}
            <div className="rounded-2xl border border-white/[0.05] bg-surface-2 p-4">
              <p className="mb-2 text-xs font-medium text-white/40">Delivering to</p>
              <div className="flex flex-wrap gap-2">
                {delivery.channels.map((ch) => (
                  <span key={ch} className="badge-amber">
                    {ch === "email" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                    {ch === "email" ? (delivery.email || "Email") : (delivery.phone || "SMS")}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={handleDeliveryNext} className="btn-primary w-full py-3">
              Review my digest <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── STEP: Review ── */}
        {step === "review" && (
          <div className="animate-in space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="mb-1 text-2xl font-bold text-white">Looks good, {onboarding.name.split(" ")[0]}?</h1>
                <p className="text-sm text-white/40">Review your digest setup before we go live.</p>
              </div>
              <button onClick={() => setOnboardingStep("delivery")} className="btn-ghost mt-1">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Sections summary */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">Your sections</h3>
                <button onClick={() => setOnboardingStep("topics")} className="text-xs text-brand-500 hover:text-brand-400">
                  Edit
                </button>
              </div>
              {sections.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-base">{SECTION_EMOJIS[s.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/80">{s.title}</p>
                    {s.sources && s.sources.length > 0 && (
                      <p className="text-xs text-white/30">Sources: {s.sources.join(", ")}</p>
                    )}
                  </div>
                  <span className={cn("badge", s.enabled ? "badge-green" : "badge-neutral")}>
                    {s.mode}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery summary */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">Delivery settings</h3>
                <button onClick={() => setOnboardingStep("delivery")} className="text-xs text-brand-500 hover:text-brand-400">
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-white/30">Time</p>
                  <p className="font-medium text-white/80">{delivery.time}</p>
                </div>
                <div>
                  <p className="text-xs text-white/30">Timezone</p>
                  <p className="font-medium text-white/80">
                    {TIMEZONES.find((t) => t.value === delivery.timezone)?.label ?? delivery.timezone}
                  </p>
                </div>
                {delivery.email && (
                  <div>
                    <p className="text-xs text-white/30">Email</p>
                    <p className="truncate font-medium text-white/80">{delivery.email}</p>
                  </div>
                )}
                {delivery.phone && (
                  <div>
                    <p className="text-xs text-white/30">SMS</p>
                    <p className="font-medium text-white/80">{delivery.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleSubmit} className="btn-primary w-full py-3 text-base shadow-lg shadow-brand-500/20">
              🎉 Launch my digest
            </button>
            <p className="text-center text-xs text-white/25">
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
    <Suspense fallback={<div className="min-h-screen bg-surface-0 flex items-center justify-center"><Sun className="h-6 w-6 text-brand-400 animate-pulse" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
