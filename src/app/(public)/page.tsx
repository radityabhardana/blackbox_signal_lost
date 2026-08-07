import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          Blackbox Civic Systems // Analyst Terminal
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-bbx-text-1">
          BLACKBOX: Signal Lost
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-bbx-text-2">
          Investigate a city through its data, decide which version of the truth becomes official,
          and discover why the system is studying you.
        </p>
      </header>

      <section aria-label="Launch" className="flex flex-wrap gap-2">
        <Link href="/game" className="bbx-btn bbx-btn-primary">
          Start investigation
        </Link>
        <Link href="/game" className="bbx-btn">
          Continue
        </Link>
      </section>

      <section aria-label="Before you play" className="max-w-2xl">
        <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          Before you play
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-bbx-text-2">
          <li>Headphones are recommended, not required.</li>
          <li>Best experienced in a desktop browser: current Chrome, Edge, or Firefox.</li>
          <li>
            Contains themes of surveillance, institutional pressure, missing persons, and privacy
            invasion.
          </li>
        </ul>
      </section>

      <footer className="mt-auto">
        <p className="font-mono text-xs text-bbx-text-2">
          Prototype build — Case 001 is not available yet.
        </p>
      </footer>
    </div>
  );
}
