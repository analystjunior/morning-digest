"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Edit3, Eye, Clock, Mail, MessageSquare,
  GripVertical, Zap, ArrowRight, X, Save,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppStore } from "@/lib/store";
import { DigestSection, SectionType } from "@/lib/types";
import {
  SECTION_EMOJIS, SECTION_LABELS, TIMEZONES, cn, generateId, formatTime, DEFAULT_CONFIG,
} from "@/lib/utils";
import Toggle from "@/components/ui/Toggle";
import NavBar from "@/components/ui/NavBar";
import { SectionConfig } from "@/components/ui/SectionConfig";
import { createClient } from "@/lib/supabase/client";
import { loadUserData } from "@/lib/supabase/user-data";

const ALLOWED_SECTION_TYPES: SectionType[] = [
  "weather", "news", "sports", "finance", "crypto", "quote",
];

const DASH_EMOJIS: Partial<Record<SectionType, string>> = {
  weather: "⛅",
  news: "📰",
  sports: "🏆",
  finance: "📈",
  crypto: "🌑",
  quote: "💬",
};

// ─── Style tokens ─────────────────────────────────────────────────────────────
const BG      = "#E8E6DF";
const DARK    = "#1a1a1a";
const BORDER  = "#d4d0c8";
const MUTED   = "#888";
const SEC     = "#555";
const CARD    = "white";

const inputStyle: React.CSSProperties = {
  backgroundColor: CARD, border: `1px solid ${BORDER}`,
  borderRadius: "4px", color: DARK, width: "100%",
  padding: "8px 10px", fontSize: "13px", outline: "none",
};

