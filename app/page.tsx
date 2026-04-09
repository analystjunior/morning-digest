import Link from "next/link";

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#E8E6DF", color: "#1a1a1a", fontFamily: "var(--font-inter), sans-serif" }}
    >

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 sm:px-12 max-w-5xl mx-auto">
        <span
          className="text-base font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          The Paper Route
        </span>
        <Link
          href="/onboarding"
          className="text-sm font-medium tracking-wide hover:opacity-60 transition-opacity duration-150"
        >
          Get started
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 sm:px-12 max-w-5xl mx-auto pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
        <hr style={{ borderColor: "#1a1a1a", borderTopWidth: "1px", marginBottom: "2.5rem" }} />

        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          The Paper Route
        </h1>

        <p
          className="mt-5 text-lg sm:text-xl font-light tracking-wide"
          style={{ color: "#4a4a4a" }}
        >
          Your morning, your way.
        </p>

        <hr style={{ borderColor: "#1a1a1a", borderTopWidth: "1px", marginTop: "2.5rem", marginBottom: "2.5rem" }} />

        <Link
          href="/onboarding"
          className="inline-block text-sm font-medium tracking-wide px-8 py-3 transition-opacity duration-150 hover:opacity-80"
          style={{
            backgroundColor: "#1a1a1a",
            color: "#E8E6DF",
            borderRadius: "3px",
          }}
        >
          Get started
        </Link>
      </section>

      {/* How it works */}
      <section className="px-6 sm:px-12 max-w-5xl mx-auto pb-32">
        <h2
          className="text-xs font-medium tracking-widest uppercase mb-12"
          style={{ color: "#888", fontFamily: "var(--font-inter), sans-serif" }}
        >
          How it works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
          <div>
            <p
              className="text-xs font-medium tracking-widest mb-4"
              style={{ color: "#888" }}
            >
              01
            </p>
            <p
              className="text-xl font-semibold leading-snug mb-3"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Choose your topics
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              Select the subjects that matter to you — news, markets, sports, weather, and more.
            </p>
          </div>

          <div>
            <p
              className="text-xs font-medium tracking-widest mb-4"
              style={{ color: "#888" }}
            >
              02
            </p>
            <p
              className="text-xl font-semibold leading-snug mb-3"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Set your delivery time
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              Pick the exact time your briefing arrives. Early riser or slow starter — it's up to you.
            </p>
          </div>

          <div>
            <p
              className="text-xs font-medium tracking-widest mb-4"
              style={{ color: "#888" }}
            >
              03
            </p>
            <p
              className="text-xl font-semibold leading-snug mb-3"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Get your briefing every morning
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              A clean, readable digest lands in your inbox before your day begins. No noise. No scrolling.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-12 py-8 text-center">
        <hr style={{ borderColor: "#ccc", borderTopWidth: "1px", marginBottom: "1.5rem" }} />
        <p className="text-xs tracking-wide" style={{ color: "#888" }}>
          The Paper Route &mdash; {year}
        </p>
      </footer>

    </div>
  );
}
