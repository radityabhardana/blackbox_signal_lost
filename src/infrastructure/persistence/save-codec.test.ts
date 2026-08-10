import { describe, expect, it } from "vitest";
import { computeChecksum, encodeSave } from "./save-codec";
import { makeSave } from "./save-repository.contract";

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
