import { describe, expect, it } from "vitest";
import emptyV1Fixture from "./fixtures/save-v1-empty.json";
import opaqueV1Fixture from "./fixtures/save-v1-opaque-session.json";
import { saveGameSchema } from "@/content/schemas";
import { createInitialEngineState } from "@/domain/engine";
import { createInitialEvidenceBoardState, serializeEvidenceBoardSnapshot } from "@/domain/evidence-board";
import { SaveRepositoryError } from "./types";
import { migrateSaveGameV1ToV2 } from "./save-migration";

describe("migrateSaveGameV1ToV2", () => {
  it("migrates an empty historical V1 session to canonical fresh state", () => {
    const input = saveGameSchema.parse(emptyV1Fixture);
    const before = JSON.stringify(input);
    const migrated = migrateSaveGameV1ToV2(input);

    expect(migrated.saveSchemaVersion).toBe(2);
    expect(migrated.sessionSnapshot).toEqual({
      version: 1,
      caseEngineState: createInitialEngineState(),
      evidenceBoard: serializeEvidenceBoardSnapshot(createInitialEvidenceBoardState()),
    });
    expect(migrated.slotId).toBe(input.slotId);
    expect(migrated.updatedAt).toBe(input.updatedAt);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("fails closed for a non-empty opaque historical V1 session", () => {
    const input = saveGameSchema.parse(opaqueV1Fixture);

    expect(() => migrateSaveGameV1ToV2(input)).toThrowError(
      expect.objectContaining({
        name: "SaveRepositoryError",
        code: "unsupported_version",
      }) as SaveRepositoryError,
    );
  });

  it.each([
    ["null", null],
    ["empty array", []],
    ["non-empty array", ["opaque"]],
    ["string", "opaque"],
    ["number", 7],
    ["boolean", true],
  ] as const)("rejects a malformed V1 sessionSnapshot at the outer schema boundary: %s", (_label, sessionSnapshot) => {
    const input = { ...emptyV1Fixture, sessionSnapshot };

    expect(() => migrateSaveGameV1ToV2(input)).toThrowError(
      expect.objectContaining({
        name: "SaveRepositoryError",
        code: "corrupt",
      }) as SaveRepositoryError,
    );
  });

  it.each([
    ["unexpected property", { foo: "opaque" }],
    ["version-like property", { version: 1 }],
  ] as const)("rejects a non-empty V1 object without reinterpretation: %s", (_label, sessionSnapshot) => {
    const input = { ...emptyV1Fixture, sessionSnapshot };

    expect(() => migrateSaveGameV1ToV2(input)).toThrowError(
      expect.objectContaining({
        name: "SaveRepositoryError",
        code: "unsupported_version",
      }) as SaveRepositoryError,
    );
  });

  it("is deterministic", () => {
    const input = saveGameSchema.parse(emptyV1Fixture);

    expect(migrateSaveGameV1ToV2(input)).toEqual(migrateSaveGameV1ToV2(input));
  });
});
