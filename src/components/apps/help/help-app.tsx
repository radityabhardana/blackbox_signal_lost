"use client";

import { useT } from "@/lib/locale/provider";
import type { TranslationKey } from "@/lib/locale/keys";

const HELP_SECTIONS: ReadonlyArray<{
  id: string;
  headingId: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}> = [
  {
    id: "help-section-workspace",
    headingId: "help-heading-workspace",
    titleKey: "ui.help.section.workspace",
    bodyKey: "ui.help.workspace.body",
  },
  {
    id: "help-section-windows",
    headingId: "help-heading-windows",
    titleKey: "ui.help.section.windows",
    bodyKey: "ui.help.windows.body",
  },
  {
    id: "help-section-launcher",
    headingId: "help-heading-launcher",
    titleKey: "ui.help.section.launcher",
    bodyKey: "ui.help.launcher.body",
  },
  {
    id: "help-section-records",
    headingId: "help-heading-records",
    titleKey: "ui.help.section.records",
    bodyKey: "ui.help.records.body",
  },
  {
    id: "help-section-board",
    headingId: "help-heading-board",
    titleKey: "ui.help.section.board",
    bodyKey: "ui.help.board.body",
  },
  {
    id: "help-section-a11y",
    headingId: "help-heading-a11y",
    titleKey: "ui.help.section.a11y",
    bodyKey: "ui.help.a11y.body",
  },
];

/**
 * Mechanics help for the analyst workspace. Deliberately no case solutions or
 * story spoilers: it explains the OS chrome (windows, launcher, records,
 * evidence board) and accessibility, nothing more.
 */
export function HelpApp() {
  const t = useT();

  return (
    <section aria-label={t("ui.help.region")} className="flex h-full min-h-0 flex-col">
      <header className="px-4 pt-3 pb-2">
        <h1 className="text-base font-medium text-bbx-text-1">{t("ui.help.region")}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-sm leading-relaxed text-bbx-text-2">{t("ui.help.intro")}</p>
        <div className="mt-4 flex flex-col gap-3">
          {HELP_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={section.headingId}
              className="border border-bbx-surface-2 bg-bbx-surface-1 p-3"
            >
              <h2 id={section.headingId} className="text-sm font-semibold text-bbx-text-1">
                {t(section.titleKey)}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-bbx-text-2">{t(section.bodyKey)}</p>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}