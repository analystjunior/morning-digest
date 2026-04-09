"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, LayoutDashboard, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export default function NavBar() {
  const pathname = usePathname();
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresAuth: true },
    { href: "/preview", label: "Preview", icon: Eye, requiresAuth: true },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-surface-0/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20 ring-1 ring-brand-500/30 transition-all group-hover:bg-brand-500/30">
            <Sun className="h-3.5 w-3.5 text-brand-400" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-tight">
            Morning<span className="text-brand-400">Digest</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon, requiresAuth }) => {
            if (requiresAuth && !isOnboarded) return null;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}

          {!isOnboarded && (
            <Link href="/onboarding" className="btn-primary py-1.5 px-4 text-xs">
              Get started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
