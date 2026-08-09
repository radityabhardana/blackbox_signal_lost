import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosaveCoordinator } from "./autosave-coordinator";
import type { AutosaveReason } from "./autosave-coordinator";
import type { SaveRepository } from "./types";
import { SaveRepositoryError } from "./types";
import type { SaveGame } from "../../content/schemas";
import { makeSave } from "../../infrastructure/persistence/save-repository.contract";

const ALL_REASONS: AutosaveReason[] = [
  "evidence_discovered",
  "objective_completed",
  "message_choice",
  "puzzle_completed",
  "report_submitted",
];

interface DeferredCall {
  slotId: string;
  value: SaveGame;
  readonly promise: Promise<void>;
  reject(error: unknown): void;
  resolve(): void;
}

interface ControlledRepository {
  readonly calls: DeferredCall[];
  readonly repo: SaveRepository;
}

function defer(): DeferredCall {
  let resolveFn: () => void = () => undefined;
  let rejectFn: (error: unknown) => void = () => undefined;
  const promise = new Promise<void>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  return {
    slotId: "",
    value: undefined as unknown as SaveGame,
    promise,
    resolve: () => resolveFn(),
    reject: (error: unknown) => rejectFn(error),
  };
}

function makeControlledRepository(): ControlledRepository {
  const calls: DeferredCall[] = [];
  const repo: SaveRepository = {
    load: async () => null,
    delete: async () => undefined,
    list: async () => [],
    save: (_slotId, value) => {
      const deferred = defer();
      deferred.slotId = _slotId;
      deferred.value = value;
      calls.push(deferred);
      return deferred.promise;
    },
  };
  return { calls, repo };
}

function clearRecording(calls: DeferredCall[]): void {
  calls.length = 0;
}
void clearRecording;

async function tick(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function makeSnapshotProvider(initial: SaveGame) {
  let current = initial;
  let callCount = 0;
  return {
    getSnapshot: () => {
      callCount += 1;
      return current;
    },
    setSnapshot: (next: SaveGame) => {
      current = next;
    },
    calls: () => callCount,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // Best-effort: settle nothing may be outstanding here because each test completes its writes.
  void 0;
  vi.useRealTimers();
});

function makeCoordinator(options: {
  repo: SaveRepository;
  getSnapshot: () => SaveGame;
  slotId?: string;
  debounceMs?: number;
}) {
  return createAutosaveCoordinator({
    slotId: options.slotId ?? "slot_test",
    getSnapshot: options.getSnapshot,
    repository: options.repo,
    debounceMs: options.debounceMs ?? 800,
  });
}

describe("debounce semantics", () => {
  it("A single request does not save immediately; at 800ms one save begins", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    expect(calls).toHaveLength(0);
    expect(snapshot.calls()).toBe(0);

    await vi.advanceTimersByTimeAsync(799);
    expect(calls).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(1);
    expect(snapshot.calls()).toBe(1);

    calls[0]!.resolve();
    await tick();
    expect(coordinator.isSaving).toBe(false);
    expect(coordinator.hasPendingSave).toBe(false);
  });

  it("Each request resets the trailing 800ms timer", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(500);
    coordinator.requestSave("objective_completed");
    await vi.advanceTimersByTimeAsync(799);
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(1);

    calls[0]!.resolve();
    await tick();
    expect(coordinator.hasPendingSave).toBe(false);
  });

  it("Burst coalesces into a single save", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    coordinator.requestSave("message_choice");
    coordinator.requestSave("puzzle_completed");
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(1);

    calls[0]!.resolve();
    await tick();
    expect(coordinator.hasPendingSave).toBe(false);
  });

  it("Five documented reasons each schedule identically", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

      for (const reason of ALL_REASONS) {
      coordinator.requestSave(reason);
      await vi.advanceTimersByTimeAsync(800);
      expect(calls).toHaveLength(1);
      calls[0]!.resolve();
      await tick();
      expect(coordinator.hasPendingSave).toBe(false);
      calls.length = 0;
    }
  });
  it("Snapshot provider is only called at write-start and returns the newest state", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave("slot_test", { currentCaseId: "case_a" }));
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("message_choice");
    snapshot.setSnapshot(makeSave("slot_test", { currentCaseId: "case_b" }));
    expect(snapshot.calls()).toBe(0);
    await vi.advanceTimersByTimeAsync(800);
    expect(snapshot.calls()).toBe(1);
    expect(calls[0]!.value.currentCaseId).toBe("case_b");
    calls[0]!.resolve();
    await tick();
  });
});

