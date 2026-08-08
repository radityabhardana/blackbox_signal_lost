import type { PersistedWindowLayout } from "@/domain/windows";
import { LAYOUT_STORAGE_KEY, parseLayout, serializeLayout } from "./layout-schema";

export interface LayoutRepository {
  load(): PersistedWindowLayout | null;
  save(layout: PersistedWindowLayout): void;
  clear(): void;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createLocalStorageLayoutRepository(storage: StorageLike): LayoutRepository {
  return {
    load(): PersistedWindowLayout | null {
      let raw: string | null = null;
      try {
        raw = storage.getItem(LAYOUT_STORAGE_KEY);
      } catch {
        return null;
      }
      return parseLayout(raw);
    },
    save(layout: PersistedWindowLayout): void {
      try {
        storage.setItem(LAYOUT_STORAGE_KEY, serializeLayout(layout));
      } catch {
        // Storage unavailable or quota exceeded: keep the previous value.
      }
    },
    clear(): void {
      try {
        storage.removeItem(LAYOUT_STORAGE_KEY);
      } catch {
        // Ignore: nothing else to recover.
      }
    },
  };
}