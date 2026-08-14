import { describe, expect, it } from "vitest";
import { computeChecksum, encodeSave, selectEffectiveSnapshot, verifyStoredSnapshot } from "./save-codec";
import { makeSave } from "./save-repository.contract";
import { migrateSaveGameV1ToV2 } from "@/domain/saves";
import emptyV1Fixture from "@/domain/saves/fixtures/save-v1-empty.json";
import opaqueV1Fixture from "@/domain/saves/fixtures/save-v1-opaque-session.json";

describe("computeChecksum", () => {
  it("is deterministic FNV-1a hex", () => {
    const value = computeChecksum("hello");
    expect(value).toMatch(/^[0-9a-f]{8}$/);
    expect(computeChecksum("hello")).toBe(value);
  });

  it("differs for different payloads", () => {
    expect(computeChecksum("a")).not.toBe(computeChecksum("b"));
  });

  it("encodes over UTF-8 bytes (unicode changes the hash)", () => {
    expect(computeChecksum("ferry term")).not.toBe(computeChecksum("ferry\nterminal"));
    expect(computeChecksum("émile")).not.toBe(computeChecksum("emile"));
  });
});

describe("encodeSave", () => {
  it("checksum excludes the caller checksum field itself", () => {
    const save = makeSave();
    const encodedWith = encodeSave(save);
    const encodedWithout = encodeSave({ ...save, checksum: "different" });
    expect(encodedWith.checksum).toBe(encodedWithout.checksum);
    expect(encodedWith.payloadJson).not.toContain("caller_checksum_ignored");
  });

  it("recomputes, never reusing caller checksum", () => {
    expect(encodeSave(makeSave()).checksum).not.toBe("caller_checksum_ignored");
  });

  it("rejects non-serializable values", () => {
    const bad = makeSave();
    (bad.sessionSnapshot as Record<string, unknown>).x = { f: () => 1 };
    expect(() => encodeSave(bad)).toThrow();
  });
});

describe("verifyStoredSnapshot", () => {
  it("accepts a V2 snapshot", () => {
    const encoded = encodeSave(makeSave());

    expect(verifyStoredSnapshot(encoded, "slot_test")).toMatchObject({ ok: true, value: { saveSchemaVersion: 2 } });
  });

  it("migrates an empty V1 snapshot without rewriting it", () => {
    const payload = { ...emptyV1Fixture };
    delete (payload as { checksum?: string }).checksum;
    const payloadJson = JSON.stringify(payload);
    const stored = { payloadJson, checksum: computeChecksum(payloadJson) };

    const result = verifyStoredSnapshot(stored, "historical_empty_v1");

    expect(result).toMatchObject({ ok: true, value: { saveSchemaVersion: 2 } });
    expect(stored.payloadJson).toBe(payloadJson);
  });

  it("rejects a non-empty V1 snapshot as unsupported", () => {
    const payload = { ...opaqueV1Fixture };
    delete (payload as { checksum?: string }).checksum;
    const payloadJson = JSON.stringify(payload);

    expect(verifyStoredSnapshot({ payloadJson, checksum: computeChecksum(payloadJson) }, "historical_opaque_v1")).toMatchObject({
      ok: false,
      code: "unsupported_version",
    });
  });

  it("rejects a future SaveGame version", () => {
    const payload = { ...makeSave(), saveSchemaVersion: 3 };
    delete (payload as { checksum?: string }).checksum;
    const payloadJson = JSON.stringify(payload);

    expect(verifyStoredSnapshot({ payloadJson, checksum: computeChecksum(payloadJson) }, "slot_test")).toMatchObject({
      ok: false,
      code: "unsupported_version",
    });
  });

  it("rejects a malformed SaveGame version", () => {
    const payload = { ...makeSave(), saveSchemaVersion: "2" };
    delete (payload as { checksum?: string }).checksum;
    const payloadJson = JSON.stringify(payload);

    expect(verifyStoredSnapshot({ payloadJson, checksum: computeChecksum(payloadJson) }, "slot_test")).toMatchObject({
      ok: false,
      code: "corrupt",
    });
  });

  it("falls back from a non-migratable current V1 snapshot to a valid V2 previous", () => {
    const currentPayload = { ...opaqueV1Fixture };
    delete (currentPayload as { checksum?: string }).checksum;
    const currentJson = JSON.stringify(currentPayload);
    const previous = encodeSave(makeSave());

    const result = selectEffectiveSnapshot({
      slotId: "historical_opaque_v1",
      current: { payloadJson: currentJson, checksum: computeChecksum(currentJson) },
      previous,
    }, "historical_opaque_v1");

    expect("resolved" in result && result.resolved.value.saveSchemaVersion).toBe(2);
  });

  it("does not mutate the input passed to the migration", () => {
    const input = JSON.parse(JSON.stringify(emptyV1Fixture)) as typeof emptyV1Fixture;
    const before = JSON.stringify(input);

    migrateSaveGameV1ToV2(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
