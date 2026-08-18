/**
 * Generic localized-bundle resolver. English is the canonical locale: the
 * authored ContentBundle is returned unchanged (same reference). For any other
 * supported locale, a NEW bundle is produced with presentation fields overlaid
 * by entity id from the per-case overlay. Ids, rules, effects, priorities, and
 * flags are never touched; the input bundle is never mutated.
 *
 * NOTE: record metadata display labels are NOT part of the bundle — they are a
 * UI concern handled by src/lib/locale/content-labels.ts (metadataKeyLabel).
 * The overlay `records` entries therefore carry only `{ title? }`.
 */
import type { ContentBundle } from "@/content/validator";
import { DEFAULT_LOCALE } from "@/lib/locale/locales";
import type { SupportedLocale } from "@/lib/locale/locales";

/**
 * Per-case localization overlay. Keys are entity ids; values carry only the
 * presentation fields that differ per locale. `caseTitle` is a top-level
 * overlay of the canonical case manifest title. `search` terms are APPENDED
 * after the canonical English terms (never replace) so search stays
 * deterministic and additive.
 */
export interface LocalizedCaseOverlay {
  caseTitle?: string;
  objectives?: Record<string, { title?: string; description?: string }>;
  dialogue?: Record<string, { text?: string; choices?: Record<string, { label?: string }> }>;
  records?: Record<string, { title?: string }>;
  evidence?: Record<string, { title?: string; summary?: string }>;
  hints?: Record<string, { text?: string }>;
  notifications?: Record<string, { text?: string }>;
  endings?: Record<string, { title?: string; body?: { sections?: string[] } }>;
  puzzle?: Record<
    string,
    {
      title?: string;
      referenceLabel?: string;
      disputedLabel?: string;
      properties?: Record<string, { label?: string; referenceValue?: string; disputedValue?: string }>;
      conclusionText?: string;
    }
  >;
  conclusion?: Record<
    string,
    {
      claimSlots?: Record<string, { prompt?: string; answerOptions?: Record<string, { label?: string }> }>;
      disclosureChoices?: Record<string, { label?: string }>;
    }
  >;
  search?: Record<string, { title?: string; exactTerms?: string[]; aliases?: string[] }>;
}

