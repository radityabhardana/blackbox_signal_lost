import { migrateSaveGameV1ToV2 } from "../../domain/saves/save-migration";
import { parseTrustedSaveGameV2 } from "../../domain/saves/session-save-schema";
import type { SaveGameV2 } from "../../domain/saves/session-save-schema";
import type { SaveRepositoryErrorCode, SaveSummary } from "../../domain/saves/types";
import { SAVE_SCHEMA_VERSION, SaveRepositoryError } from "../../domain/saves/types";
import { z } from "zod";

/**
 * Repository-internal storage representation. payloadJson is the exact JSON
 * string persisted AND checksummed; the authoritative on-disk form is never
 * a structured-cloned SaveGame object.
 */
export interface StoredSnapshot {
  payloadJson: string;
  checksum: string;
}

export interface SaveRecord {
  slotId: string;
  current: StoredSnapshot;
  previous?: StoredSnapshot;
}

/** Checksum-excluded save content. */
type SavePayload = Omit<SaveGameV2, "checksum">;

// ---------------------------------------------------------------------------
// JSON safety (ADR-017). The repository accepts genuine JSON values only;
// anything JSON.stringify would silently drop/change is rejected before any
// Zod normalization can paper over it.
// ---------------------------------------------------------------------------

function isJsonSafe(value: unknown): boolean {
  if (value === null) return true;
  switch (typeof value) {
    case "string":
    case "boolean":
      return true;
    case "number":
      return Number.isFinite(value);
    case "undefined":
    case "function":
    case "symbol":
    case "bigint":
      return false;
    case "object": {
      if (Array.isArray(value)) return value.every(isJsonSafe);
      if (Object.getPrototypeOf(value) !== Object.prototype) return false;
      return Object.values(value as Record<string, unknown>).every(isJsonSafe);
    }
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Checksum: FNV-1a 32-bit over the UTF-8 bytes of payloadJson. Integrity tag
// only (corruption detection), not cryptographic security.
// ---------------------------------------------------------------------------

export function computeChecksum(payloadJson: string): string {
  const bytes = new TextEncoder().encode(payloadJson);
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

// ---------------------------------------------------------------------------
// Encode: invest a trusted SaveGame into a StoredSnapshot. The caller
// checksum is never authoritative; it is recomputed from the payload.
// ---------------------------------------------------------------------------

/**
 * Validate + normalize an incoming SaveGame into the stored form. Throws
 * SaveRepositoryError and mutates nothing on failure.
 */
export function encodeSave(value: SaveGameV2): StoredSnapshot {
  // 1. Raw JSON-safety BEFORE Zod can coerce/normalize opaque nested values.
  if (!isJsonSafe(value)) {
    throw new SaveRepositoryError(
      "not_serializable",
      "save contains values that cannot be represented as JSON",
      value.slotId,
    );
  }

  // 2. Envelope structural validation.
  if (value.saveSchemaVersion !== SAVE_SCHEMA_VERSION) {
    throw new SaveRepositoryError(
      "unsupported_version",
      `saveSchemaVersion ${value.saveSchemaVersion} is not supported`,
      value.slotId,
    );
  }

  let envelope: SaveGameV2;
  try {
    envelope = parseTrustedSaveGameV2(value);
  } catch {
    throw new SaveRepositoryError(
      "invalid_input",
      "save does not satisfy the SaveGame V2 schema",
      value.slotId,
    );
  }
  // 4. Drop the caller-supplied checksum; the repository owns it.
  const { checksum: _ignored, ...payloadFields } = envelope;
  const payload: SavePayload = payloadFields;

  // 5-6. Codec round-trip guarantees the persisted form is lossless JSON.
  const payloadJson = JSON.stringify(payload);
  const reparsed: unknown = JSON.parse(payloadJson);
  try {
    if (typeof reparsed !== "object" || reparsed === null || Array.isArray(reparsed)) {
      throw new Error("encoded save is not an object");
    }
    parseTrustedSaveGameV2({ ...reparsed, checksum: "" });
  } catch {
    throw new SaveRepositoryError(
      "not_serializable",
      "save did not survive the repository JSON codec",
      value.slotId,
    );
  }

  return { payloadJson, checksum: computeChecksum(payloadJson) };
}

// ---------------------------------------------------------------------------
// Decode: checksum is verified BEFORE parsing/trust.
// ---------------------------------------------------------------------------

export interface VerifyResultValid {
  ok: true;
  value: SaveGameV2;
}

export type VerifyFailureCode = "checksum_mismatch" | "corrupt" | "unsupported_version";

export interface VerifyResultInvalid {
  ok: false;
  code: VerifyFailureCode;
  message: string;
}

export type VerifyResult = VerifyResultValid | VerifyResultInvalid;

/** Pure verification of a stored snapshot; never throws, never mutates. */
export function verifyStoredSnapshot(snapshot: StoredSnapshot, slotId: string): VerifyResult {
  const expected = computeChecksum(snapshot.payloadJson);
  if (expected !== snapshot.checksum) {
    return { ok: false, code: "checksum_mismatch", message: `checksum mismatch for slot '${slotId}'` };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(snapshot.payloadJson);
  } catch {
    return { ok: false, code: "corrupt", message: `stored payload for slot '${slotId}' is not valid JSON` };
  }

  const payloadRecord = z.record(z.unknown()).safeParse(payload);
  if (!payloadRecord.success) {
    return { ok: false, code: "corrupt", message: `stored payload for slot '${slotId}' is not an object` };
  }

  const reconstructed = { ...payloadRecord.data, checksum: snapshot.checksum };
  const version = z.object({ saveSchemaVersion: z.number().int().min(0) }).passthrough().safeParse(reconstructed);
  if (!version.success) {
    return { ok: false, code: "corrupt", message: `stored payload for slot '${slotId}' has an invalid schema version` };
  }

  if (version.data.saveSchemaVersion === 1) {
    try {
      return { ok: true, value: migrateSaveGameV1ToV2(reconstructed) };
    } catch (error: unknown) {
      return migrationFailure(error, slotId);
    }
  }

  if (version.data.saveSchemaVersion !== SAVE_SCHEMA_VERSION) {
    return {
      ok: false,
      code: "unsupported_version",
      message: `saveSchemaVersion ${version.data.saveSchemaVersion} is not supported`,
    };
  }

  try {
    return { ok: true, value: parseTrustedSaveGameV2(reconstructed) };
  } catch {
    return { ok: false, code: "corrupt", message: `stored payload for slot '${slotId}' failed SaveGame validation` };
  }
}

function migrationFailure(error: unknown, slotId: string): VerifyResultInvalid {
  if (error instanceof SaveRepositoryError) {
    const code: SaveRepositoryErrorCode = error.code;
    if (code === "unsupported_version" || code === "corrupt") {
      return { ok: false, code, message: error.message };
    }
  }
  return { ok: false, code: "corrupt", message: `stored payload for slot '${slotId}' failed migration` };
}

// ---------------------------------------------------------------------------
// Known-good resolution (pure).
// ---------------------------------------------------------------------------

export interface EffectiveSnapshot {
  snapshot: StoredSnapshot;
  value: SaveGameV2;
}

/** Picks the effective loadable snapshot; prefers current, recovers previous. */
export function selectEffectiveSnapshot(
  record: SaveRecord,
  slotId: string,
): { resolved: EffectiveSnapshot } | { failure: VerifyResultInvalid } {
  const currentResult = verifyStoredSnapshot(record.current, slotId);
  if (currentResult.ok) return { resolved: { snapshot: record.current, value: currentResult.value } };

  if (record.previous) {
    const previousResult = verifyStoredSnapshot(record.previous, slotId);
    if (previousResult.ok) return { resolved: { snapshot: record.previous, value: previousResult.value } };
  }

  return { failure: currentResult as VerifyResultInvalid };
}

function toSummary(value: SaveGameV2): SaveSummary {
  return {
    slotId: value.slotId,
    currentCaseId: value.currentCaseId,
    saveSchemaVersion: value.saveSchemaVersion,
    contentVersion: value.contentVersion,
    applicationVersion: value.applicationVersion,
    updatedAt: value.updatedAt,
  };
}

/** Deterministic summaries: effective snapshot per slot, ordered by slotId. */
export function summarizeRecords(records: readonly SaveRecord[]): SaveSummary[] {
  return records
    .map((record) => {
      const resolved = selectEffectiveSnapshot(record, record.slotId);
      if (!("resolved" in resolved)) {
        const failure = resolved.failure;
        throw new SaveRepositoryError(failure.code, failure.message, record.slotId);
      }
      return toSummary(resolved.resolved.value);
    })
    .sort((a, b) => (a.slotId < b.slotId ? -1 : a.slotId > b.slotId ? 1 : 0));
}

/** Choose the next known-good previous from an existing row (pure). */
export function choosePrevious(record: SaveRecord): StoredSnapshot | undefined {
  if (verifyStoredSnapshot(record.current, record.slotId).ok) return record.current;
  if (record.previous && verifyStoredSnapshot(record.previous, record.slotId).ok) return record.previous;
  return undefined;
}
