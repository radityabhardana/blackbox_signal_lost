/**
 * Locale primitives (BBX-### localization foundation, Oracle D2).
 * Pure module — no React, no content imports. Browser storage access is
 * guarded so SSR and privacy modes never throw.
 */

export type SupportedLocale = "en" | "id";

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ["en", "id"];

export const LOCALE_STORAGE_KEY = "bbx.locale";

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return value === "en" || value === "id";
}

/**
 * Picks a locale from a navigator.languages style array. The first entry that
 * starts with "id" (case-insensitive, e.g. "id", "id-ID") wins; anything else
 * falls back to the default locale.
 */
export function resolveLocale(browserLanguages?: readonly string[]): SupportedLocale {
  if (!browserLanguages) return DEFAULT_LOCALE;
  for (const language of browserLanguages) {
    if (language.toLowerCase().startsWith("id")) return "id";
  }
  return DEFAULT_LOCALE;
}

/**
 * Reads the persisted locale. Returns the stored value only when it is a
 * supported locale; returns undefined when nothing valid is stored (or storage
 * is unavailable), so callers can apply their own initialLocale/default chain.
 */
export function readStoredLocale(): SupportedLocale | undefined {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored !== null && isSupportedLocale(stored)) return stored;
  } catch {
    // SSR or privacy mode — no storage access.
  }
  return undefined;
}

export function writeStoredLocale(locale: SupportedLocale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // SSR or privacy mode — persistence is best-effort only.
  }
}