"use client";

import Link from "next/link";
import { BlackboxSymbol, BlackboxWordmark, CiabMark } from "@/components/brand";
import { useT } from "@/lib/locale/provider";

/**
 * Client child of the public landing page. The route itself stays a server
 * component; this child consumes the locale dictionary so launch/marketing
 * copy is localized.
 */
export function LandingContent() {
  const t = useT();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header>
        <div className="flex items-center gap-3">
          <BlackboxSymbol size={32} className="shrink-0 text-bbx-accent-civic" />
          <BlackboxWordmark size={160} className="text-bbx-text-1" />
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-bbx-text-1">
          {t("ui.landing.title")}
        </h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          {t("ui.landing.kicker")}
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-bbx-text-2">
          {t("ui.landing.tagline")}
        </p>
      </header>

      <section aria-label={t("ui.landing.launchSection")} className="flex flex-wrap gap-2">
        <Link href="/game" className="bbx-btn bbx-btn-primary">
          {t("ui.landing.start")}
        </Link>
        <button
          type="button"
          disabled
          aria-describedby="continue-status"
          className="bbx-btn"
        >
          {t("ui.landing.continue")}
        </button>
      </section>
      <p id="continue-status" className="max-w-2xl text-sm leading-relaxed text-bbx-text-2">
        {t("ui.landing.continueStatus")}
      </p>

      <section aria-label={t("ui.landing.beforePlaySection")} className="max-w-2xl">
        <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          {t("ui.landing.beforePlaySection")}
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-bbx-text-2">
          <li>{t("ui.landing.headphones")}</li>
          <li>{t("ui.landing.desktopBrowser")}</li>
          <li>{t("ui.landing.contentWarnings")}</li>
        </ul>
      </section>

      <footer className="mt-auto">
        <p className="flex items-center gap-2 font-mono text-xs text-bbx-text-2">
          <CiabMark size={14} className="shrink-0" />
          {t("ui.landing.prototypeNote")}
        </p>
      </footer>
    </div>
  );
}
