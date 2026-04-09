"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sun, Plus, Trash2, Edit3, Eye, Clock, Mail, MessageSquare,
  GripVertical, ChevronDown, Check, Zap, Settings, Power,
  ArrowRight, ToggleLeft, Sparkles, X, Save
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "@/lib/store";
import { DigestSection, SectionType, DeliveryChannel } from "@/lib/types";
import {
  SECTION_EMOJIS, SECTION_LABELS, TIMEZONES, cn, generateId,
  formatTime, isValidEmail, SECTION_TYPES
} from "@/lib/utils";
import Toggle from "@/components/ui/Toggle";
import NavBar from "@/components/ui/NavBar";

// ─── Inline section editor (modal-style drawer) ───────────────────────────────
function SectionEditor({
  section,
  onSave,
  onClose,
}: {
  section: DigestSection;
  onSave: (s: DigestSection) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DigestSection>(section);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-white/[0.08] bg-surface-1 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Edit section</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Title *</label>
          <input
            className="input"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-white/50">Content type</label>
          <div className="flex flex-wrap gap-1.5">
            {(["news","sports","finance","social","technology","entertainment","weather","quote","custom"] as SectionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDraft({ ...draft, type: t })}
                className={cn(
                  "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                  draft.type === t
                    ? "border-brand-500/40 bg-brand-500/15 text-brand-400"
                    : "border-white/[0.07] bg-surface-3 text-white/40 hover:border-white/15"
                )}
              >
                {SECTION_EMOJIS[t]} {SECTION_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Instructions</label>
          <textarea
            className="input resize-none"
            rows={2}
            value={draft.prompt ?? ""}
            onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Sources (comma-separated)</label>
          <input
            className="input"
            value={(draft.sources ?? []).join(", ")}
            onChange={(e) =>
              setDraft({ ...draft, sources: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
            }
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              if (!draft.title.trim()) { toast.error("Title is required"); return; }
              onSave(draft);
              onClose();
            }}
            className="btn-primary flex-1"
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
          <button onClick={onClose} className="btn-secondary px-4">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, subscription, isOnboarded, updateSubscription, reset } = useAppStore();
  const [editingSection, setEditingSection] = useState<DigestSection | null>(null);
  const [showDeliveryEdit, setShowDeliveryEdit] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryTz, setDeliveryTz] = useState("");

  useEffect(() => {
    if (!isOnboarded) router.replace("/onboarding");
  }, [isOnboarded]);

  useEffect(() => {
    if (subscription) {
      setDeliveryTime(subscription.delivery.time);
      setDeliveryTz(subscription.delivery.timezone);
    }
  }, [subscription]);

  if (!subscription || !user) return null;

  const { sections, delivery, status, name: digestName } = subscription;

  const toggleDigest = () => {
    updateSubscription({ status: status === "active" ? "paused" : "active" });
    toast.success(status === "active" ? "Digest paused" : "Digest resumed");
  };

  const addSection = () => {
    const newSection: DigestSection = {
      id: generateId(),
      title: "New section",
      type: "custom",
      order: sections.length,
      enabled: true,
      mode: "brief",
    };
    updateSubscription({ sections: [...sections, newSection] });
    setEditingSection(newSection);
  };

  const updateSection = (updated: DigestSection) => {
    updateSubscription({ sections: sections.map((s) => (s.id === updated.id ? updated : s)) });
    toast.success("Section updated");
  };

  const removeSection = (id: string) => {
    updateSubscription({ sections: sections.filter((s) => s.id !== id) });
    toast.success("Section removed");
  };

  const toggleSection = (id: string) => {
    updateSubscription({
      sections: sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    });
  };

  const saveDelivery = () => {
    updateSubscription({
      delivery: { ...delivery, time: deliveryTime, timezone: deliveryTz },
    });
    setShowDeliveryEdit(false);
    toast.success("Delivery settings saved");
  };

  const sendTestDigest = () => {
    toast.success("Test digest sent! Check your inbox.");
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <NavBar />

      <div className="mx-auto max-w-5xl px-4 pt-24 pb-20 sm:px-6">
        {/* ── Page header ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-0.5 text-xs text-white/30">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={sendTestDigest} className="btn-secondary text-xs py-2">
              <Zap className="h-3.5 w-3.5" /> Send test
            </button>
            <Link href="/preview" className="btn-secondary text-xs py-2">
              <Eye className="h-3.5 w-3.5" /> Preview digest
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* ── Left column: sections ── */}
          <div className="space-y-4 lg:col-span-2">
            {/* Status bar */}
            <div className={cn(
              "flex items-center justify-between rounded-2xl border p-4",
              status === "active"
                ? "border-emerald-500/20 bg-emerald-500/[0.05]"
                : "border-white/[0.05] bg-surface-2"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  status === "active" ? "bg-emerald-400 animate-pulse-slow" : "bg-white/20"
                )} />
                <div>
                  <p className="text-sm font-medium text-white/90">{digestName}</p>
                  <p className="text-xs text-white/30">
                    {status === "active"
                      ? `Sends daily at ${formatTime(delivery.time)} ${TIMEZONES.find((t) => t.value === delivery.timezone)?.label?.split(" ").slice(-1)[0] ?? ""}`
                      : "Digest is paused"}
                  </p>
                </div>
              </div>
              <Toggle checked={status === "active"} onChange={toggleDigest} />
            </div>

            {/* Sections header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/60">
                My sections <span className="ml-1 text-white/25">({sections.length})</span>
              </h2>
              <p className="text-xs text-white/25">Drag to reorder</p>
            </div>

            {/* Section cards */}
            <div className="space-y-2">
              {sections.map((section, i) => (
                <div
                  key={section.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border p-4 transition-all",
                    section.enabled
                      ? "border-white/[0.07] bg-surface-2 hover:border-white/[0.12]"
                      : "border-white/[0.03] bg-surface-1 opacity-60"
                  )}
                >
                  {/* Drag handle */}
                  <GripVertical className="h-4 w-4 shrink-0 text-white/15 cursor-grab" />

                  {/* Order badge */}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs text-white/30 font-medium">
                    {i + 1}
                  </div>

                  {/* Emoji */}
                  <span className="text-xl">{SECTION_EMOJIS[section.type]}</span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/90">{section.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="badge-neutral">{SECTION_LABELS[section.type]}</span>
                      <span className="badge-neutral">{section.mode}</span>
                      {section.sources && section.sources.length > 0 && (
                        <span className="text-xs text-white/25 truncate">
                          {section.sources.slice(0, 2).join(", ")}
                          {section.sources.length > 2 && ` +${section.sources.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingSection(section)}
                      className="p-1.5 rounded-lg text-white/30 hover:bg-surface-3 hover:text-white/70 transition-all"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-1.5 rounded-lg text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Toggle */}
                  <Toggle
                    size="sm"
                    checked={section.enabled}
                    onChange={() => toggleSection(section.id)}
                  />
                </div>
              ))}

              {/* Add section button */}
              <button
                onClick={addSection}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] py-3.5 text-sm text-white/25 transition-all hover:border-brand-500/30 hover:text-brand-400"
              >
                <Plus className="h-4 w-4" /> Add section
              </button>
            </div>
          </div>

          {/* ── Right column: delivery + stats ── */}
          <div className="space-y-4">
            {/* Delivery card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/70">Delivery</h3>
                <button
                  onClick={() => setShowDeliveryEdit((v) => !v)}
                  className="text-xs text-brand-500 hover:text-brand-400 transition-colors"
                >
                  {showDeliveryEdit ? "Cancel" : "Edit"}
                </button>
              </div>

              {!showDeliveryEdit ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-white/30 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white/80">{formatTime(delivery.time)}</p>
                      <p className="text-xs text-white/30">
                        {TIMEZONES.find((t) => t.value === delivery.timezone)?.label ?? delivery.timezone}
                      </p>
                    </div>
                  </div>
                  <div className="divider" />
                  <div className="space-y-2">
                    {delivery.channels.map((ch) => (
                      <div key={ch} className="flex items-center gap-3">
                        {ch === "email"
                          ? <Mail className="h-4 w-4 text-white/30 shrink-0" />
                          : <MessageSquare className="h-4 w-4 text-white/30 shrink-0" />
                        }
                        <p className="truncate text-xs text-white/60">
                          {ch === "email" ? delivery.email : delivery.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Time</label>
                    <input type="time" className="input" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/40">Timezone</label>
                    <select className="input" value={deliveryTz} onChange={(e) => setDeliveryTz(e.target.value)}>
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={saveDelivery} className="btn-primary w-full text-sm py-2">
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              )}
            </div>

            {/* Stats card */}
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white/70">Stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Sections active", value: sections.filter((s) => s.enabled).length.toString() },
                  { label: "Delivery channels", value: delivery.channels.length.toString() },
                  { label: "Digest status", value: status === "active" ? "Live" : "Paused" },
                  { label: "Next send", value: status === "active" ? `Today at ${formatTime(delivery.time)}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <p className="text-xs text-white/30">{label}</p>
                    <p className="text-xs font-medium text-white/70">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview CTA */}
            <Link
              href="/preview"
              className="flex items-center justify-between rounded-2xl border border-brand-500/20 bg-brand-500/[0.06] p-4 transition-all hover:border-brand-500/30 hover:bg-brand-500/[0.09] group"
            >
              <div>
                <p className="text-sm font-semibold text-white/80">Preview today's digest</p>
                <p className="text-xs text-white/30">See exactly what gets sent</p>
              </div>
              <ArrowRight className="h-4 w-4 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Danger zone */}
            <div className="card p-4">
              <button
                onClick={() => {
                  if (confirm("Reset your account? This cannot be undone.")) {
                    reset();
                    router.push("/");
                  }
                }}
                className="w-full text-xs text-red-400/50 hover:text-red-400 transition-colors"
              >
                Reset account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section editor modal */}
      {editingSection && (
        <SectionEditor
          section={editingSection}
          onSave={updateSection}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}
