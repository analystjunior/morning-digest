"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sun, Mail, MessageSquare, ArrowLeft, RefreshCw,
  Clock, ExternalLink, ToggleLeft, Smartphone
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { generateMockDigest } from "@/lib/mock-data";
import { GeneratedDigest } from "@/lib/types";
import { formatTime, TIMEZONES, cn } from "@/lib/utils";
import NavBar from "@/components/ui/NavBar";

type ViewMode = "email" | "sms";

// ─── SMS preview component ─────────────────────────────────────────────────
function SMSPreview({ digest, userName }: { digest: GeneratedDigest; userName: string }) {
  const lines: string[] = [
    `☀️ Morning Digest — ${digest.date}`,
    `Hey ${userName.split(" ")[0]}! Here's your briefing:\n`,
    ...digest.sections.map((section) => {
      const bullets = section.items
        .slice(0, 2)
        .map((item) => `• ${item.text}`)
        .join("\n");
      return `${section.emoji} *${section.title}*\n${bullets}`;
    }),
    "\n—\nReply STOP to unsubscribe. MorningDigest",
  ];

  return (
    <div className="mx-auto max-w-sm">
      {/* Phone mockup */}
      <div className="rounded-[2.5rem] border-4 border-surface-4 bg-surface-1 p-4 shadow-2xl shadow-black/60">
        {/* Phone header */}
        <div className="mb-4 flex items-center justify-center">
          <div className="h-1.5 w-16 rounded-full bg-surface-4" />
        </div>

        {/* Message bubble area */}
        <div className="rounded-2xl bg-surface-0 p-4 min-h-[500px]">
          {/* Sender */}
          <div className="mb-4 text-center text-xs text-white/25">
            Morning Digest · {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>

          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-3 p-3.5">
            <div className="space-y-3 text-sm text-white/80 leading-relaxed whitespace-pre-line font-mono text-xs">
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

// ─── Email preview component ───────────────────────────────────────────────
function EmailPreview({
  digest,
  userName,
  deliveryTime,
  timezone,
}: {
  digest: GeneratedDigest;
  userName: string;
  deliveryTime: string;
  timezone: string;
}) {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-surface-2 shadow-2xl shadow-black/50">
      {/* Email client chrome */}
      <div className="border-b border-white/[0.05] bg-surface-3 px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="space-y-1 text-xs text-white/40">
          <p><span className="text-white/20">From:</span> MorningDigest &lt;digest@morningdigest.app&gt;</p>
          <p><span className="text-white/20">To:</span> {userName} &lt;you@example.com&gt;</p>
          <p className="font-medium text-white/60">
            <span className="text-white/20">Subject:</span> ☀️ Your Morning Digest — {date}
          </p>
        </div>
      </div>

      {/* Email body */}
      <div className="digest-email p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="border-b border-white/[0.05] pb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20">
              <Sun className="h-4 w-4 text-brand-400" />
            </div>
            <span className="text-sm font-bold text-white/80 tracking-tight">
              Morning<span className="text-brand-400">Digest</span>
            </span>
          </div>

          <h1 className="text-xl font-bold text-white mb-1">
            Good morning, {userName.split(" ")[0]} ☀️
          </h1>
          <p className="text-sm text-white/40">
            {date} · Your personalized briefing, ready in 5 minutes
          </p>
        </div>

        {/* Sections */}
        {digest.sections.map((section, i) => (
          <div key={section.sectionId} className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{section.emoji}</span>
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">
                {section.title}
              </h2>
            </div>

            {/* Items */}
            <div className="rounded-2xl border border-white/[0.05] bg-surface-3 p-4 space-y-3">
              {section.items.map((item, j) => (
                <div key={j} className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-white/80">{item.text}</p>
                    {item.source && (
                      <p className="mt-0.5 text-xs text-white/25 flex items-center gap-1">
                        <ExternalLink className="h-2.5 w-2.5" />
                        {item.source}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider between sections */}
            {i < digest.sections.length - 1 && <div className="divider" />}
          </div>
        ))}

        {/* Footer */}
        <div className="border-t border-white/[0.05] pt-5 text-center space-y-2">
          <p className="text-xs text-white/20">
            Delivered at {formatTime(deliveryTime)} ·{" "}
            {TIMEZONES.find((t) => t.value === timezone)?.label ?? timezone}
          </p>
          <p className="text-xs text-white/20">
            <Link href="/dashboard" className="text-brand-500/60 hover:text-brand-500">
              Edit my digest
            </Link>
            {" · "}
            <span className="cursor-pointer text-white/20 hover:text-white/40">Unsubscribe</span>
          </p>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <Sun className="h-3 w-3 text-brand-500/40" />
            <span className="text-[10px] text-white/15 tracking-wide">MORNINGDIGEST</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Preview Page ─────────────────────────────────────────────────────
export default function PreviewPage() {
  const router = useRouter();
  const { user, subscription, isOnboarded, loadDemoData } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>("email");
  const [digest, setDigest] = useState<GeneratedDigest | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load demo data if not onboarded (for direct-link previews)
  useEffect(() => {
    if (!isOnboarded) loadDemoData();
  }, []);

  // Generate the mock digest
  const generateDigest = () => {
    if (!subscription) return;
    setIsLoading(true);
    setTimeout(() => {
      setDigest(generateMockDigest(subscription.sections));
      setIsLoading(false);
    }, 600);
  };

  useEffect(() => {
    if (subscription) generateDigest();
  }, [subscription?.updatedAt]);

  if (!subscription || !user) return null;

  const { delivery } = subscription;

  return (
    <div className="min-h-screen bg-surface-0">
      <NavBar />

      <div className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:px-6">
        {/* Page header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Digest preview</h1>
            <p className="text-sm text-white/35">This is how your digest looks when it arrives</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-xl border border-white/[0.07] bg-surface-2 p-1">
              {([
                { mode: "email" as ViewMode, icon: Mail, label: "Email" },
                { mode: "sms" as ViewMode, icon: Smartphone, label: "SMS" },
              ]).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    viewMode === mode
                      ? "bg-surface-4 text-white"
                      : "text-white/35 hover:text-white/60"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            <button
              onClick={generateDigest}
              disabled={isLoading}
              className="btn-secondary text-xs py-2"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Regenerate
            </button>
          </div>
        </div>

        {/* Preview */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Sun className="h-8 w-8 text-brand-400 animate-pulse" />
            <p className="text-sm text-white/30">Curating your digest...</p>
          </div>
        ) : digest ? (
          <div className="animate-in">
            {viewMode === "email" ? (
              <EmailPreview
                digest={digest}
                userName={user.name}
                deliveryTime={delivery.time}
                timezone={delivery.timezone}
              />
            ) : (
              <SMSPreview digest={digest} userName={user.name} />
            )}
          </div>
        ) : null}

        {/* Footer meta */}
        {digest && !isLoading && (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <p className="text-xs text-white/20">
              This is a preview using mock AI-generated content.
              In production, content is fetched live from your specified sources.
            </p>
            <Link href="/dashboard" className="btn-ghost text-xs py-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
