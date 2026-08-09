import type { SaveGame } from "../../content/schemas";

/**
 * BBX-030 repository convention (ADR-017): the first implemented save schema
 * version. docs/09 defines only `z.number().int().min(0)`; compatibility is
 * enforced here, not by the schema. BBX-032 owns migrations.
 */
export const SAVE_SCHEMA_VERSION = 1;

export type SaveRepositoryErrorCode =
  | "invalid_input"
  | "checksum_mismatch"
  | "corrupt"
  | "unsupported_version"
  | "storage_unavailable"
  | "not_serializable";

/** Typed repository error. Missing save and "no slot" are never errors. */
export class SaveRepositoryError extends Error {
  readonly code: SaveRepositoryErrorCode;
  readonly slotId?: string | undefined;

  constructor(code: SaveRepositoryErrorCode, message: string, slotId?: string) {
    super(message);
    this.name = "SaveRepositoryError";
    this.code = code;
    this.slotId = slotId;
  }
}

/**
 * Minimal summary derived from SaveGame metadata (ADR-017). Never contains
 * snapshot bodies.
 */
export interface SaveSummary {
  readonly slotId: string;
  readonly currentCaseId: string;
  readonly saveSchemaVersion: number;
  readonly contentVersion: string;
  readonly applicationVersion: string;
  readonly updatedAt: string;
}

/**
 * docs/08 §8 public persistence contract. Domain-, UI-, and infra-neutral.
 * Implementations: IndexedDB (Dexie) and an in-memory adapter for tests/dev.
 */
export interface SaveRepository {
  load(slotId: string): Promise<SaveGame | null>;
  save(slotId: string, value: SaveGame): Promise<void>;
  delete(slotId: string): Promise<void>;
  list(): Promise<SaveSummary[]>;
}
