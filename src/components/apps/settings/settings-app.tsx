"use client";

import { useContext } from "react";
import { LocaleContext, useT } from "@/lib/locale/provider";
import type { SupportedLocale } from "@/lib/locale/locales";
import type { TranslationKey } from "@/lib/locale/keys";

const LANGUAGE_OPTIONS: ReadonlyArray<{ value: SupportedLocale; labelKey: TranslationKey }> = [
  { value: "en", labelKey: "ui.language.english" },
  { value: "id", labelKey: "ui.language.indonesian" },
];

export function SettingsApp() {
  const t = useT();
  const context = useContext(LocaleContext);
  if (!context) throw new Error("SettingsApp must be used within a LocaleProvider");
  const { locale, setLocale } = context;

  return (
    <section aria-label={t("ui.settings.region")} className="flex h-full min-h-0 flex-col">
      <header className="px-4 pt-3 pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">
          {t("ui.settings.region")}
        </h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <fieldset className="border border-bbx-surface-2 bg-bbx-surface-1 p-3">
          <legend className="px-1 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
            {t("ui.settings.language")}
          </legend>
          <div className="flex flex-col gap-2">
            {LANGUAGE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 border border-bbx-surface-2 bg-bbx-bg-1 px-3 py-2 text-sm text-bbx-text-1 hover:bg-bbx-surface-2 has-[:checked]:border-bbx-accent-civic"
              >
                <input
                  type="radio"
                  name="settings-language"
                  value={option.value}
                  checked={locale === option.value}
                  onChange={() => setLocale(option.value)}
                  className="accent-bbx-accent-civic"
                />
                {t(option.labelKey)}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
