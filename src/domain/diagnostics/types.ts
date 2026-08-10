import type { SaveRepositoryErrorCode } from "../saves";

/**
 * Fixed browser-capability summary (docs/08 §13). Exactly two approved fields;
 * no arbitrary capability keys, no user-agent/browser/platform fingerprinting.
 */
export interface BrowserCapabilitySummary {
  readonly indexedDB: boolean;
  readonly serviceWorker: boolean;
}

/**
 * BBX-033 diagnostic inputs. Caller-supplied safe primitives only — no Error
 * objects, no save payloads, no event objects, no store references.
 */
export interface DebugExportInput {
  readonly applicationVersion: string;
  readonly contentVersion?: string;
  readonly recentEventTypes?: readonly string[];
  readonly browserCapabilities: BrowserCapabilitySummary;
  readonly recentErrorCodes?: readonly SaveRepositoryErrorCode[];
}

/**
 * Non-sensitive debug report. Exactly the six documented diagnostic categories
 * (docs/08 §13): application version, save schema version, content version,
 * recent domain event types, browser capability summary, error codes.
 */
export interface DebugReport {
  readonly applicationVersion: string;
  readonly saveSchemaVersion: number;
  readonly contentVersion: string | null;
  readonly recentEventTypes: readonly string[];
  readonly browserCapabilities: BrowserCapabilitySummary;
  readonly errorCodes: readonly SaveRepositoryErrorCode[];
}