/**
 * Pure content display-name maps — no React, no component imports. Content
 * enum values (record types, source systems, evidence types, metadata keys)
 * map to `content.*` dictionary keys; unknown values fall back to the raw
 * value so unauthored content stays visible in dev. Narrative metadata VALUES
 * stay authored prose — only booleans are localized (True/False).
 */
import { falseLabel, trueLabel } from "./domain-labels";
import { enDictionary } from "./en";
import { idDictionary } from "./id";
import type { TranslationKey } from "./keys";
import type { SupportedLocale } from "./locales";
import { translateAny } from "./t";

function dictionaryFor(locale: SupportedLocale): Readonly<Record<TranslationKey, string>> {
  return locale === "id" ? idDictionary : enDictionary;
}

/**
 * Looks up `prefix.value` in the locale dictionary; unknown values fall back
 * to the raw value so unauthored content stays visible in dev.
 */
function enumLabel(locale: SupportedLocale, prefix: string, value: string): string {
  const dictionary = dictionaryFor(locale);
  const key = `${prefix}.${value}`;
  return key in dictionary ? translateAny(dictionary, key) : value;
}

export function recordTypeLabel(locale: SupportedLocale, value: string): string {
  return enumLabel(locale, "content.recordType", value);
}

export function sourceSystemLabel(locale: SupportedLocale, value: string): string {
  return enumLabel(locale, "content.sourceSystem", value);
}

export function evidenceTypeLabel(locale: SupportedLocale, value: string): string {
  return enumLabel(locale, "content.evidenceType", value);
}

export function metadataKeyLabel(locale: SupportedLocale, key: string): string {
  return enumLabel(locale, "content.metadataKey", key);
}

/**
 * Localizes a metadata VALUE. Booleans render as the localized True/False
 * label; every other value (strings, numbers, narrative prose) passes through
 * untouched — keys map, values stay authored.
 */
export function metadataValueLabel(locale: SupportedLocale, key: string, value: string | number | boolean | null): string {
  void key;
  if (typeof value === "boolean") return value ? trueLabel(locale) : falseLabel(locale);
  if (value === null) return "";
  return String(value);
}