// ─── Inline section editor (modal) ───────────────────────────────────────────
function SectionEditor({
  section, onSave, onClose,
}: {
  section: DigestSection;
  onSave: (s: DigestSection) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<DigestSection>(section);

  const handleTypeChange = (t: SectionType) => {
    setDraft((d) => ({ ...d, type: t, config: DEFAULT_CONFIG[t] ?? {}, prompt: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-t-2xl sm:rounded-xl p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
          >
            Edit section
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1.5 transition-opacity hover:opacity-60"
            style={{ color: SEC }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium" style={{ color: SEC }}>Title</label>
          <input
            style={inputStyle}
            className="rounded"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium" style={{ color: SEC }}>Content type</label>
          <div className="flex flex-wrap gap-1.5">
            {ALLOWED_SECTION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-all"
                style={
                  draft.type === t
                    ? { backgroundColor: DARK, color: BG, border: `1px solid ${DARK}` }
                    : { backgroundColor: "#f5f3ee", color: SEC, border: `1px solid ${BORDER}` }
                }
              >
                {DASH_EMOJIS[t] ?? SECTION_EMOJIS[t]} {SECTION_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Type-specific config */}
        <SectionConfig section={draft} onUpdate={setDraft} />

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              if (!draft.title.trim()) { toast.error("Title is required"); return; }
              onSave(draft);
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: DARK, color: BG }}
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
          <button
            onClick={onClose}
            className="rounded px-4 py-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: DARK }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, subscription, isOnboarded, updateSubscription, restoreFromDB, reset } = useAppStore();
  const [editingSection, setEditingSection] = useState<DigestSection | null>(null);
  const [showDeliveryEdit, setShowDeliveryEdit] = useState(false);
  const [sending, setSending] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [deliveryTz, setDeliveryTz] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Verify auth session on mount. If the store is already hydrated (e.g. same
  // browser session), skip the DB fetch. If not, load from Supabase so returning
  // users see their saved configuration instead of a blank slate.
  useEffect(() => {
    const restore = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/onboarding");
        return;
      }

      if (!isOnboarded) {
        const data = await loadUserData(supabase);
        if (data) {
          restoreFromDB(data.user, data.subscription);
        } else {
          // Authenticated but hasn't completed onboarding yet.
          router.replace("/onboarding");
          return;
        }
      }

      setLoading(false);
    };

    restore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (subscription) {
      setDeliveryTime(subscription.delivery.time);
      setDeliveryTz(subscription.delivery.timezone);
    }
  }, [subscription]);

  if (loading || !subscription || !user) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "#E8E6DF" }}
      >
        <p className="text-sm" style={{ color: "#888" }}>Loading your digest…</p>
      </div>
    );
  }

  const { sections, delivery, status, name: digestName } = subscription;

  const toggleDigest = () => {
    updateSubscription({ status: status === "active" ? "paused" : "active" });
    toast.success(status === "active" ? "Digest paused" : "Digest resumed");
  };

  const addSection = () => {
    const newSection: DigestSection = {
      id: generateId(), title: "New section", type: "custom",
      order: sections.length, enabled: true, mode: "brief",
    };
    updateSubscription({ sections: [...sections, newSection] });
    setEditingSection(newSection);
  };

  const updateSection = (updated: DigestSection) => {
    const newSections = sections.map((s) => (s.id === updated.id ? updated : s));
    updateSubscription({ sections: newSections });
    toast.success("Section updated");
    fetch("/api/user/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: { name: user.name },
        subscription: { sections: newSections, delivery },
      }),
    }).catch(() => {});
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

  const handleDragStart = (i: number) => setDragIdx(i);

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIdx(i);
  };

  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const reordered = [...sections];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    updateSubscription({ sections: reordered.map((s, idx) => ({ ...s, order: idx })) });
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const saveDelivery = () => {
    updateSubscription({ delivery: { ...delivery, time: deliveryTime, timezone: deliveryTz } });
    setShowDeliveryEdit(false);
    toast.success("Delivery settings saved");
  };

  const sendTestDigest = async () => {
    console.log("[Send test] clicked", { userEmail: user.email, deliveryEmail: delivery.email });
    const toEmail = user.email || delivery.email;
    if (!toEmail) {
      toast.error("No email address on your account.");
      return;
    }
    const enabledSections = sections.filter((s) => s.enabled);
    if (!enabledSections.length) {
      toast.error("Enable at least one section first.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: toEmail,
          userName: user.name,
          sections: enabledSections,
          deliverySettings: delivery,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Unknown error");
      }
      toast.success(`Digest sent to ${toEmail}!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <NavBar />

      <div className="mx-auto max-w-5xl px-4 pt-24 pb-20 sm:px-6">

        {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-0.5 text-xs" style={{ color: MUTED }}>Welcome back,</p>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
            >
              {user.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={sendTestDigest}
              disabled={sending}
              className="flex items-center gap-1.5 rounded px-3 py-2 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: DARK }}
            >
              <Zap className="h-3.5 w-3.5" />
              {sending ? "Sending…" : "Send test"}
            </button>
            <Link
              href="/preview"
              className="flex items-center gap-1.5 rounded px-3 py-2 text-xs font-medium transition-opacity hover:opacity-70"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: DARK }}
            >
              <Eye className="h-3.5 w-3.5" /> Preview digest
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── Left column: sections ── */}
          <div className="space-y-4 lg:col-span-2">

            {/* Status bar */}
            <div
              className="flex items-center justify-between rounded-lg p-4"
              style={
                status === "active"
                  ? { backgroundColor: "#f0fdf4", border: "1px solid #86efac" }
                  : { backgroundColor: CARD, border: `1px solid ${BORDER}` }
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn("h-2 w-2 rounded-full shrink-0", status === "active" && "animate-pulse-slow")}
                  style={{ backgroundColor: status === "active" ? "#22c55e" : "#d4d0c8" }}
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: DARK }}>{digestName}</p>
                  <p className="text-xs" style={{ color: MUTED }}>
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
              <h2 className="text-sm font-semibold" style={{ color: SEC }}>
                My sections <span className="ml-1 font-normal" style={{ color: MUTED }}>({sections.length})</span>
              </h2>
            </div>

            {/* Section cards */}
            <div className="space-y-2">
              {sections.map((section, i) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  className="group flex items-center gap-3 rounded-lg p-4 transition-all"
                  style={
                    dragOverIdx === i && dragIdx !== i
                      ? { backgroundColor: CARD, border: `1px solid ${DARK}`, opacity: 1 }
                      : dragIdx === i
                      ? { backgroundColor: "#f5f3ee", border: `1px dashed ${BORDER}`, opacity: 0.5 }
                      : section.enabled
                      ? { backgroundColor: CARD, border: `1px solid ${BORDER}` }
                      : { backgroundColor: "#f5f3ee", border: `1px solid #e8e5de`, opacity: 0.7 }
                  }
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab" style={{ color: "#ccc" }} />

                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                    style={{ backgroundColor: "#f5f3ee", color: MUTED }}
                  >
                    {i + 1}
                  </div>

                  <span className="text-xl shrink-0">{DASH_EMOJIS[section.type] ?? SECTION_EMOJIS[section.type]}</span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: DARK }}>{section.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: "#f5f3ee", border: `1px solid #e0ddd6`, color: SEC }}
                      >
                        {SECTION_LABELS[section.type]}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: "#f5f3ee", border: `1px solid #e0ddd6`, color: SEC }}
                      >
                        {section.mode}
                      </span>
                      {section.sources && section.sources.length > 0 && (
                        <span className="truncate text-xs" style={{ color: MUTED }}>
                          {section.sources.slice(0, 2).join(", ")}
                          {section.sources.length > 2 && ` +${section.sources.length - 2}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions — visible on hover */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingSection(section)}
                      className="rounded p-1.5 transition-colors hover:bg-stone-100"
                      style={{ color: MUTED }}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="rounded p-1.5 transition-colors hover:bg-red-50"
                      style={{ color: "#c0392b" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Toggle size="sm" checked={section.enabled} onChange={() => toggleSection(section.id)} />
                </div>
              ))}

              {/* Add section */}
              <button
                onClick={addSection}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ border: `1px dashed ${BORDER}`, color: SEC, backgroundColor: "transparent" }}
              >
                <Plus className="h-4 w-4" /> Add section
              </button>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Delivery card */}
            <div
              className="rounded-lg p-5 space-y-4"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: DARK }}>Delivery</h3>
                <button
                  onClick={() => setShowDeliveryEdit((v) => !v)}
                  className="text-xs font-medium transition-opacity hover:opacity-60"
                  style={{ color: SEC }}
                >
                  {showDeliveryEdit ? "Cancel" : "Edit"}
                </button>
              </div>

              {!showDeliveryEdit ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: DARK }}>{formatTime(delivery.time)}</p>
                      <p className="text-xs" style={{ color: MUTED }}>
                        {TIMEZONES.find((t) => t.value === delivery.timezone)?.label ?? delivery.timezone}
                      </p>
                    </div>
                  </div>
                  <hr style={{ borderColor: "#e8e5de" }} />
                  <div className="space-y-2">
                    {delivery.channels.map((ch) => (
                      <div key={ch} className="flex items-center gap-3">
                        {ch === "email"
                          ? <Mail className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
                          : <MessageSquare className="h-4 w-4 shrink-0" style={{ color: MUTED }} />
                        }
                        <p className="truncate text-xs" style={{ color: SEC }}>
                          {ch === "email" ? delivery.email : delivery.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium" style={{ color: SEC }}>Time</label>
                    <input
                      type="time"
                      style={inputStyle}
                      className="rounded"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium" style={{ color: SEC }}>Timezone</label>
                    <select
                      style={inputStyle}
                      className="rounded cursor-pointer appearance-none"
                      value={deliveryTz}
                      onChange={(e) => setDeliveryTz(e.target.value)}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={saveDelivery}
                    className="flex w-full items-center justify-center gap-1.5 rounded py-2 text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ backgroundColor: DARK, color: BG }}
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              )}
            </div>

            {/* Stats card */}
            <div
              className="rounded-lg p-5 space-y-4"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              <h3 className="text-sm font-semibold" style={{ color: DARK }}>Stats</h3>
              <div className="space-y-3">
                {[
                  { label: "Sections active", value: sections.filter((s) => s.enabled).length.toString() },
                  { label: "Delivery channels", value: delivery.channels.length.toString() },
                  { label: "Digest status", value: status === "active" ? "Live" : "Paused" },
                  { label: "Next send", value: status === "active" ? `Today at ${formatTime(delivery.time)}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: MUTED }}>{label}</p>
                    <p className="text-xs font-medium" style={{ color: DARK }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview CTA */}
            <Link
              href="/preview"
              className="group flex items-center justify-between rounded-lg p-4 transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#f5f3ee", border: `1px solid #e0ddd6` }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: DARK }}>Preview today&apos;s digest</p>
                <p className="text-xs" style={{ color: MUTED }}>See exactly what gets sent</p>
              </div>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ color: SEC }} />
            </Link>

            {/* Danger zone */}
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              <button
                onClick={async () => {
                  if (confirm("Reset your account? This cannot be undone.")) {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    reset();
                    router.push("/");
                  }
                }}
                className="w-full text-xs transition-opacity hover:opacity-100"
                style={{ color: "#c0392b", opacity: 0.5 }}
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
