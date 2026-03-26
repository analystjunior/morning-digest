import Link from "next/link";

const features = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
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
    ),
    title: "Built around your morning",
    body: "Choose what goes in your digest — weather, news, calendar events, tasks, stocks, and more. Reorder sections until it feels exactly right.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10" />
        <path d="M12 6v6l3 3" />
        <path d="M19 16v6M22 19h-6" />
      </svg>
    ),
    title: "Delivered at your hour",
    body: "Set your delivery time and the days you want it. Briefd lands in your inbox before you need it — no apps to open, no feeds to scroll.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
        <line x1="8" y1="9" x2="10" y2="9" />
      </svg>
    ),
    title: "Calm, not cluttered",
    body: "No notifications, no algorithms, no noise. Just a single, well-formatted brief that respects your attention and gets out of the way.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white font-[family-name:var(--font-geist-sans)]">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-10 max-w-6xl mx-auto">
        <span className="text-base font-semibold tracking-tight">
          <span className="text-amber-400">●</span>
          <span className="ml-2 text-white">Briefd</span>
        </span>
        <Link
          href="/auth/login"
          className="text-sm text-zinc-400 hover:text-white transition-colors duration-150"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-6 pt-20 pb-28 sm:pt-32 sm:pb-36 overflow-hidden">

        {/* Soft glow behind headline */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #f59e0b 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative max-w-3xl mx-auto">
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-amber-400 mb-8">
            <span className="block w-4 h-px bg-amber-400" aria-hidden="true" />
            Morning digest, reinvented
            <span className="block w-4 h-px bg-amber-400" aria-hidden="true" />
          </p>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08] text-balance text-white">
            Your morning,
            <br />
            <span className="text-amber-400">your way.</span>
          </h1>

          <p className="mt-7 text-lg sm:text-xl text-zinc-400 leading-relaxed text-balance max-w-xl mx-auto">
            Briefd curates a single, clean daily digest from the sources and topics you choose — weather, news, calendar, tasks, and more — and delivers it right before you start your day.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/setup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 text-zinc-900 font-semibold text-sm px-8 py-3.5 hover:bg-amber-300 active:bg-amber-500 transition-colors duration-150 w-full sm:w-auto"
            >
              Build your digest
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full border border-zinc-700 text-zinc-300 font-medium text-sm px-8 py-3.5 hover:border-zinc-500 hover:text-white transition-colors duration-150 w-full sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-28 sm:px-10 max-w-6xl mx-auto">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map(({ icon, title, body }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-7 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-200"
            >
              {/* Subtle inner top highlight */}
              <div
                className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-zinc-600 to-transparent opacity-60"
                aria-hidden="true"
              />

              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 mb-5">
                {icon}
              </div>

              <h2 className="text-base font-semibold text-white mb-2">{title}</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA strip */}
      <section className="border-t border-zinc-800 px-6 py-20 sm:px-10">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-4">
            Ready to reclaim your mornings?
          </h2>
          <p className="text-zinc-400 text-base mb-8">
            Set up your first digest in under two minutes.
          </p>
          <Link
            href="/setup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 text-zinc-900 font-semibold text-sm px-8 py-3.5 hover:bg-amber-300 active:bg-amber-500 transition-colors duration-150"
          >
            Get started — it&apos;s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 sm:px-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
          <span>
            <span className="text-amber-500">●</span>
            <span className="ml-1.5">Briefd</span>
          </span>
          <span>© {new Date().getFullYear()} Briefd. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
