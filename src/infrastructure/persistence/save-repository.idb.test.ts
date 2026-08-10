import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SaveDatabase } from "./save-db";
import { createIndexedDbSaveRepository } from "./save-repository";
import type { SaveRepository } from "../../domain/saves";
import { makeSave, runRepositoryContract } from "./save-repository.contract";

let counter = 0;

function openTestDatabase(): SaveDatabase {
  const name = `blackbox-saves-test-${++counter}`;
  return new SaveDatabase(name);
}

describe("IndexedDbSaveRepository", () => {
  let db: SaveDatabase;
  let repo: SaveRepository;

  beforeEach(async () => {
    db?.close();
    db = openTestDatabase();
    repo = createIndexedDbSaveRepository(db);
    await db.saves.clear();
  });

  afterEach(() => {
    db.close();
  });

  runRepositoryContract("shared contract", () => repo);

  it("survives closing and reopening the database", async () => {
    const name = `blackbox-saves-test-reopen-${++counter}`;
    const first = new SaveDatabase(name);
    await createIndexedDbSaveRepository(first).save("slot_test", makeSave("slot_test", { contentVersion: "persisted" }));
    first.close();
    const reopened = new SaveDatabase(name);
    const repo2 = createIndexedDbSaveRepository(reopened);
    try {
      const loaded = await repo2.load("slot_test");
      expect(loaded!.contentVersion).toBe("persisted");
    } finally {
      reopened.close();
    }
  });

  it("read verification does not mutate storage", async () => {
    await repo.save("slot_test", makeSave());
    const before = await db.saves.get("slot_test");
    await repo.load("slot_test");
    const after = await db.saves.get("slot_test");
    expect(after).toEqual(before);
  });
});
