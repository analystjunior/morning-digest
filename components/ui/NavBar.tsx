"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function NavBar() {
  const pathname = usePathname();
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  const links = [
    { href: "/dashboard", label: "Dashboard", requiresAuth: true },
    { href: "/preview", label: "Preview", requiresAuth: true },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm"
      style={{ backgroundColor: "rgba(232,230,223,0.97)", borderBottom: "1px solid #d4d0c8" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-12">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--font-playfair), serif", color: "#1a1a1a" }}
        >
          The Paper Route
        </Link>

        <nav className="flex items-center gap-6">
          {links.map(({ href, label, requiresAuth }) => {
            if (requiresAuth && !isOnboarded) return null;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium transition-opacity hover:opacity-60"
                style={{
                  color: "#1a1a1a",
                  opacity: active ? 1 : 0.5,
                  textDecoration: active ? "underline" : "none",
                  textUnderlineOffset: "3px",
                }}
              >
                {label}
              </Link>
            );
          })}

          {!isOnboarded && (
            <Link
              href="/onboarding"
              className="text-sm font-medium tracking-wide transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "#1a1a1a",
                color: "#E8E6DF",
                borderRadius: "3px",
                padding: "6px 16px",
              }}
            >
              Get started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
