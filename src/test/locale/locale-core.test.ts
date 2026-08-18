import { describe, expect, it, beforeEach } from "vitest";
import { loadCase001Session } from "@/content/cases/case_001_missing_signal";
import { resolveLocalizedBundle } from "@/content/localization/resolve";
import type { LocalizedCaseOverlay } from "@/content/localization/resolve";
import {
  attachmentLabel,
  attachmentTypeLabel,
  falseLabel,
  hintTierLabel,
  notificationPriorityLabel,
  persistenceStatusLabel,
  trueLabel,
  unknownSenderLabel,
  unknownSourceLabel,
  windowStateLabel,
} from "@/lib/locale/domain-labels";
import {
  evidenceTypeLabel,
  metadataKeyLabel,
  metadataValueLabel,
  recordTypeLabel,
  sourceSystemLabel,
} from "@/lib/locale/content-labels";
import { enDictionary } from "@/lib/locale/en";
import { idDictionary } from "@/lib/locale/id";
import type { TranslationKey } from "@/lib/locale/keys";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isSupportedLocale,
  readStoredLocale,
  resolveLocale,
  writeStoredLocale,
} from "@/lib/locale/locales";
import { interpolate, translate, translateAny } from "@/lib/locale/t";

describe("resolveLocale", () => {
  it("maps id-ID to id", () => {
    expect(resolveLocale(["id-ID"])).toBe("id");
  });

  it("maps en-US to en", () => {
    expect(resolveLocale(["en-US"])).toBe("en");
  });

  it("first id match wins among mixed languages", () => {
    expect(resolveLocale(["fr-FR", "id"])).toBe("id");
  });

  it("empty array falls back to the default locale", () => {
    expect(resolveLocale([])).toBe(DEFAULT_LOCALE);
  });

  it("undefined falls back to the default locale", () => {
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
  });

  it("bare id maps to id", () => {
    expect(resolveLocale(["id"])).toBe("id");
  });

  it("is case-insensitive on the id prefix", () => {
    expect(resolveLocale(["ID-idn"])).toBe("id");
  });
});

describe("isSupportedLocale", () => {
  it("accepts the union members only", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("id")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
    expect(isSupportedLocale(42)).toBe(false);
  });
});

describe("stored locale round-trip", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads back what was written", () => {
    writeStoredLocale("id");
    expect(readStoredLocale()).toBe("id");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("id");
  });

  it("returns undefined when nothing valid is stored", () => {
    expect(readStoredLocale()).toBeUndefined();
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    expect(readStoredLocale()).toBeUndefined();
  });
});

describe("interpolate + translate", () => {
  it("interpolates named params", () => {
    expect(translate(enDictionary, "ui.conclusion.attachAtLeast", { count: 3 })).toBe(
      "Attach at least 3 pieces of evidence.",
    );
  });

  it("leaves unknown params intact", () => {
    expect(interpolate("Case: {title}", {})).toBe("Case: {title}");
  });

  it("returns the template when no params are given", () => {
    expect(interpolate("Case: {title}")).toBe("Case: {title}");
  });

  it("translateAny returns the raw key for unknown keys", () => {
    expect(translateAny(enDictionary, "not.a.real.key")).toBe("not.a.real.key");
  });

  it("translateAny resolves known dynamic keys", () => {
    expect(translateAny(enDictionary, "content.recordType.transit_record")).toBe("Transit record");
  });
});

describe("id dictionary skeleton parity", () => {
  it("has exactly the same keys as the en dictionary", () => {
    const enKeys = Object.keys(enDictionary).sort();
    const idKeys = Object.keys(idDictionary).sort();
    expect(idKeys).toEqual(enKeys);
    expect(idKeys.length).toBe(enKeys.length);
  });

  it("every id value is a non-empty string placeholder", () => {
    for (const key of Object.keys(enDictionary) as TranslationKey[]) {
      expect(typeof idDictionary[key]).toBe("string");
    }
    Object.entries(idDictionary).forEach(([key, value]) => {
      expect(value.trim(), key).not.toBe("");
    });
  });
});

