import type { TranslationKey } from "./keys";

/** Interpolation values accepted by `interpolate`. */
export type TranslationParams = Record<string, string | number>;

/**
 * Replaces `{name}` placeholders in a template. Placeholders whose name has
 * no matching param are left intact (visible in dev, never throws).
 */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Typed lookup: `key` is a TranslationKey, so a missing entry is a compile
 * error. The runtime fallback returns the key itself as a defensive guard.
 */
export function translate(
  dictionary: Readonly<Record<TranslationKey, string>>,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const template = dictionary[key];
  if (template === undefined) return key;
  return interpolate(template, params);
}

/**
 * Dynamic-key lookup for enum-derived keys (content labels). Returns the
 * translated value when the key exists in the dictionary; otherwise returns
 * the raw key as a dev-visible fallback (production never hits it per
 * scripts/validate-i18n.ts).
 */
export function translateAny(
  dictionary: Readonly<Record<TranslationKey, string>>,
  key: string,
  params?: TranslationParams,
): string {
  const template = (dictionary as Readonly<Record<string, string>>)[key];
  if (template === undefined) return key;
  return interpolate(template, params);
}
