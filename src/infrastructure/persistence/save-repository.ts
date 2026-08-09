import type { SaveGame } from "../../content/schemas";
import { SaveRepositoryError } from "../../domain/saves";
import type { SaveRepository, SaveSummary } from "../../domain/saves";
import { SaveDatabase } from "./save-db";
import {
  choosePrevious,
  encodeSave,
  selectEffectiveSnapshot,
  summarizeRecords,
} from "./save-codec";
import type { SaveRecord } from "./save-codec";

function wrapStorageError(slotId: string, error: unknown): SaveRepositoryError {
  return new SaveRepositoryError(
    "storage_unavailable",
    `save storage operation failed for slot '${slotId}': ${error instanceof Error ? error.message : String(error)}`,
    slotId,
  );
}

/**
 * IndexedDB-backed SaveRepository via Dexie. Each save writes current +
 * previous-known-good within one transaction; load verifies checksum before
 * parsing and falls back to the known-good previous on a bad current.
 */
export function createIndexedDbSaveRepository(db: SaveDatabase): SaveRepository {
  return {
    async load(slotId: string): Promise<SaveGame | null> {
      let record: SaveRecord | undefined;
      try {
        record = await db.saves.get(slotId);
      } catch (error) {
        throw wrapStorageError(slotId, error);
      }
      if (!record) return null;
      const resolved = selectEffectiveSnapshot(record, slotId);
      if ("resolved" in resolved) return resolved.resolved.value;
      const failure = resolved.failure;
      throw new SaveRepositoryError(failure.code, failure.message, slotId);
    },

    async save(slotId: string, value: SaveGame): Promise<void> {
      if (slotId !== value.slotId) {
        throw new SaveRepositoryError(
          "invalid_input",
          `slotId argument '${slotId}' does not match save slotId '${value.slotId}'`,
          slotId,
        );
      }
      // Pure encode/validation happens before any storage mutation.
      const nextCurrent = encodeSave(value);
      try {
        await db.transaction("rw", db.saves, async () => {
          const existing = await db.saves.get(slotId);
          const record: SaveRecord = { slotId, current: nextCurrent };
          if (existing) {
            const previous = choosePrevious(existing);
            if (previous) record.previous = previous;
          }
          await db.saves.put(record);
        });
      } catch (error) {
        throw wrapStorageError(slotId, error);
      }
    },

    async delete(slotId: string): Promise<void> {
      try {
        await db.saves.delete(slotId);
      } catch (error) {
        throw wrapStorageError(slotId, error);
      }
    },

    async list(): Promise<SaveSummary[]> {
      let records: SaveRecord[];
      try {
        records = await db.saves.toArray();
      } catch (error) {
        throw wrapStorageError("", error);
      }
      return summarizeRecords(records);
    },
  };
}