describe("domain-labels", () => {
  it("hintTierLabel", () => {
    expect(hintTierLabel("en", 1)).toBe("Refocus");
    expect(hintTierLabel("en", 4)).toBe("Answer path");
  });

  it("notificationPriorityLabel", () => {
    expect(notificationPriorityLabel("en", "system_anomaly")).toBe("System anomaly");
    expect(notificationPriorityLabel("en", "urgent")).toBe("Urgent");
  });

  it("attachmentTypeLabel with fallback", () => {
    expect(attachmentTypeLabel("en", "image")).toBe("Image");
    expect(attachmentTypeLabel("en", "mystery")).toBe("File");
  });

  it("attachmentLabel interpolates type + index", () => {
    expect(attachmentLabel("en", "audio", 2)).toBe("Audio attachment 2");
  });

  it("windowStateLabel", () => {
    expect(windowStateLabel("en", "minimized")).toBe("minimized");
    expect(windowStateLabel("en", "open")).toBe("open");
  });

  it("persistenceStatusLabel", () => {
    expect(persistenceStatusLabel("en", "saved")).toBe("saved");
    expect(persistenceStatusLabel("en", "error")).toBe("error");
  });

  it("unknown sender/source + true/false labels", () => {
    expect(unknownSenderLabel("en")).toBe("Unknown sender");
    expect(unknownSourceLabel("en")).toBe("Unknown source");
    expect(trueLabel("en")).toBe("True");
    expect(falseLabel("en")).toBe("False");
  });
});

describe("content-labels", () => {
  it("recordTypeLabel", () => {
    expect(recordTypeLabel("en", "transit_record")).toBe("Transit record");
  });

  it("sourceSystemLabel", () => {
    expect(sourceSystemLabel("en", "ferry_archive")).toBe("Ferry archive");
  });

  it("evidenceTypeLabel", () => {
    expect(evidenceTypeLabel("en", "database_record")).toBe("Database record");
  });

  it("metadataKeyLabel", () => {
    expect(metadataKeyLabel("en", "departure_time")).toBe("Departure time");
  });

  it("metadataValueLabel localizes booleans", () => {
    expect(metadataValueLabel("en", "mention_manual_escalation", false)).toBe("False");
    expect(metadataValueLabel("en", "mention_manual_escalation", true)).toBe("True");
  });

  it("metadataValueLabel passes non-booleans through raw", () => {
    expect(metadataValueLabel("en", "gate", "Meridian Ferry Gate")).toBe("Meridian Ferry Gate");
    expect(metadataValueLabel("en", "sync_delay_seconds", "2-8")).toBe("2-8");
  });

  it("unknown enum values fall back to the raw value", () => {
    expect(recordTypeLabel("en", "zzz")).toBe("zzz");
    expect(sourceSystemLabel("en", "zzz")).toBe("zzz");
    expect(metadataKeyLabel("en", "zzz")).toBe("zzz");
  });
});