export function resolveLocalizedBundle(
  bundle: ContentBundle,
  overlay: LocalizedCaseOverlay | undefined,
  locale: SupportedLocale,
): ContentBundle {
  // Canonical locale or nothing to overlay → return the input unchanged.
  if (locale === DEFAULT_LOCALE || !overlay) return bundle;

  const objectives = overlay.objectives
    ? bundle.case.objectives.map((objective) => {
        const entry = overlay.objectives?.[objective.id];
        if (!entry) return objective;
        return {
          ...objective,
          ...(entry.title !== undefined ? { title: entry.title } : {}),
          ...(entry.description !== undefined ? { description: entry.description } : {}),
        };
      })
    : bundle.case.objectives;

  const dialogue = overlay.dialogue
    ? bundle.dialogue.map((node) => {
        const entry = overlay.dialogue?.[node.id];
        if (!entry) return node;
        const choiceEntries = entry.choices;
        const choices =
          choiceEntries && node.choices
            ? node.choices.map((choice) => {
                const choiceEntry = choiceEntries[choice.id];
                return choiceEntry?.label !== undefined ? { ...choice, label: choiceEntry.label } : choice;
              })
            : node.choices;
        return {
          ...node,
          ...(entry.text !== undefined ? { text: entry.text } : {}),
          ...(choices !== node.choices ? { choices } : {}),
        };
      })
    : bundle.dialogue;

  const records = overlay.records
    ? bundle.records.map((record) => {
        const entry = overlay.records?.[record.id];
        return entry?.title !== undefined ? { ...record, title: entry.title } : record;
      })
    : bundle.records;

  const evidence = overlay.evidence
    ? bundle.evidence.map((item) => {
        const entry = overlay.evidence?.[item.id];
        if (!entry) return item;
        return {
          ...item,
          ...(entry.title !== undefined ? { title: entry.title } : {}),
          ...(entry.summary !== undefined ? { summary: entry.summary } : {}),
        };
      })
    : bundle.evidence;

  const hints = overlay.hints
    ? bundle.hints.map((hint) => {
        const entry = overlay.hints?.[hint.id];
        return entry?.text !== undefined ? { ...hint, text: entry.text } : hint;
      })
    : bundle.hints;

  const notifications = overlay.notifications
    ? bundle.notifications.map((notification) => {
        const entry = overlay.notifications?.[notification.id];
        return entry?.text !== undefined ? { ...notification, text: entry.text } : notification;
      })
    : bundle.notifications;

  const endings = overlay.endings
    ? bundle.endings.map((ending) => {
        const entry = overlay.endings?.[ending.id];
        if (!entry) return ending;
        const sections = entry.body?.sections;
        const body = sections !== undefined ? { ...ending.body, sections } : ending.body;
        return {
          ...ending,
          ...(entry.title !== undefined ? { title: entry.title } : {}),
          ...(body !== ending.body ? { body } : {}),
        };
      })
    : bundle.endings;

  const puzzles = overlay.puzzle
    ? bundle.puzzles.map((puzzle) => {
        const entry = overlay.puzzle?.[puzzle.id];
        if (!entry || puzzle.kind !== "signal_comparison") return puzzle;
        const propertyEntries = entry.properties;
        const properties = propertyEntries
          ? puzzle.properties.map((property) => {
              const propertyEntry = propertyEntries[property.id];
              if (!propertyEntry) return property;
              return {
                ...property,
                ...(propertyEntry.label !== undefined ? { label: propertyEntry.label } : {}),
                ...(propertyEntry.referenceValue !== undefined
                  ? { referenceValue: propertyEntry.referenceValue }
                  : {}),
                ...(propertyEntry.disputedValue !== undefined
                  ? { disputedValue: propertyEntry.disputedValue }
                  : {}),
              };
            })
          : puzzle.properties;
        return {
          ...puzzle,
          ...(entry.title !== undefined ? { title: entry.title } : {}),
          ...(entry.referenceLabel !== undefined ? { referenceLabel: entry.referenceLabel } : {}),
          ...(entry.disputedLabel !== undefined ? { disputedLabel: entry.disputedLabel } : {}),
          ...(properties !== puzzle.properties ? { properties } : {}),
          ...(entry.conclusionText !== undefined ? { conclusionText: entry.conclusionText } : {}),
        };
      })
    : bundle.puzzles;

  const conclusions = overlay.conclusion
    ? bundle.conclusions.map((conclusion) => {
        const entry = overlay.conclusion?.[conclusion.id];
        if (!entry) return conclusion;
        const slotEntries = entry.claimSlots;
        const claimSlots = slotEntries
          ? conclusion.claimSlots.map((slot) => {
              const slotEntry = slotEntries[slot.id];
              if (!slotEntry) return slot;
              const optionEntries = slotEntry.answerOptions;
              const answerOptions = optionEntries
                ? slot.answerOptions.map((option) => {
                    const optionEntry = optionEntries[option.id];
                    return optionEntry?.label !== undefined ? { ...option, label: optionEntry.label } : option;
                  })
                : slot.answerOptions;
              return {
                ...slot,
                ...(slotEntry.prompt !== undefined ? { prompt: slotEntry.prompt } : {}),
                ...(answerOptions !== slot.answerOptions ? { answerOptions } : {}),
              };
            })
          : conclusion.claimSlots;
        const disclosureEntries = entry.disclosureChoices;
        const disclosureChoices = disclosureEntries
          ? conclusion.disclosureChoices.map((choice) => {
              const choiceEntry = disclosureEntries[choice.id];
              return choiceEntry?.label !== undefined ? { ...choice, label: choiceEntry.label } : choice;
            })
          : conclusion.disclosureChoices;
        return {
          ...conclusion,
          ...(claimSlots !== conclusion.claimSlots ? { claimSlots } : {}),
          ...(disclosureChoices !== conclusion.disclosureChoices ? { disclosureChoices } : {}),
        };
      })
    : bundle.conclusions;

  // Search: title overrides; localized terms APPEND after the en terms so the
  // canonical terms always precede the overlay terms (deterministic ordering).
  const searchableIndex = overlay.search
    ? bundle.case.searchableIndex.map((searchEntry) => {
        const entry = overlay.search?.[searchEntry.entityId];
        if (!entry) return searchEntry;
        return {
          ...searchEntry,
          ...(entry.title !== undefined ? { title: entry.title } : {}),
          ...(entry.exactTerms !== undefined
            ? { exactTerms: [...searchEntry.exactTerms, ...entry.exactTerms] }
            : {}),
          ...(entry.aliases !== undefined ? { aliases: [...searchEntry.aliases, ...entry.aliases] } : {}),
        };
      })
    : bundle.case.searchableIndex;

  const caseTitle = overlay.caseTitle;
  const nextCase =
    objectives !== bundle.case.objectives || searchableIndex !== bundle.case.searchableIndex || caseTitle !== undefined
      ? { ...bundle.case, objectives, searchableIndex, ...(caseTitle !== undefined ? { title: caseTitle } : {}) }
      : bundle.case;

  return {
    ...bundle,
    case: nextCase,
    dialogue,
    records,
    evidence,
    hints,
    notifications,
    endings,
    puzzles,
    conclusions,
  };
}
