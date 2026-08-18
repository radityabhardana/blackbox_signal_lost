/**
 * Pure domain-label helpers — no React, no component imports. Each helper
 * resolves the locale dictionary and looks up a fixed or enum-derived key.
 * Enum values are safe by construction (typed unions); attachmentType falls
 * back to the "other" label for unknown attachment kinds.
 */
import { enDictionary } from "./en";
import { idDictionary } from "./id";
import type { TranslationKey } from "./keys";
import type { SupportedLocale } from "./locales";
import { interpolate, translate, translateAny } from "./t";

export type NotificationPriorityValue =
  | "informational"
  | "discovery"
  | "message"
  | "urgent"
  | "system_anomaly";

export type AttachmentTypeValue = "image" | "audio" | "document" | "video" | "font";

export type WindowStateValue = "minimized" | "focused" | "open";

export type PersistenceStatusValue = "idle" | "saving" | "saved" | "error";

function dictionaryFor(locale: SupportedLocale): Readonly<Record<TranslationKey, string>> {
  return locale === "id" ? idDictionary : enDictionary;
}

export function hintTierLabel(locale: SupportedLocale, tier: 1 | 2 | 3 | 4): string {
  return translate(dictionaryFor(locale), `ui.hints.tier${tier}`);
}

export function notificationPriorityLabel(locale: SupportedLocale, priority: NotificationPriorityValue): string {
  return translate(dictionaryFor(locale), `label.priority.${priority}`);
}

export function unknownSenderLabel(locale: SupportedLocale): string {
  return translate(dictionaryFor(locale), "label.unknownSender");
}

export function unknownSourceLabel(locale: SupportedLocale): string {
  return translate(dictionaryFor(locale), "label.unknownSource");
}

export function attachmentTypeLabel(locale: SupportedLocale, type: string): string {
  const dictionary = dictionaryFor(locale);
  const known: readonly string[] = ["image", "audio", "document", "video", "font"];
  const resolved = known.includes(type) ? type : "other";
  return translateAny(dictionary, `label.attachmentType.${resolved}`);
}

export function attachmentLabel(locale: SupportedLocale, type: string, index: number): string {
  const dictionary = dictionaryFor(locale);
  const typeLabel = attachmentTypeLabel(locale, type);
  return interpolate(translateAny(dictionary, "label.attachment"), { type: typeLabel, index });
}

export function windowStateLabel(locale: SupportedLocale, state: WindowStateValue): string {
  const key =
    state === "minimized"
      ? "ui.taskbar.stateMinimized"
      : state === "focused"
        ? "ui.taskbar.stateFocused"
        : "ui.taskbar.stateOpen";
  return translate(dictionaryFor(locale), key);
}

export function persistenceStatusLabel(locale: SupportedLocale, status: PersistenceStatusValue): string {
  const key =
    status === "idle"
      ? "ui.persistence.statusIdle"
      : status === "saving"
        ? "ui.persistence.statusSaving"
        : status === "saved"
          ? "ui.persistence.statusSaved"
          : "ui.persistence.statusError";
  return translate(dictionaryFor(locale), key);
}

export function trueLabel(locale: SupportedLocale): string {
  return translate(dictionaryFor(locale), "ui.common.true");
}

export function falseLabel(locale: SupportedLocale): string {
  return translate(dictionaryFor(locale), "ui.common.false");
}
