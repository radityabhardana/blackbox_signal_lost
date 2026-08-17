import { describe, expect, it } from "vitest";
import {
  parseTrustedSaveGameV2,
  parseSessionSaveSnapshot,
  sessionSaveSnapshotSchema,
} from "./session-save-schema";
import { createInitialEngineState } from "@/domain/engine";
import { createInitialEvidenceBoardState, serializeEvidenceBoardSnapshot } from "@/domain/evidence-board";
import { makeSave } from "@/infrastructure/persistence/save-repository.contract";

function validSessionSnapshot() {
  return {
    version: 1 as const,
    caseEngineState: createInitialEngineState(),
    evidenceBoard: serializeEvidenceBoardSnapshot(createInitialEvidenceBoardState()),
  };
}

describe("sessionSaveSnapshotSchema", () => {
  it("validates a V2 typed session snapshot", () => {
    const snapshot = parseSessionSaveSnapshot(validSessionSnapshot());

    expect(snapshot.version).toBe(1);
    expect(snapshot.caseEngineState.discoveredEntityIds).toEqual([]);
    expect(snapshot.evidenceBoard).toEqual({
      version: 1,
      evidenceNodes: [],
      noteNodes: [],
      edges: [],
      nextNoteSequence: 0,
      nextEdgeSequence: 0,
    });
  });

  it("rejects an unsupported nested session version", () => {
    expect(() => parseSessionSaveSnapshot({ ...validSessionSnapshot(), version: 2 })).toThrow();
  });

  it("existing V2 snapshot without revealedHintIds parses and defaults to []", () => {
    const legacy = validSessionSnapshot();
    delete (legacy.caseEngineState as Partial<typeof legacy.caseEngineState>).revealedHintIds;
    const snapshot = parseSessionSaveSnapshot(legacy);

    expect(snapshot.caseEngineState.revealedHintIds).toEqual([]);
  });

  it("snapshot with revealedHintIds round-trips", () => {
    const snapshot = parseSessionSaveSnapshot({
      ...validSessionSnapshot(),
      caseEngineState: {
        ...createInitialEngineState(),
        revealedHintIds: ["hint_a", "hint_b"],
      },
    });

    expect(snapshot.caseEngineState.revealedHintIds).toEqual(["hint_a", "hint_b"]);
  });

  it("existing V2 snapshot without the BBX-081 fields parses with defaults", () => {
    const legacy = validSessionSnapshot();
    delete (legacy.caseEngineState as Partial<typeof legacy.caseEngineState>).submittedReport;
    delete (legacy.caseEngineState as Partial<typeof legacy.caseEngineState>).selectedOutcomeId;
    delete (legacy.caseEngineState as Partial<typeof legacy.caseEngineState>).caseCompleted;
    const snapshot = parseSessionSaveSnapshot(legacy);

    expect(snapshot.caseEngineState.submittedReport).toBeNull();
    expect(snapshot.caseEngineState.selectedOutcomeId).toBeNull();
    expect(snapshot.caseEngineState.caseCompleted).toBe(false);
  });

  it("snapshot with the BBX-081 fields round-trips", () => {
    const snapshot = parseSessionSaveSnapshot({
      ...validSessionSnapshot(),
      caseEngineState: {
        ...createInitialEngineState(),
        submittedReport: { claimAnswers: { claim_a: "opt_a" } },
        selectedOutcomeId: "outcome_test",
        caseCompleted: true,
      },
    });

    expect(snapshot.caseEngineState.submittedReport).toEqual({ claimAnswers: { claim_a: "opt_a" } });
    expect(snapshot.caseEngineState.selectedOutcomeId).toBe("outcome_test");
    expect(snapshot.caseEngineState.caseCompleted).toBe(true);
  });

  it("rejects a non-object submittedReport", () => {
    const invalid = {
      ...validSessionSnapshot(),
      caseEngineState: { ...createInitialEngineState(), submittedReport: "not-an-object" },
    };

    expect(() => parseSessionSaveSnapshot(invalid)).toThrow();
  });

  it("snapshot without a checkpoint parses with checkpoint null", () => {
    const snapshot = parseSessionSaveSnapshot(validSessionSnapshot());
    expect(snapshot.checkpoint ?? null).toBeNull();
  });

  it("snapshot with a checkpoint round-trips", () => {
    const checkpoint = {
      version: 1 as const,
      caseEngineState: createInitialEngineState(),
      evidenceBoard: serializeEvidenceBoardSnapshot(createInitialEvidenceBoardState()),
    };
    const snapshot = parseSessionSaveSnapshot({
      ...validSessionSnapshot(),
      checkpoint,
    });

    expect(snapshot.checkpoint).toEqual(checkpoint);
  });

  it("rejects a malformed checkpoint", () => {
    const invalid = {
      ...validSessionSnapshot(),
      checkpoint: { version: 1, caseEngineState: { not: "a state" }, evidenceBoard: {} },
    };

    expect(() => parseSessionSaveSnapshot(invalid)).toThrow();
  });

  it("rejects malformed CaseEngineState", () => {
    const invalid = {
      ...validSessionSnapshot(),
      caseEngineState: { ...createInitialEngineState(), discoveredEntityIds: "not-an-array" },
    };

    expect(() => parseSessionSaveSnapshot(invalid)).toThrow();
  });

  it("rejects malformed EvidenceBoardSnapshotV1", () => {
    const invalid = {
      ...validSessionSnapshot(),
      evidenceBoard: { ...validSessionSnapshot().evidenceBoard, version: 2 },
    };

    expect(() => parseSessionSaveSnapshot(invalid)).toThrow();
  });

  it("rejects unknown session fields", () => {
    expect(() => parseSessionSaveSnapshot({ ...validSessionSnapshot(), extra: true })).toThrow();
  });
});

describe("parseTrustedSaveGameV2", () => {
  it("returns a trusted V2 envelope after validating the typed session", () => {
    const value = parseTrustedSaveGameV2({
      ...makeSave(),
      saveSchemaVersion: 2,
      sessionSnapshot: validSessionSnapshot(),
    });

    expect(value.saveSchemaVersion).toBe(2);
    expect(value.sessionSnapshot.version).toBe(1);
    expect(value.sessionSnapshot.caseEngineState.flags).toEqual({});
  });

  it("rejects a V2 envelope with malformed nested state", () => {
    expect(() => parseTrustedSaveGameV2({
      ...makeSave(),
      saveSchemaVersion: 2,
      sessionSnapshot: {
        ...validSessionSnapshot(),
        caseEngineState: { ...createInitialEngineState(), flags: [] },
      },
    })).toThrow();
  });

  it("exposes a strict schema for direct safe parsing", () => {
    expect(sessionSaveSnapshotSchema.safeParse(validSessionSnapshot()).success).toBe(true);
  });
});
