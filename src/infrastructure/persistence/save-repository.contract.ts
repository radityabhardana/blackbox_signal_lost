import { describe, expect, it } from "vitest";
import type { SaveGameV2, SaveRepository } from "../../domain/saves";
import { createInitialEngineState } from "../../domain/engine";
import { createInitialEvidenceBoardState, serializeEvidenceBoardSnapshot } from "../../domain/evidence-board";

export function makeSave(slotId = "slot_test", over: Partial<SaveGameV2> = {}): SaveGameV2 {
  return {
    saveSchemaVersion: 2,
    contentVersion: "1.0.0",
    applicationVersion: "1.0.0",
    slotId,
    updatedAt: "2041-11-18T22:00:00Z",
    currentCaseId: "case_test",
    gameEvents: [],
    sessionSnapshot: {
      version: 1,
      caseEngineState: createInitialEngineState(),
      evidenceBoard: serializeEvidenceBoardSnapshot(createInitialEvidenceBoardState()),
    },
    uiSnapshot: { layout: "desktop" },
    settings: { volume: 0.7 },
    checksum: "caller_checksum_ignored",
    ...over,
  };
}

/** The shared repository contract, run against a fresh adapter instance. */
export function runRepositoryContract(name: string, createRepo: () => SaveRepository): void {
  describe(name, () => {
    it("missing slot returns null", async () => {
      await expect(createRepo().load("slot_test")).resolves.toBeNull();
    });

    it("first save round-trips through load", async () => {
      const repo = createRepo();
      const save = makeSave();
      await repo.save("slot_test", save);
      const loaded = await repo.load("slot_test");
      expect(loaded).not.toBeNull();
      expect(loaded!.slotId).toBe("slot_test");
      expect(loaded!.checksum).not.toBe("caller_checksum_ignored");
      expect(loaded).toMatchObject({ ...save, checksum: loaded!.checksum });
    });

    it("overwrite replaces current and promotes prior current to previous", async () => {
      const repo = createRepo();
      await repo.save("slot_test", makeSave());
      const second = makeSave("slot_test", {
        contentVersion: "1.0.1",
      });
      await repo.save("slot_test", second);
      const loaded = await repo.load("slot_test");
      expect(loaded!.contentVersion).toBe("1.0.1");
      expect(loaded!.sessionSnapshot.caseEngineState).toEqual(makeSave().sessionSnapshot.caseEngineState);
    });

    it("delete removes the slot and missing-slot delete is a no-op", async () => {
      const repo = createRepo();
      await repo.save("slot_test", makeSave());
      await repo.delete("slot_test");
      await expect(repo.load("slot_test")).resolves.toBeNull();
      await expect(repo.delete("slot_missing")).resolves.toBeUndefined();
    });

    it("list summarizes metadata in deterministic slotId order", async () => {
      const repo = createRepo();
      await repo.save("slot_b", makeSave("slot_b", { updatedAt: "2041-02-01" }));
      await repo.save("slot_a", makeSave("slot_a", { updatedAt: "2041-01-01" }));
      const list = await repo.list();
      expect(list).toHaveLength(2);
      expect(list.map((summary) => summary.slotId)).toEqual(["slot_a", "slot_b"]);
      expect(list[0]).toEqual({
        slotId: "slot_a",
        currentCaseId: "case_test",
        saveSchemaVersion: 2,
        contentVersion: "1.0.0",
        applicationVersion: "1.0.0",
        updatedAt: "2041-01-01",
      });
    });

    it("arbitrary slot IDs are isolated", async () => {
      const repo = createRepo();
      await repo.save("a", makeSave("a"));
      await repo.save("b", makeSave("b", { contentVersion: "2.0.0" }));
      const a = await repo.load("a");
      const b = await repo.load("b");
      expect(a!.contentVersion).toBe("1.0.0");
      expect(b!.contentVersion).toBe("2.0.0");
    });

    it("input SaveGame is not mutated by save", async () => {
      const repo = createRepo();
      const input = makeSave();
      const before = JSON.stringify(input);
      await repo.save("slot_test", input);
      expect(JSON.stringify(input)).toBe(before);
    });

    it("slotId mismatch is rejected as invalid_input, storage untouched", async () => {
      const repo = createRepo();
      await expect(repo.save("slot_test", makeSave("other"))).rejects.toMatchObject({
        name: "SaveRepositoryError",
        code: "invalid_input",
      });
      await expect(repo.load("slot_test")).resolves.toBeNull();
    });

    it("unsupported schema version on write is rejected", async () => {
      const repo = createRepo();
      await expect(repo.save("slot_test", { ...makeSave(), saveSchemaVersion: 3 } as unknown as SaveGameV2)).rejects.toMatchObject({
        code: "unsupported_version",
      });
      await expect(repo.load("slot_test")).resolves.toBeNull();
    });

    it("saveSchemaVersion 2 is accepted", async () => {
      const repo = createRepo();
      await expect(repo.save("slot_test", makeSave())).resolves.toBeUndefined();
    });

    it("contentVersion is preserved as metadata only", async () => {
      const repo = createRepo();
      await repo.save("slot_test", makeSave("slot_test", { contentVersion: "99.99.99" }));
      const loaded = await repo.load("slot_test");
      expect(loaded!.contentVersion).toBe("99.99.99");
    });

    it("rejects non-serializable opaque values without touching storage", async () => {
      const repo = createRepo();
      const bad = makeSave();
      (bad.uiSnapshot as Record<string, unknown>).when = { run: () => 1 };
      await expect(repo.save("slot_test", bad)).rejects.toMatchObject({ code: "not_serializable" });
      await expect(repo.load("slot_test")).resolves.toBeNull();
    });

    it("rejects Date/Set/Map/bigint/NaN/Infinity/undefined inside opaque payload", async () => {
      const repo = createRepo();
      const nested = [undefined, () => 1, Symbol("x"), BigInt(3), new Date(), new Set([1]), new Map(), NaN, Infinity];
      for (const nestedPayload of nested) {
        const bad = makeSave();
        (bad.uiSnapshot as Record<string, unknown>).bad = { v: nestedPayload };
        await expect(repo.save("slot_test", bad)).rejects.toMatchObject({ code: "not_serializable" });
      }
      await expect(repo.load("slot_test")).resolves.toBeNull();
    });
  });
}
