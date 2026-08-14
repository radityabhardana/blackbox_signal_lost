import type { SaveGameV2 } from "./session-save-schema";

/**
 * BBX-050A3a SaveGame format transition. The outer content schema remains
 * structurally compatible; trusted runtime payloads are SaveGameV2.
 */
export const SAVE_SCHEMA_VERSION = 2;

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
  load(slotId: string): Promise<SaveGameV2 | null>;
  save(slotId: string, value: SaveGameV2): Promise<void>;
  delete(slotId: string): Promise<void>;
  list(): Promise<SaveSummary[]>;
}