describe("resolveLocalizedBundle", () => {
  const session = loadCase001Session();
  const bundle = session.content;

  it("returns the same bundle reference for the canonical en locale", () => {
    const overlay: LocalizedCaseOverlay = {
      caseTitle: "should not apply",
      search: { rec_001_ferry_departure: { title: "should not apply" } },
    };
    expect(resolveLocalizedBundle(bundle, overlay, "en")).toBe(bundle);
  });

  it("returns the same bundle reference when there is no overlay", () => {
    expect(resolveLocalizedBundle(bundle, undefined, "id")).toBe(bundle);
  });

  it("overlays the case title while leaving ids/rules/triggers/outcomes identical to en", () => {
    const overlay: LocalizedCaseOverlay = { caseTitle: "Sinyal yang Hilang" };
    const resolved = resolveLocalizedBundle(bundle, overlay, "id");

    expect(resolved.case.title).toBe("Sinyal yang Hilang");
    expect(resolved.case.id).toBe(bundle.case.id);
    expect(resolved.case.triggers).toEqual(bundle.case.triggers);
    expect(resolved.case.outcomes).toEqual(bundle.case.outcomes);
    // input bundle is never mutated
    expect(bundle.case.title).toBe("Missing Signal");
  });

  it("overlays search titles and appends localized terms after en terms", () => {
    const overlay: LocalizedCaseOverlay = {
      search: {
        rec_001_ferry_departure: {
          title: "Catatan Keberangkatan Feri",
          exactTerms: ["kapal feri"],
          aliases: ["catatan feri"],
        },
      },
    };
    const resolved = resolveLocalizedBundle(bundle, overlay, "id");
    const entry = resolved.case.searchableIndex.find((s) => s.entityId === "rec_001_ferry_departure");
    const original = bundle.case.searchableIndex.find((s) => s.entityId === "rec_001_ferry_departure");
    expect(entry).toBeDefined();
    expect(original).toBeDefined();
    if (!entry || !original) return;
    expect(entry.title).toBe("Catatan Keberangkatan Feri");
    // en terms precede id terms (append-after-en, never replace)
    expect(entry.exactTerms).toEqual([...original.exactTerms, "kapal feri"]);
    expect(entry.aliases).toEqual([...original.aliases, "catatan feri"]);
    // input bundle is never mutated
    expect(original.exactTerms).not.toContain("kapal feri");
  });

  it("ignores unknown overlay ids and leaves rules/ids untouched", () => {
    const overlay: LocalizedCaseOverlay = {
      objectives: { obj_does_not_exist: { title: "ghost" } },
      records: { rec_001_ferry_departure: { title: "Catatan Feri" } },
    };
    const resolved = resolveLocalizedBundle(bundle, overlay, "id");
    // unknown objective id is ignored — objective count unchanged
    expect(resolved.case.objectives.length).toBe(bundle.case.objectives.length);
    // known record title applied
    const record = resolved.records.find((r) => r.id === "rec_001_ferry_departure");
    expect(record?.title).toBe("Catatan Feri");
    // trigger rules are deep-equal and untouched
    expect(resolved.case.triggers).toEqual(bundle.case.triggers);
    expect(resolved.case.objectives).toEqual(bundle.case.objectives);
  });

  it("overlays objective, dialogue choice, evidence, hint, notification, ending, puzzle, and conclusion fields", () => {
    const overlay: LocalizedCaseOverlay = {
      objectives: { obj_001_verify_location: { title: "Verifikasi lokasi", description: "Deskripsi" } },
      dialogue: {
        dialogue_001_stage3_pressure: {
          text: "Teks dialog",
          choices: { choice_001_stage3_ciab: { label: "Kirim ke CIAB" } },
        },
      },
      evidence: { ev_001_ferry_departure: { title: "Bukti feri", summary: "Ringkasan" } },
      hints: { hint_001_verify_location_1: { text: "Petunjuk" } },
      notifications: { notification_001_sera_trust: { text: "Notifikasi" } },
      endings: { ending_001_protected_truth: { title: "Judul akhir", body: { sections: ["Bagian"] } } },
      puzzle: {
        puzzle_001_ferry_authenticity: {
          title: "Judul puzzle",
          properties: { property_gate_device: { label: "Gerbang" } },
        },
      },
      conclusion: {
        conclusion_001_missing_signal: {
          claimSlots: {
            claim_001_location: {
              prompt: "Lokasi",
              answerOptions: { claim_001_location_north_barrier: { label: "Koridor" } },
            },
          },
          disclosureChoices: { disclosure_001_mio_full: { label: "Kirim ke MIO" } },
        },
      },
    };
    const resolved = resolveLocalizedBundle(bundle, overlay, "id");

    expect(resolved.case.objectives.find((o) => o.id === "obj_001_verify_location")?.title).toBe(
      "Verifikasi lokasi",
    );
    const node = resolved.dialogue.find((d) => d.id === "dialogue_001_stage3_pressure");
    expect(node?.text).toBe("Teks dialog");
    expect(node?.choices?.find((c) => c.id === "choice_001_stage3_ciab")?.label).toBe("Kirim ke CIAB");
    expect(resolved.evidence.find((e) => e.id === "ev_001_ferry_departure")?.title).toBe("Bukti feri");
    expect(resolved.hints.find((h) => h.id === "hint_001_verify_location_1")?.text).toBe("Petunjuk");
    expect(resolved.notifications.find((n) => n.id === "notification_001_sera_trust")?.text).toBe("Notifikasi");
    const ending = resolved.endings.find((e) => e.id === "ending_001_protected_truth");
    expect(ending?.title).toBe("Judul akhir");
    expect((ending?.body as { sections?: string[] }).sections).toEqual(["Bagian"]);
    const puzzle = resolved.puzzles.find((p) => p.id === "puzzle_001_ferry_authenticity");
    expect(puzzle?.title).toBe("Judul puzzle");
    if (puzzle?.kind === "signal_comparison") {
      expect(puzzle.properties.find((p) => p.id === "property_gate_device")?.label).toBe("Gerbang");
    }
    const conclusion = resolved.conclusions.find((c) => c.id === "conclusion_001_missing_signal");
    const slot = conclusion?.claimSlots.find((s) => s.id === "claim_001_location");
    expect(slot?.prompt).toBe("Lokasi");
    expect(slot?.answerOptions.find((o) => o.id === "claim_001_location_north_barrier")?.label).toBe("Koridor");
    expect(conclusion?.disclosureChoices.find((d) => d.id === "disclosure_001_mio_full")?.label).toBe(
      "Kirim ke MIO",
    );
  });
});
