import Dexie from "dexie";
import type { SaveRecord } from "./save-codec";

export const SAVE_DB_NAME = "blackbox-saves";

/**
 * Dexie database for save snapshots. One table keyed by slotId; current +
 * optional known-good previous live on the same row so a single transaction
 * updates them atomically. Internal to the persistence layer.
 */
export class SaveDatabase extends Dexie {
  saves!: Dexie.Table<SaveRecord, string>;

  constructor(name: string = SAVE_DB_NAME) {
    super(name);
    this.version(1).stores({
      saves: "slotId",
    });
  }
}