describe("single-flight + follow-up", () => {
  it("Request during an in-flight save does not start a second concurrent save; follow-up starts after settle with fresh snapshot", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave("slot_test", { currentCaseId: "case_a" }));
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800); // A starts
    expect(calls).toHaveLength(1);

    coordinator.requestSave("objective_completed");
    await vi.advanceTimersByTimeAsync(800); // B becomes ready while A in-flight
    expect(calls).toHaveLength(1); // still only A

    snapshot.setSnapshot(makeSave("slot_test", { currentCaseId: "case_b" }));
    calls[0]!.resolve(); // A settles
    await tick();
    expect(calls).toHaveLength(2); // follow-up now starts
    expect(snapshot.calls()).toBe(2);
    expect(calls[1]!.value.currentCaseId).toBe("case_b");

    calls[1]!.resolve();
    await tick();
    expect(coordinator.isSaving).toBe(false);
    expect(coordinator.hasPendingSave).toBe(false);
  });

  it("A request that arrives while its own timer hasn't expired gets the full trailing window before writing", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800); // A starts
    calls[0]!.resolve();
    await tick(); // A settles, no pending

    coordinator.requestSave("message_choice");
    await vi.advanceTimersByTimeAsync(799);
    expect(calls).toHaveLength(1); // no write yet
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2); // now it runs
    calls[1]!.resolve();
    await tick();
  });
});

describe("failure behavior", () => {
  it("A failed generation is not immediately retried; advancing timers causes no retry", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800); // save gen 1
    expect(calls).toHaveLength(1);

    const failure = new SaveRepositoryError("checksum_mismatch", "bad");
    calls[0]!.reject(failure);
    await tick();

    expect(coordinator.lastError).toBe(failure);
    expect(coordinator.hasPendingSave).toBe(true);
    expect(calls).toHaveLength(1); // no five immediate retry
    await vi.advanceTimersByTimeAsync(5000);
    expect(calls).toHaveLength(1); // no timer-triggered retry with no newer request
  });

  it("A newer ready request that arrives AFTER a failure may start (fresh snapshot), and clears error on success", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave("slot_test", { currentCaseId: "case_bad" }));
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800);
    const firstFailure = new SaveRepositoryError("checksum_mismatch", "bad1");
    calls[0]!.reject(firstFailure);
    await tick();
    expect(coordinator.lastError).toBe(firstFailure);

    coordinator.requestSave("objective_completed"); // new gen 2
    await vi.advanceTimersByTimeAsync(800); // trailing debounce expires
    expect(calls).toHaveLength(2);
    snapshot.setSnapshot(makeSave("slot_test", { currentCaseId: "case_good" }));
    expect(snapshot.calls()).toBe(2);

    calls[1]!.resolve();
    await tick();
    expect(coordinator.lastError).toBeNull();
    expect(coordinator.hasPendingSave).toBe(false);
  });

  it("Failing write A while newer generation ready: A is NOT retried; N starts exactly once; N succeeds clears state", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered"); // G=1 starts
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(1);

    coordinator.requestSave("objective_completed"); // N=2
    await vi.advanceTimersByTimeAsync(800); // N ready, but A in-flight
    expect(calls).toHaveLength(1);

    const failure = new SaveRepositoryError("storage_unavailable", "io");
    calls[0]!.reject(failure);
    await tick();
    expect(coordinator.lastError).toBe(failure);
    expect(calls).toHaveLength(2); // N started immediately after failure
    expect(calls[1]!.slotId).toBe("slot_test");

    calls[1]!.resolve();
    await tick();
    expect(coordinator.lastError).toBeNull();
    expect(coordinator.hasPendingSave).toBe(false);
  });
});

