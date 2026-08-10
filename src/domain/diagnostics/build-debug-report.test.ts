import { describe, expect, it } from "vitest";
import { buildDebugReport, serializeDebugReport } from "./index";
import type { DebugExportInput, DebugReport } from "./index";
import { SAVE_SCHEMA_VERSION } from "../saves";

const FORBIDDEN_EVENT_SENTINEL = "DO_NOT_EXPORT_EVENT_PAYLOAD";
const FORBIDDEN_CAPABILITY_SENTINEL = "DO_NOT_EXPORT_CAPABILITY_KEY";

function baseInput(overrides: Partial<DebugExportInput> = {}): DebugExportInput {
  return {
    applicationVersion: "0.1.0",
    browserCapabilities: { indexedDB: true, serviceWorker: true },
    ...overrides,
  };
}

describe("public shape", () => {
  it("report contains exactly the six documented fields", () => {
    const report = buildDebugReport(baseInput());
    expect(Object.keys(report).sort()).toEqual([
      "applicationVersion",
      "browserCapabilities",
      "contentVersion",
      "errorCodes",
      "recentEventTypes",
      "saveSchemaVersion",
    ]);
  });

  it("saveSchemaVersion equals the imported SAVE_SCHEMA_VERSION", () => {
    const report = buildDebugReport(baseInput());
    expect(report.saveSchemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });

  it("serializes to plain JSON, and serializeDebugReport equals JSON.stringify", () => {
    const report = buildDebugReport(baseInput());
    expect(() => JSON.stringify(report)).not.toThrow();
    expect(serializeDebugReport(report)).toBe(JSON.stringify(report));
  });
});

describe("version metadata", () => {
  it("applicationVersion is preserved exactly", () => {
    const app = "DO_NOT_EXPORT_PLAYER_TEXT_app";
    expect(buildDebugReport(baseInput({ applicationVersion: app })).applicationVersion).toBe(app);
  });

  it("contentVersion is preserved exactly when supplied", () => {
    const content = "DO_NOT_EXPORT_PLAYER_TEXT_content";
    expect(buildDebugReport(baseInput({ contentVersion: content })).contentVersion).toBe(content);
  });

  it("contentVersion absent -> null", () => {
    expect(buildDebugReport(baseInput()).contentVersion).toBeNull();
  });
});

describe("browser capabilities", () => {
  it("preserves the two approved fields", () => {
    const report = buildDebugReport(
      baseInput({ browserCapabilities: { indexedDB: false, serviceWorker: true } }),
    );
    expect(report.browserCapabilities).toEqual({ indexedDB: false, serviceWorker: true });
  });

  it("output contains exactly the two capability keys", () => {
    const report = buildDebugReport(baseInput());
    expect(Object.keys(report.browserCapabilities).sort()).toEqual(["indexedDB", "serviceWorker"]);
  });

  it("a runtime object with an extra property does not leak it", () => {
    const extra = { indexedDB: true, serviceWorker: true, [FORBIDDEN_CAPABILITY_SENTINEL]: "leak" };
    const report = buildDebugReport(baseInput({ browserCapabilities: extra }));
    const serialized = serializeDebugReport(report);
    expect(serialized).not.toContain(FORBIDDEN_CAPABILITY_SENTINEL);
    expect(serialized).not.toContain("leak");
  });
});

describe("event type codes", () => {
  it("valid code preserved", () => {
    expect(buildDebugReport(baseInput({ recentEventTypes: ["evidence_discovered"] })).recentEventTypes).toEqual([
      "evidence_discovered",
    ]);
  });

  it("duplicates preserved", () => {
    expect(
      buildDebugReport(baseInput({ recentEventTypes: ["record_opened", "record_opened"] })).recentEventTypes,
    ).toEqual(["record_opened", "record_opened"]);
  });

  it("chronological order preserved", () => {
    expect(
      buildDebugReport(baseInput({ recentEventTypes: ["a", "b", "c"] })).recentEventTypes,
    ).toEqual(["a", "b", "c"]);
  });

  it("uppercase, spaces, and unsupported punctuation are invalid", () => {
    expect(buildDebugReport(baseInput({ recentEventTypes: ["Upper_Case", "with space", "bad!punctuation"] })).recentEventTypes).toEqual([]);
  });

  it("empty and >64 char codes are invalid; exactly 64 is accepted", () => {
    const empty = "";
    const long = "x".repeat(65);
    const exactly64 = "y".repeat(64);
    expect(buildDebugReport(baseInput({ recentEventTypes: [empty, long, exactly64] })).recentEventTypes).toEqual([exactly64]);
  });

  it("more than 16 valid entries -> last 16 retained", () => {
    const codes = Array.from({ length: 20 }, (_, i) => `code_${i}`);
    expect(buildDebugReport(baseInput({ recentEventTypes: codes })).recentEventTypes).toEqual(codes.slice(-16));
  });

  it("invalid entries are filtered BEFORE taking last 16", () => {
    const payloadLooking = FORBIDDEN_EVENT_SENTINEL;
    const codes = Array.from({ length: 20 }, (_, i) => `code_${i}`);
    const input = [...codes.slice(0, 10), payloadLooking, ...codes.slice(10)];
    const result = buildDebugReport(baseInput({ recentEventTypes: input })).recentEventTypes;
    expect(result).toHaveLength(16);
    expect(result).not.toContain(payloadLooking);
  });

  it("forbidden payload-looking strings never reach serialized output", () => {
    const report = buildDebugReport(
      baseInput({ recentEventTypes: [FORBIDDEN_EVENT_SENTINEL, "ok", "{\"a\":1}"] }),
    );
    const serialized = serializeDebugReport(report);
    expect(serialized).not.toContain(FORBIDDEN_EVENT_SENTINEL);
    expect(serialized).not.toContain('"a":1');
    expect(report.recentEventTypes).toEqual(["ok"]);
  });

  it("absent event codes -> []", () => {
    expect(buildDebugReport(baseInput()).recentEventTypes).toEqual([]);
  });
});

describe("error codes", () => {
  it("typed values are preserved with order and duplicates", () => {
    const codes = ["checksum_mismatch", "corrupt", "checksum_mismatch"] as const;
    expect(buildDebugReport(baseInput({ recentErrorCodes: [...codes] })).errorCodes).toEqual([...codes]);
  });

  it("absent -> []", () => {
    expect(buildDebugReport(baseInput()).errorCodes).toEqual([]);
  });
});

describe("sensitive-leak separation", () => {
  it("allowed opaque version metadata passes through", () => {
    const report = buildDebugReport(
      baseInput({
        applicationVersion: "DO_NOT_EXPORT_PLAYER_TEXT",
        contentVersion: "DO_NOT_EXPORT_PLAYER_TEXT",
      }),
    );
    expect(report.applicationVersion).toBe("DO_NOT_EXPORT_PLAYER_TEXT");
    expect(report.contentVersion).toBe("DO_NOT_EXPORT_PLAYER_TEXT");
  });

  it("forbidden sentinels appear only through filtered paths and never in output", () => {
    const report = buildDebugReport(
      baseInput({
        recentEventTypes: [FORBIDDEN_EVENT_SENTINEL, "valid_code"],
        browserCapabilities: {
          indexedDB: true,
          serviceWorker: true,
          [FORBIDDEN_CAPABILITY_SENTINEL]: true,
        } as DebugExportInput["browserCapabilities"],
      }),
    );
    const serialized = serializeDebugReport(report);
    expect(serialized).not.toContain(FORBIDDEN_EVENT_SENTINEL);
    expect(serialized).not.toContain(FORBIDDEN_CAPABILITY_SENTINEL);
    expect(JSON.parse(serialized) as DebugReport).toEqual(report);
  });
});

describe("determinism and immutability", () => {
  it("same input -> deep-equal report repeatedly", () => {
    const input = baseInput({
      contentVersion: "1.0.0",
      recentEventTypes: ["a", "b", "c", "invalid space", "d"],
      recentErrorCodes: ["corrupt", "unsupported_version"],
    });
    const first = buildDebugReport(input);
    for (let i = 0; i < 10; i++) {
      expect(buildDebugReport(input)).toEqual(first);
    }
  });

  it("same report -> identical serialized output repeatedly", () => {
    const report = buildDebugReport(baseInput({ recentEventTypes: ["a", "b"] }));
    const serialized = serializeDebugReport(report);
    for (let i = 0; i < 10; i++) {
      expect(serializeDebugReport(report)).toBe(serialized);
    }
  });

  it("does not mutate any caller input", () => {
    const eventTypes = ["a", "b", "BAD SPACE", "c"];
    const errorCodes = ["corrupt", "invalid_input"] as const;
    const capabilities = { indexedDB: true, serviceWorker: false };
    const input = baseInput({ recentEventTypes: eventTypes, recentErrorCodes: [...errorCodes], browserCapabilities: capabilities });
    const before = JSON.stringify(input);
    const report = buildDebugReport(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(report).not.toBe(input);
  });
});