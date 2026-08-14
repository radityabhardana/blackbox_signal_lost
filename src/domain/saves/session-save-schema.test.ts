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
