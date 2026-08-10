import { beforeEach, describe, expect, it } from "vitest";
import { createInMemorySaveRepository } from "./in-memory-save-repository";
import { makeSave, runRepositoryContract } from "./save-repository.contract";
import { encodeSave } from "./save-codec";

describe("InMemorySaveRepository", () => {
  let repo = createInMemorySaveRepository();

  beforeEach(() => {
    repo = createInMemorySaveRepository();
  });

  runRepositoryContract("shared contract", () => repo);

  it("recovers previous when current checksum is tampered via raw seam", async () => {
    await repo.save("slot_test", makeSave());
    const prior = encodeSave({ ...makeSave(), sessionSnapshot: { p: 1 } });
    await repo.delete("slot_test");
    repo.setRawRecordForTests({
      slotId: "slot_test",
      current: { payloadJson: JSON.stringify({ ...makeSave(), sessionSnapshot: { tampered: true } }), checksum: "badbad00" },
      previous: prior,
    });
    const loaded = await repo.load("slot_test");
    expect(loaded!.sessionSnapshot).toEqual({ p: 1 });
  });

  it("throws the current snapshot's failure reason when both are invalid", async () => {
    const previous = encodeSave(makeSave());
    repo.setRawRecordForTests({
      slotId: "slot_test",
      current: { payloadJson: "{}", checksum: "deadbeef" },
      previous: { ...previous, checksum: "deadbeef" },
    });
    await expect(repo.load("slot_test")).rejects.toMatchObject({ code: "checksum_mismatch" });
  });

  it("list agrees with recovery when only previous is valid", async () => {
    const prior = encodeSave({ ...makeSave(), sessionSnapshot: { p: 1 } });
    repo.setRawRecordForTests({
      slotId: "slot_test",
      current: { payloadJson: "{}", checksum: "deadbeef" },
      previous: prior,
    });
    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ slotId: "slot_test", currentCaseId: "case_test" });
  });

  it("unsupported current falls back to a valid previous", async () => {
    const prior = encodeSave({ ...makeSave(), sessionSnapshot: { ok: true } });
    const unsupportedPayload = { ...makeSave(), saveSchemaVersion: 2 };
    delete (unsupportedPayload as { checksum?: string }).checksum;
    const unsupported = {
      payloadJson: JSON.stringify(unsupportedPayload),
      checksum: (await import("./save-codec")).computeChecksum(JSON.stringify(unsupportedPayload)),
    };
    repo.setRawRecordForTests({
      slotId: "slot_test",
      current: unsupported,
      previous: prior,
    });
    const loaded = await repo.load("slot_test");
    expect(loaded!.sessionSnapshot).toEqual({ ok: true });
  });
});
