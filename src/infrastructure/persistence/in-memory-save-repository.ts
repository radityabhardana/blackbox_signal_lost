import { SaveRepositoryError } from "../../domain/saves";
import type { SaveRepository, SaveSummary } from "../../domain/saves";
import type { SaveGameV2 } from "../../domain/saves";
import {
  choosePrevious,
  encodeSave,
  selectEffectiveSnapshot,
  summarizeRecords,
} from "./save-codec";
import type { SaveRecord } from "./save-codec";

/**
 * Test/dev seam for injecting crafted raw rows (e.g. corrupted snapshots).
 * Not part of the public SaveRepository contract; only reachable via the
 * in-memory module path in tests.
 */
export interface InMemorySaveRepository extends SaveRepository {
  setRawRecordForTests(record: SaveRecord): void;
}

/**
 * In-memory SaveRepository. Full parity with the Dexie adapter: same codec,
 * checksum, version validation, known-good recovery, list semantics, and slot
 * isolation. Raw Map storage stays private to this factory.
 */
export function createInMemorySaveRepository(): InMemorySaveRepository {
  const store = new Map<string, SaveRecord>();

  return {
    async load(slotId: string): Promise<SaveGameV2 | null> {
      const record = store.get(slotId);
      if (!record) return null;
      const resolved = selectEffectiveSnapshot(record, slotId);
      if ("resolved" in resolved) return resolved.resolved.value;
      const failure = resolved.failure;
      throw new SaveRepositoryError(failure.code, failure.message, slotId);
    },

    async save(slotId: string, value: SaveGameV2): Promise<void> {
      if (slotId !== value.slotId) {
        throw new SaveRepositoryError(
          "invalid_input",
          `slotId argument '${slotId}' does not match save slotId '${value.slotId}'`,
          slotId,
        );
      }
      const nextCurrent = encodeSave(value);
      const existing = store.get(slotId);
      const record: SaveRecord = { slotId, current: nextCurrent };
      if (existing) {
        const previous = choosePrevious(existing);
        if (previous) record.previous = previous;
      }
      store.set(slotId, record);
    },

    async delete(slotId: string): Promise<void> {
      store.delete(slotId);
    },

    async list(): Promise<SaveSummary[]> {
      return summarizeRecords([...store.values()]);
    },

    setRawRecordForTests(record: SaveRecord): void {
      store.set(record.slotId, record);
    },
  };
}
