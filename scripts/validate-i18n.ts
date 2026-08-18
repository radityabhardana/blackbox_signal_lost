#!/usr/bin/env tsx
/**
 * Localization overlay validation (i18n foundation lane).
 *
 * Walks `src/content/cases/*\/` for case directories that have both a bundle
 * entry point (index.ts) and an `i18n/index.ts` exporting `caseOverlays`:
 *
 *   export const caseOverlays: Partial<Record<Exclude<SupportedLocale, "en">, LocalizedCaseOverlay>>
 *
 * When no overlay exists yet (Lane F creates case 001's), prints
 * "no localization overlays found" and exits 0.
 *
 * For each overlay the script cross-checks against the canonical en bundle:
 *   a. overlay locale keys are supported non-en locales ("id" only for now)
 *   b. every overlay id exists in the bundle (unknown ids fail)
 *   c. every presentation-bearing entity has an overlay entry with its
 *      required presentation fields (missing ids/fields fail); the top-level
 *      `caseTitle` must be present in every overlay locale
 *   d. no overlay string value is blank ("" or whitespace-only)
 *   e. search overlay entries key real searchableIndex entityIds
 *   f. duplicate ids within one section are impossible in TS object literals
 *      (no runtime check needed)
 *
 * Exits 1 on any failure.
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { LocalizedCaseOverlay } from "../src/content/localization/resolve";
import { SUPPORTED_LOCALES } from "../src/lib/locale/locales";
import type { ContentBundle } from "../src/content/validator";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const casesRoot = path.join(scriptDir, "../src/content/cases");

const failures: string[] = [];

function fail(message: string): void {
  failures.push(message);
  console.error(`[validate:i18n] FAIL ${message}`);
}

/** Loads the canonical en bundle for a case. Extend the registry per case. */
async function loadEnBundle(caseName: string): Promise<ContentBundle> {
  if (caseName === "case_001_missing_signal") {
    const mod = await import("../src/content/cases/case_001_missing_signal/index");
    // The loader returns the en bundle by default; once it gains a locale
    // parameter (Function.length >= 1), pass "en" explicitly.
    const loader: (locale?: "en") => { content: ContentBundle } = mod.loadCase001Session;
    return loader(loader.length >= 1 ? "en" : undefined).content;
  }
  throw new Error(`no en-bundle loader registered for case '${caseName}'`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** d. Recursive blank-string check over every overlay string leaf. */
function checkBlanks(scope: string, value: unknown): void {
  if (typeof value === "string") {
    if (value.trim() === "") fail(`${scope} is blank`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkBlanks(`${scope}[${index}]`, item));
    return;
  }
  if (isRecord(value)) {
    for (const [key, entry] of Object.entries(value)) checkBlanks(`${scope}.${key}`, entry);
  }
}

/** b. Unknown overlay ids fail. Returns the overlay id set. */
function checkKnownIds(scope: string, overlaySection: Record<string, unknown>, bundleIds: ReadonlySet<string>): void {
  for (const id of Object.keys(overlaySection)) {
    if (!bundleIds.has(id)) fail(`${scope} references unknown id '${id}'`);
  }
}

function requireEntry(scope: string, overlaySection: Record<string, unknown> | undefined, id: string): Record<string, unknown> | undefined {
  const entry = overlaySection?.[id];
  if (!isRecord(entry)) {
    fail(`${scope} missing overlay entry for '${id}'`);
    return undefined;
  }
  return entry;
}

function requireString(scope: string, entry: Record<string, unknown>, field: string): void {
  const value = entry[field];
  if (typeof value !== "string") fail(`${scope} missing field '${field}'`);
}

function idSet(ids: readonly string[]): ReadonlySet<string> {
  return new Set(ids);
}

/** c. Field-level coverage checks for one overlay against the en bundle. */
function validateOverlay(caseName: string, locale: string, overlay: LocalizedCaseOverlay, bundle: ContentBundle): Record<string, number> {
  const scope = (section: string) => `${caseName}[${locale}].${section}`;
  const counts: Record<string, number> = {};
  const overlayRecord = overlay as Record<string, unknown>;

  // caseTitle — required in every overlay locale; blank is caught by d.
  {
    counts.caseTitle = overlay.caseTitle !== undefined ? 1 : 0;
    if (typeof overlay.caseTitle !== "string") fail(`${caseName}[${locale}] missing field 'caseTitle'`);
  }

  // objectives — all, title + description required
  {
    const section = overlay.objectives ?? {};
    counts.objectives = Object.keys(section).length;
    checkKnownIds(scope("objectives"), section, idSet(bundle.case.objectives.map((o) => o.id)));
    for (const objective of bundle.case.objectives) {
      const entry = requireEntry(scope("objectives"), section, objective.id);
      if (entry) {
        requireString(scope(`objectives.${objective.id}`), entry, "title");
        requireString(scope(`objectives.${objective.id}`), entry, "description");
      }
    }
  }

  // dialogue — every node's text; every choice label on nodes with choices
  {
    const section = overlay.dialogue ?? {};
    counts.dialogue = Object.keys(section).length;
    checkKnownIds(scope("dialogue"), section, idSet(bundle.dialogue.map((n) => n.id)));
    for (const node of bundle.dialogue) {
      const entry = requireEntry(scope("dialogue"), section, node.id);
      if (!entry) continue;
      requireString(scope(`dialogue.${node.id}`), entry, "text");
      if (node.choices) {
        const choiceOverlay = isRecord(entry.choices) ? entry.choices : {};
        if (!isRecord(entry.choices)) fail(scope(`dialogue.${node.id}`) + " missing choices overlay");
        checkKnownIds(scope(`dialogue.${node.id}.choices`), choiceOverlay, idSet(node.choices.map((c) => c.id)));
        for (const choice of node.choices) {
          const choiceEntry = requireEntry(scope(`dialogue.${node.id}.choices`), choiceOverlay, choice.id);
          if (choiceEntry) requireString(scope(`dialogue.${node.id}.choices.${choice.id}`), choiceEntry, "label");
        }
      }
    }
  }

  // records — all, title required (metadata labels live in content-labels)
  {
    const section = overlay.records ?? {};
    counts.records = Object.keys(section).length;
    checkKnownIds(scope("records"), section, idSet(bundle.records.map((r) => r.id)));
    for (const record of bundle.records) {
      const entry = requireEntry(scope("records"), section, record.id);
      if (entry) requireString(scope(`records.${record.id}`), entry, "title");
    }
  }

  // evidence — all, title + summary required
  {
    const section = overlay.evidence ?? {};
    counts.evidence = Object.keys(section).length;
    checkKnownIds(scope("evidence"), section, idSet(bundle.evidence.map((e) => e.id)));
    for (const item of bundle.evidence) {
      const entry = requireEntry(scope("evidence"), section, item.id);
      if (entry) {
        requireString(scope(`evidence.${item.id}`), entry, "title");
        requireString(scope(`evidence.${item.id}`), entry, "summary");
      }
    }
  }

  // hints — all, text required
  {
    const section = overlay.hints ?? {};
    counts.hints = Object.keys(section).length;
    checkKnownIds(scope("hints"), section, idSet(bundle.hints.map((h) => h.id)));
    for (const hint of bundle.hints) {
      const entry = requireEntry(scope("hints"), section, hint.id);
      if (entry) requireString(scope(`hints.${hint.id}`), entry, "text");
    }
  }

  // notifications — all, text required
  {
    const section = overlay.notifications ?? {};
    counts.notifications = Object.keys(section).length;
    checkKnownIds(scope("notifications"), section, idSet(bundle.notifications.map((n) => n.id)));
    for (const notification of bundle.notifications) {
      const entry = requireEntry(scope("notifications"), section, notification.id);
      if (entry) requireString(scope(`notifications.${notification.id}`), entry, "text");
    }
  }

  // endings — all, title required; body.sections required only when the en
  // body carries sections (the stage1 placeholder body is empty → omittable)
  {
    const section = overlay.endings ?? {};
    counts.endings = Object.keys(section).length;
    checkKnownIds(scope("endings"), section, idSet(bundle.endings.map((e) => e.id)));
    for (const ending of bundle.endings) {
      const entry = requireEntry(scope("endings"), section, ending.id);
      if (!entry) continue;
      requireString(scope(`endings.${ending.id}`), entry, "title");
      const enSections = isRecord(ending.body) && Array.isArray(ending.body.sections) ? ending.body.sections : [];
      if (enSections.length > 0) {
        const body = isRecord(entry.body) ? entry.body : undefined;
        if (!body || !Array.isArray(body.sections)) {
          fail(scope(`endings.${ending.id}`) + " missing body.sections overlay");
        }
      }
    }
  }

  // puzzle — all, full presentation coverage per property
  {
    const section = overlay.puzzle ?? {};
    counts.puzzle = Object.keys(section).length;
    checkKnownIds(scope("puzzle"), section, idSet(bundle.puzzles.map((p) => p.id)));
    for (const puzzle of bundle.puzzles) {
      const entry = requireEntry(scope("puzzle"), section, puzzle.id);
      if (!entry) continue;
      const puzzleScope = scope(`puzzle.${puzzle.id}`);
      requireString(puzzleScope, entry, "title");
      requireString(puzzleScope, entry, "referenceLabel");
      requireString(puzzleScope, entry, "disputedLabel");
      requireString(puzzleScope, entry, "conclusionText");
      if (puzzle.kind === "signal_comparison") {
        const propertyOverlay = isRecord(entry.properties) ? entry.properties : {};
        if (!isRecord(entry.properties)) fail(`${puzzleScope} missing properties overlay`);
        checkKnownIds(`${puzzleScope}.properties`, propertyOverlay, idSet(puzzle.properties.map((p) => p.id)));
        for (const property of puzzle.properties) {
          const propertyEntry = requireEntry(`${puzzleScope}.properties`, propertyOverlay, property.id);
          if (!propertyEntry) continue;
          const propertyScope = `${puzzleScope}.properties.${property.id}`;
          requireString(propertyScope, propertyEntry, "label");
          requireString(propertyScope, propertyEntry, "referenceValue");
          requireString(propertyScope, propertyEntry, "disputedValue");
        }
      }
    }
  }

  // conclusion — all claim slots (prompt + every answer option label) and
  // every disclosure choice label
  {
    const section = overlay.conclusion ?? {};
    counts.conclusion = Object.keys(section).length;
    checkKnownIds(scope("conclusion"), section, idSet(bundle.conclusions.map((c) => c.id)));
    for (const conclusion of bundle.conclusions) {
      const entry = requireEntry(scope("conclusion"), section, conclusion.id);
      if (!entry) continue;
      const conclusionScope = scope(`conclusion.${conclusion.id}`);
      const slotOverlay = isRecord(entry.claimSlots) ? entry.claimSlots : {};
      if (!isRecord(entry.claimSlots)) fail(`${conclusionScope} missing claimSlots overlay`);
      checkKnownIds(`${conclusionScope}.claimSlots`, slotOverlay, idSet(conclusion.claimSlots.map((s) => s.id)));
      for (const slot of conclusion.claimSlots) {
        const slotEntry = requireEntry(`${conclusionScope}.claimSlots`, slotOverlay, slot.id);
        if (!slotEntry) continue;
        const slotScope = `${conclusionScope}.claimSlots.${slot.id}`;
        requireString(slotScope, slotEntry, "prompt");
        const optionOverlay = isRecord(slotEntry.answerOptions) ? slotEntry.answerOptions : {};
        if (!isRecord(slotEntry.answerOptions)) fail(`${slotScope} missing answerOptions overlay`);
        checkKnownIds(`${slotScope}.answerOptions`, optionOverlay, idSet(slot.answerOptions.map((o) => o.id)));
        for (const option of slot.answerOptions) {
          const optionEntry = requireEntry(`${slotScope}.answerOptions`, optionOverlay, option.id);
          if (optionEntry) requireString(`${slotScope}.answerOptions.${option.id}`, optionEntry, "label");
        }
      }
      const disclosureOverlay = isRecord(entry.disclosureChoices) ? entry.disclosureChoices : {};
      if (!isRecord(entry.disclosureChoices)) fail(`${conclusionScope} missing disclosureChoices overlay`);
      checkKnownIds(
        `${conclusionScope}.disclosureChoices`,
        disclosureOverlay,
        idSet(conclusion.disclosureChoices.map((d) => d.id)),
      );
      for (const disclosure of conclusion.disclosureChoices) {
        const disclosureEntry = requireEntry(`${conclusionScope}.disclosureChoices`, disclosureOverlay, disclosure.id);
        if (disclosureEntry) {
          requireString(`${conclusionScope}.disclosureChoices.${disclosure.id}`, disclosureEntry, "label");
        }
      }
    }
  }

  // search — every searchableIndex entry, title required; e. keys must be
  // real searchableIndex entityIds (checkKnownIds); localized terms append
  // after en terms, so they are optional but must be non-blank when present
  {
    const section = overlay.search ?? {};
    counts.search = Object.keys(section).length;
    checkKnownIds(scope("search"), section, idSet(bundle.case.searchableIndex.map((s) => s.entityId)));
    for (const searchEntry of bundle.case.searchableIndex) {
      const entry = requireEntry(scope("search"), section, searchEntry.entityId);
      if (entry) requireString(scope(`search.${searchEntry.entityId}`), entry, "title");
    }
  }

  // d. blank strings anywhere in the overlay
  checkBlanks(`${caseName}[${locale}]`, overlayRecord);

  return counts;
}

async function main(): Promise<void> {
  const caseDirs = readdirSync(casesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const overlayCases = caseDirs.filter(
    (name) =>
      existsSync(path.join(casesRoot, name, "index.ts")) && existsSync(path.join(casesRoot, name, "i18n", "index.ts")),
  );

  if (overlayCases.length === 0) {
    console.log("[validate:i18n] no localization overlays found");
    return;
  }

  for (const caseName of overlayCases) {
    const bundle = await loadEnBundle(caseName);
    const overlayUrl = pathToFileURL(path.join(casesRoot, caseName, "i18n", "index.ts")).href;
    const overlayModule = (await import(overlayUrl)) as { caseOverlays?: unknown };

    if (!isRecord(overlayModule.caseOverlays)) {
      fail(`${caseName}/i18n/index.ts must export a 'caseOverlays' object`);
      continue;
    }

    // a. overlay locale keys must be supported non-en locales
    for (const locale of Object.keys(overlayModule.caseOverlays)) {
      if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale) || locale === "en") {
        fail(`${caseName} overlay declares unsupported locale '${locale}'`);
      }
    }

    for (const [locale, overlay] of Object.entries(overlayModule.caseOverlays)) {
      if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale) || locale === "en") continue;
      if (!isRecord(overlay)) {
        fail(`${caseName}[${locale}] overlay must be an object`);
        continue;
      }
      const failuresBefore = failures.length;
      const counts = validateOverlay(caseName, locale, overlay as LocalizedCaseOverlay, bundle);
      const summary = Object.entries(counts)
        .map(([kind, count]) => `${kind}=${count}`)
        .join(" ");
      console.log(
        `[validate:i18n] ${caseName}: locales=[${locale}] ${summary} missing: ${failures.length - failuresBefore}`,
      );
    }
  }

  if (failures.length > 0) {
    console.error(`[validate:i18n] ${failures.length} failure(s)`);
    process.exitCode = 1;
    return;
  }
  console.log("[validate:i18n] OK");
}

await main();
