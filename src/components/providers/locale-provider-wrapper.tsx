"use client";

import type { ReactNode } from "react";
import { LocaleProvider } from "@/lib/locale/provider";
import { resolveLocale } from "@/lib/locale/locales";

/**
 * Client-side bootstrap for the LocaleProvider. The initial locale resolves
 * from the browser's language preferences for first-time visitors; under SSR
 * (no navigator) the provider falls back to DEFAULT_LOCALE. The persisted
 * preference is applied by the provider itself post-mount (storage is never
 * read during render, so SSR and hydration always match).
 */
export function LocaleProviderWrapper({ children }: { children: ReactNode }) {
  if (typeof navigator === "undefined") {
    return <LocaleProvider>{children}</LocaleProvider>;
  }
  const initialLocale = resolveLocale(navigator.languages);
  return <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>;
}
