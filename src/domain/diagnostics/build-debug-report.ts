import { SAVE_SCHEMA_VERSION } from "../saves";
import type { DebugExportInput, DebugReport } from "./types";

// ADR-020 BBX-033 export-safety conventions (docs-silent; not engine semantics).
const EVENT_CODE_PATTERN = /^[a-z0-9_-]{1,64}$/;
const MAX_RECENT_EVENT_CODES = 16;

function sanitizeEventCodes(codes: readonly string[] | undefined): string[] {
  const valid = (codes ?? []).filter((code) => EVENT_CODE_PATTERN.test(code));
  return valid.slice(-MAX_RECENT_EVENT_CODES);
}

/**
 * Builds a non-sensitive debug report from caller-supplied primitives.
 * Pure, deterministic, total over its typed input; never mutates inputs; no
 * Date/random/persistence/browser access. Fields are constructed in a fixed
 * declared order so serialization is stable.
 */
export function buildDebugReport(input: DebugExportInput): DebugReport {
  return {
    applicationVersion: input.applicationVersion,
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
    contentVersion: input.contentVersion ?? null,
    recentEventTypes: sanitizeEventCodes(input.recentEventTypes),
    browserCapabilities: {
      indexedDB: input.browserCapabilities.indexedDB,
      serviceWorker: input.browserCapabilities.serviceWorker,
    },
    errorCodes: [...(input.recentErrorCodes ?? [])],
  };
}

/**
 * Serializes a report as plain JSON (fixed field order comes from the
 * builder's declared object shape). No pretty-printing, no browser APIs.
 *
 * The serializer is itself a privacy choke point (ADR-020): it re-projects
 * the six allowed fields explicitly so runtime-extra properties on an
 * externally-forged/cast object (or extras nested inside browserCapabilities)
 * are discarded rather than stringified. Never JSON.stringify(report) directly.
 */
export function serializeDebugReport(report: DebugReport): string {
  return JSON.stringify({
    applicationVersion: report.applicationVersion,
    saveSchemaVersion: report.saveSchemaVersion,
    contentVersion: report.contentVersion,
    recentEventTypes: [...report.recentEventTypes],
    browserCapabilities: {
      indexedDB: report.browserCapabilities.indexedDB,
      serviceWorker: report.browserCapabilities.serviceWorker,
    },
    errorCodes: [...report.errorCodes],
  });
}