describe("flush", () => {
  it("flush() cancels debounce, saves immediately with fresh snapshot, and resolves", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    expect(calls).toHaveLength(0);

    const flushPromise = coordinator.flush();
    await tick();
    expect(calls).toHaveLength(1);
    expect(snapshot.calls()).toBe(1);
    calls[0]!.resolve();
    await flushPromise;
    expect(coordinator.hasPendingSave).toBe(false);
  });

  it("flush() with nothing pending resolves without touching repository", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    await coordinator.flush();
    expect(calls).toHaveLength(0);
    expect(snapshot.calls()).toBe(0);
  });

  it("flush() during active write waits, then drains the newest pending generation", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800); // write A starts
    expect(calls).toHaveLength(1);

    coordinator.requestSave("objective_completed"); // slots gen 2 while A active
    const flushPromise = coordinator.flush();
    await tick(); // allow flush to await current in-flight
    expect(calls).toHaveLength(1); // no concurrent second write yet
    calls[0]!.resolve(); // A settles
    await tick();
    expect(calls).toHaveLength(2); // flush-driven follow-up started immediately (no 800ms wait)
    calls[1]!.resolve();
    await flushPromise;
    expect(coordinator.hasPendingSave).toBe(false);
  });

  it("flush() while no dirty work but active write in-flight just waits for it (no extra save)", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(1);

    const flushPromise = coordinator.flush(); // active A, no new dirty
    await tick();
    calls[0]!.resolve();
    await flushPromise;
    expect(calls).toHaveLength(1);
    expect(snapshot.calls()).toBe(1);
  });

  it("flush() on failed active write rejects with the exact original error and does not auto-retry within that call", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800);
    const failure = new SaveRepositoryError("checksum_mismatch", "precise");
    calls[0]!.reject(failure);

    await expect(coordinator.flush()).rejects.toBe(failure as never);
    expect(coordinator.lastError).toBe(failure);
    expect(calls).toHaveLength(1);
  });

  it("A failed flush's generation remains dirty so a later flush can retry once and succeed", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800);
    const failure = new SaveRepositoryError("corrupt", "bad-data");
    calls[0]!.reject(failure);
    await expect(coordinator.flush()).rejects.toBe(failure as never);
    expect(coordinator.hasPendingSave).toBe(true);

    snapshot.setSnapshot(makeSave("slot_test", { currentCaseId: "case_recovered" }));
    const retry = coordinator.flush(); // explicit retry should start immediately
    await tick();
    expect(calls).toHaveLength(2);
    expect(calls[1]!.value.currentCaseId).toBe("case_recovered");
    calls[1]!.resolve();
    await retry;
    expect(coordinator.hasPendingSave).toBe(false);
    expect(coordinator.lastError).toBeNull();
  });
});

describe("dispose", () => {
  it("clears the timer and ignores follow-up work; requestSave becomes no-op", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    coordinator.dispose();
    await vi.advanceTimersByTimeAsync(5000);
    expect(calls).toHaveLength(0);

    coordinator.requestSave("message_choice");
    await vi.advanceTimersByTimeAsync(5000);
    expect(calls).toHaveLength(0);
    await coordinator.flush();
    expect(calls).toHaveLength(0);
  });

  it("dispose does not cancel an already-started write and no follow-up starts afterward", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave());
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800); // write starts
    expect(calls).toHaveLength(1);

    coordinator.requestSave("objective_completed"); // signal gen 2 would follow in a live coordinator
    coordinator.dispose();
    calls[0]!.resolve();
    await tick();
    await vi.advanceTimersByTimeAsync(5000);
    expect(calls).toHaveLength(1); // no follow-up save
    expect(coordinator.hasPendingSave).toBe(false);
  });
});

describe("boundaries", () => {
  it("configured slotId is passed verbatim to repository.save", async () => {
    const { repo, calls } = makeControlledRepository();
    const snapshot = makeSnapshotProvider(makeSave("slot_a"));
    const coordinator = makeCoordinator({ repo, getSnapshot: snapshot.getSnapshot, slotId: "slot_a" });

    coordinator.requestSave("evidence_discovered");
    await vi.advanceTimersByTimeAsync(800);
    expect(calls[0]!.slotId).toBe("slot_a");
    calls[0]!.resolve();
    await tick();
  });
});
