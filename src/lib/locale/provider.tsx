"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { enDictionary } from "./en";
import { idDictionary } from "./id";
import type { TranslationKey } from "./keys";
import { DEFAULT_LOCALE, readStoredLocale, writeStoredLocale } from "./locales";
import type { SupportedLocale } from "./locales";
import { translate } from "./t";
import type { TranslationParams } from "./t";

export type TranslateFunction = (key: TranslationKey, params?: TranslationParams) => string;

export interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: TranslateFunction;
}

export const LocaleContext = createContext<LocaleContextValue | null>(null);

function dictionaryFor(locale: SupportedLocale): Readonly<Record<TranslationKey, string>> {
  return locale === "id" ? idDictionary : enDictionary;
}

/**
 * Locale provider (Oracle D2: React context only, no zustand). The initial
 * locale is the caller-provided initialLocale (e.g. resolved from browser
 * languages), then the default — storage is NOT read during render so SSR and
 * first client hydration always agree. A one-time post-mount effect applies
 * the persisted preference, avoiding React hydration error #418.
 */
export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale ?? DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStoredLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-mount storage read (hydration-safe)
    if (stored && stored !== locale) setLocaleState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    writeStoredLocale(next);
    setLocaleState(next);
  }, []);

  const t = useMemo<TranslateFunction>(() => {
    const dictionary = dictionaryFor(locale);
    return (key, params) => translate(dictionary, key, params);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale/useT must be used within a LocaleProvider");
  return context;
}

export function useLocale(): SupportedLocale {
  return useLocaleContext().locale;
}

export function useT(): TranslateFunction {
  return useLocaleContext().t;
}
