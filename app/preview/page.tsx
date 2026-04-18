"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Mail, ArrowLeft, RefreshCw, Smartphone,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatTime, TIMEZONES, cn } from "@/lib/utils";
import NavBar from "@/components/ui/NavBar";
import { GeneratedDigest } from "@/lib/types";

// ─── Style tokens ─────────────────────────────────────────────────────────────
const BG     = "#E8E6DF";
const DARK   = "#1a1a1a";
const BORDER = "#d4d0c8";
const MUTED  = "#888";
const SEC    = "#555";
const CARD   = "white";

type ViewMode = "email" | "sms";

// ─── SMS preview ──────────────────────────────────────────────────────────────
function SMSPreview({ sections, userName }: { sections: GeneratedDigest["sections"]; userName: string }) {
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const lines: string[] = [
    `☀️ The Paper Route — ${date}`,
    `Hey ${userName.split(" ")[0]}! Here's your briefing:\n`,
    ...sections.map((section) => {
      const bullets = section.items.map((item) => `• ${item.text}`).join("\n");
      return `${section.emoji} *${section.title}*\n${bullets}`;
    }),
    "\n—\nReply STOP to unsubscribe. The Paper Route",
  ];

  return (
    <div className="mx-auto max-w-sm">
      <div
        className="rounded-[2.5rem] p-4 shadow-2xl"
        style={{ border: "4px solid #2d2d2d", backgroundColor: "#1c1c1e" }}
      >
        <div className="mb-4 flex items-center justify-center">
          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: "#3a3a3c" }} />
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#f2f2f7", minHeight: "500px", maxHeight: "680px", overflowY: "auto" }}>
          <div className="mb-4 text-center text-xs" style={{ color: MUTED }}>
            The Paper Route · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div
            className="max-w-[85%] rounded-2xl rounded-tl-sm p-3.5"
            style={{ backgroundColor: "#e5e5ea" }}
          >
            <div className="space-y-3 text-xs leading-relaxed whitespace-pre-line font-mono" style={{ color: DARK }}>
              {lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Email preview chrome ────────────────────────────────────────────────────
function EmailPreview({
  html, userName, deliveryTime, timezone,
}: {
  html: string;
  userName: string;
  deliveryTime: string;
  timezone: string;
}) {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div
      className="overflow-hidden rounded-xl shadow-lg"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {/* Email client chrome */}
      <div
        className="px-5 py-4"
        style={{ backgroundColor: "#f5f3ee", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#febc2e" }} />
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#28c840" }} />
        </div>
        <div className="space-y-1 text-xs" style={{ color: MUTED }}>
          <p><span style={{ color: "#bbb" }}>From:</span> The Paper Route &lt;digest@thepaperroute.app&gt;</p>
          <p><span style={{ color: "#bbb" }}>To:</span> {userName} &lt;you@example.com&gt;</p>
          <p className="font-medium" style={{ color: SEC }}>
            <span style={{ color: "#bbb" }}>Subject:</span> ☀️ Your Morning Digest — {date}
          </p>
        </div>
      </div>

      {/* Rendered HTML digest */}
      <div className="p-6 sm:p-8" style={{ backgroundColor: CARD }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 text-center space-y-1"
        style={{ backgroundColor: "#f9f8f5", borderTop: `1px solid #f0ede6` }}
      >
        <p className="text-xs" style={{ color: MUTED }}>
          Delivered at {formatTime(deliveryTime)} ·{" "}
          {TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone}
        </p>
        <p className="text-xs" style={{ color: MUTED }}>
          <Link href="/dashboard" className="transition-opacity hover:opacity-60" style={{ color: SEC }}>
            Edit my digest
          </Link>
          {" · "}
          <span className="cursor-pointer transition-opacity hover:opacity-60" style={{ color: MUTED }}>
            Unsubscribe
          </span>
        </p>
      </div>
    </div>
  );
}

// ─── Main Preview Page ────────────────────────────────────────────────────────
export default function PreviewPage() {
  const { user, subscription, isOnboarded, loadDemoData } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>("email");
  const [digestHtml, setDigestHtml] = useState<string | null>(null);
  const [digestData, setDigestData] = useState<GeneratedDigest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Ref guard prevents duplicate auto-generate calls when the store
  // sets user and subscription as separate updates (each triggers the effect).
  const autoGenStarted = useRef(false);

  useEffect(() => {
    if (!isOnboarded) loadDemoData();
  }, []);

  const generate = async (sub?: typeof subscription, usr?: typeof user) => {
    const s = sub ?? subscription;
    const u = usr ?? user;
    if (!s || !u) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/digest/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: s.sections, userName: u.name }),
      });
      const data = await res.json() as { html?: string; digest?: GeneratedDigest; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setDigestHtml(data.html ?? null);
      setDigestData(data.digest ?? null);
    } catch (err) {
      console.error("[preview] Failed to generate digest:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate once when both subscription and user are available.
  // The ref prevents double-firing when the store hydrates user and subscription
  // as separate state updates (which would trigger this effect twice).
  useEffect(() => {
    if (subscription && user && !autoGenStarted.current) {
      autoGenStarted.current = true;
      generate(subscription, user);
    }
  }, [subscription?.id, user?.id]);

  if (!subscription || !user) return null;

  const { delivery } = subscription;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <NavBar />

      <div className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:px-6">

        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: DARK }}
            >
              Digest preview
            </h1>
            <p className="text-sm" style={{ color: MUTED }}>This is how your digest looks when it arrives</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Email / SMS toggle */}
            <div
              className="flex items-center rounded-lg p-1"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}
            >
              {([
                { mode: "email" as ViewMode, icon: Mail, label: "Email" },
                { mode: "sms" as ViewMode, icon: Smartphone, label: "SMS" },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-all"
                  style={
                    viewMode === mode
                      ? { backgroundColor: DARK, color: BG }
                      : { color: MUTED }
                  }
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => generate()}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded px-3 py-2 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
              style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: DARK }}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Regenerate
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div
              className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${DARK} transparent ${DARK} ${DARK}` }}
            />
            <p className="text-sm" style={{ color: MUTED }}>Curating your digest...</p>
          </div>
        ) : (digestHtml || viewMode === "sms") ? (
          <div className="animate-in">
            {viewMode === "email" && digestHtml ? (
              <EmailPreview
                html={digestHtml}
                userName={user.name}
                deliveryTime={delivery.time}
                timezone={delivery.timezone}
              />
            ) : viewMode === "sms" ? (
              <SMSPreview sections={digestData?.sections ?? []} userName={user.name} />
            ) : null}
          </div>
        ) : null}

        {/* Footer */}
        {(digestHtml || viewMode === "sms") && !isLoading && (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <p className="text-xs" style={{ color: MUTED }}>
              Live data from ESPN, OpenWeatherMap, ZenQuotes, and more.
              Content updates each time you click Regenerate.
            </p>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-60"
              style={{ color: SEC }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
