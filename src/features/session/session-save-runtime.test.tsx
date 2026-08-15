import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import { createInitialEngineState, type CaseEngineState } from "@/domain/engine";
import { createEvidenceBoardNote, createInitialEvidenceBoardState, serializeEvidenceBoardSnapshot, syncDiscoveredEvidence } from "@/domain/evidence-board";
import type { SaveRepository, SaveGameV2 } from "@/domain/saves";
import { makeSave } from "@/infrastructure/persistence/save-repository.contract";
import type { SaveDatabase } from "@/infrastructure/persistence";
import { CaseSessionProvider, useCaseSession } from "./case-session";
import {
  createSaveRuntimeController,
  createCloseOnce,
  resolveSessionSave,
  SessionSaveRuntime,
  type PersistenceStatus,
} from "./session-save-runtime";
import { EvidenceBoardProvider } from "@/features/evidence-board/evidence-board-provider";
import { createEvidenceBoardTestSession } from "@/test/fixtures/evidence-board-content";
import { createNotificationTestSession } from "@/test/fixtures/notification-content";

function makeRepository(onSave: (value: SaveGameV2) => Promise<void>): SaveRepository {
  return {
    load: async () => null,
    save: async (_slotId, value) => onSave(value),
    delete: async () => undefined,
    list: async () => [],
  };
}

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => undefined;
  let rejectPromise: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return {
    promise,
    resolve: (value) => resolvePromise(value),
    reject: (error) => rejectPromise(error),
  };
}

function makeLoadingRepository(
  onSave: (value: SaveGameV2) => Promise<void> = async () => undefined,
  onLoadStart?: (slotId: string) => void,
) {
  const loads: Array<{ slotId: string; deferred: Deferred<SaveGameV2 | null> }> = [];
  const repository: SaveRepository = {
    load: async (slotId) => {
      onLoadStart?.(slotId);
      const pending = deferred<SaveGameV2 | null>();
      loads.push({ slotId, deferred: pending });
      return pending.promise;
    },
    save: async (_slotId, value) => onSave(value),
    delete: async () => undefined,
    list: async () => [],
  };
  return { loads, repository };
}

function makeDatabaseFactory() {
  const resources: Array<{ database: SaveDatabase; close: ReturnType<typeof vi.fn> }> = [];
  return {
    resources,
    databaseFactory: () => {
      const close = vi.fn();
      const database = { close } as unknown as SaveDatabase;
      resources.push({ database, close });
      return database;
    },
  };
}

function makeRuntimeSave(
  slotId: string,
  fixture: { readonly content: ContentBundle; readonly initialState: CaseEngineState },
  noteText: string,
  state: CaseEngineState = fixture.initialState,
): SaveGameV2 {
  const board = createEvidenceBoardNote(
    syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, state.discoveredEntityIds),
    noteText,
    { x: 321, y: 654 },
  );
  return makeSave(slotId, {
    sessionSnapshot: {
      version: 1,
      caseEngineState: state,
      evidenceBoard: serializeEvidenceBoardSnapshot(board),
    },
  });
}

function makeDeferredWriteRepository() {
  const writes: Array<Deferred<void>> = [];
  let activeWrites = 0;
  let maximumActiveWrites = 0;
  const repository: SaveRepository = {
    load: async () => null,
    save: async () => {
      const write = deferred<void>();
      writes.push(write);
      activeWrites += 1;
      maximumActiveWrites = Math.max(maximumActiveWrites, activeWrites);
      try {
        await write.promise;
      } finally {
        activeWrites -= 1;
      }
    },
    delete: async () => undefined,
    list: async () => [],
  };
  return { repository, writes, maximumActiveWrites: () => maximumActiveWrites };
}

function makeDiscoveryControllerFixture() {
  const fixture = createEvidenceBoardTestSession();
  const content = contentBundleSchema.parse({
    ...fixture.content,
    evidence: [...fixture.content.evidence, { ...fixture.content.evidence[0]!, id: "evidence_pending" }],
  });
  const initialState = createInitialEngineState();
  const initialBoard = syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, initialState.discoveredEntityIds);
  const discoveredState = {
    ...initialState,
    discoveredEntityIds: ["evidence_pending"],
    eventHistory: [{ type: "evidence_discovered", entityId: "evidence_pending" }],
  };
  const objectiveState = {
    ...discoveredState,
    completedObjectives: ["objective_test"],
  };
  const reconciledBoard = syncDiscoveredEvidence(initialBoard, content, discoveredState.discoveredEntityIds);
  return { content, initialState, initialBoard, discoveredState, objectiveState, reconciledBoard };
}

function DiscoveryProbe() {
  const session = useCaseSession();
  return <button type="button" onClick={() => session.dispatch({ kind: "evidence_discovered", evidenceId: "evidence_pending" })}>Discover</button>;
}

describe("session save runtime controller", () => {
  it("uses a fresh reconciled session when the selected slot is missing", async () => {
    const fixture = createEvidenceBoardTestSession();
    const initialState = createInitialEngineState();
    const resolved = await resolveSessionSave({
      repository: makeRepository(async () => undefined),
      slotId: "slot_test",
      content: fixture.content,
      initialState,
    });

    expect(resolved.restoredFromSave).toBe(false);
    expect(resolved.caseEngineState).toEqual(initialState);
    expect(resolved.evidenceBoard.evidenceNodes).toEqual([]);
  });

  it("rejects a valid save with incompatible case identity", async () => {
    const fixture = createEvidenceBoardTestSession();
    const repository: SaveRepository = {
      ...makeRepository(async () => undefined),
      load: async () => ({
        saveSchemaVersion: 2,
        contentVersion: fixture.content.case.version,
        applicationVersion: "0.1.0",
        slotId: "slot_test",
        updatedAt: "2041-11-18T22:00:00Z",
        currentCaseId: "case_other",
        gameEvents: [],
        sessionSnapshot: {
          version: 1,
          caseEngineState: createInitialEngineState(),
          evidenceBoard: { version: 1, evidenceNodes: [], noteNodes: [], edges: [], nextNoteSequence: 0, nextEdgeSequence: 0 },
        },
        uiSnapshot: {},
        settings: {},
        checksum: "trusted",
      }),
    };

    await expect(resolveSessionSave({
      repository,
      slotId: "slot_test",
      content: fixture.content,
      initialState: createInitialEngineState(),
    })).rejects.toThrow("does not match current case");
  });

  it("does not report saved before a decorated repository write resolves", async () => {
    vi.useFakeTimers();
    let resolveSave: () => void = () => undefined;
    const save = new Promise<void>((resolve) => { resolveSave = resolve; });
    const statuses: PersistenceStatus[] = [];
    const fixture = createEvidenceBoardTestSession();
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, fixture.initialState.discoveredEntityIds),
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async () => save),
      onPersistenceStatusChange: (status) => statuses.push(status),
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    expect(statuses.at(-1)).toBe("saving");
    expect(statuses).not.toContain("saved");

    const flush = controller.flush();
    resolveSave();
    await flush;
    expect(statuses.at(-1)).toBe("saved");
    await controller.dispose();
    vi.useRealTimers();
  });

  it("keeps old providers unmounted while a new slot hydrates and ignores stale results", async () => {
    const fixture = createEvidenceBoardTestSession();
    let launcherVisibleWhenSlotBLoadStarted = false;
    const { loads, repository } = makeLoadingRepository(undefined, (slotId) => {
      if (slotId === "slot_b") launcherVisibleWhenSlotBLoadStarted = screen.queryByRole("button", { name: "Launcher" }) !== null;
    });
    const view = render(
      <SessionSaveRuntime
        content={fixture.content}
        mailChannelId="channel_test"
        initialState={fixture.initialState}
        slotId="slot_a"
        applicationVersion="0.1.0"
        repository={repository}
      />,
    );

    await waitFor(() => expect(loads).toHaveLength(1));
    view.rerender(
      <SessionSaveRuntime
        content={fixture.content}
        mailChannelId="channel_test"
        initialState={fixture.initialState}
        slotId="slot_b"
        applicationVersion="0.1.0"
        repository={repository}
      />,
    );
    await waitFor(() => expect(loads).toHaveLength(2));
    expect(launcherVisibleWhenSlotBLoadStarted).toBe(false);
    expect(screen.queryByRole("button", { name: "Launcher" })).toBeNull();
    expect(document.querySelector("[data-hydration-status]")).toHaveAttribute("data-hydration-status", "loading");

    loads[0]!.deferred.resolve(null);
    await Promise.resolve();
    expect(screen.queryByRole("button", { name: "Launcher" })).toBeNull();

    loads[1]!.deferred.resolve(null);
    await waitFor(() => expect(screen.getByRole("button", { name: "Launcher" })).toBeVisible());
    view.unmount();
  });

  it("ignores a valid stale save result from the old identity", async () => {
    const fixture = createNotificationTestSession();
    const { loads, repository } = makeLoadingRepository();
    const { resources, databaseFactory } = makeDatabaseFactory();
    const view = render(
      <SessionSaveRuntime
        content={fixture.content}
        mailChannelId="channel_test"
        initialState={fixture.initialState}
        slotId="slot_a"
        applicationVersion="0.1.0"
        repository={repository}
        databaseFactory={databaseFactory}
      />,
    );

    await waitFor(() => expect(loads).toHaveLength(1));
    view.rerender(
      <SessionSaveRuntime
        content={fixture.content}
        mailChannelId="channel_test"
        initialState={fixture.initialState}
        slotId="slot_b"
        applicationVersion="0.1.0"
        repository={repository}
        databaseFactory={databaseFactory}
      />,
    );
    await waitFor(() => expect(loads).toHaveLength(2));
    loads[1]!.deferred.resolve(makeRuntimeSave(
      "slot_b",
      fixture,
      "B note",
      { ...fixture.initialState, notifications: ["notification_test_b"] },
    ));
    await waitFor(() => expect(screen.getByRole("button", { name: "Launcher" })).toBeVisible());
    expect(resources[0]!.close).toHaveBeenCalledTimes(1);
    expect(resources[1]!.close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Notification center" }));
    expect(screen.getByText("Test notification B.")).toBeVisible();

    loads[0]!.deferred.resolve(makeRuntimeSave(
      "slot_a",
      fixture,
      "A note",
      { ...fixture.initialState, notifications: ["notification_test_a"] },
    ));
    await Promise.resolve();
    expect(screen.getByRole("button", { name: "Launcher" })).toBeVisible();
    expect(screen.getByText("Test notification B.")).toBeVisible();
    expect(screen.queryByText("Test notification A.")).toBeNull();
    expect(resources[0]!.close).toHaveBeenCalledTimes(1);
    expect(resources[1]!.close).not.toHaveBeenCalled();

    await act(async () => {
      view.unmount();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resources[1]!.close).toHaveBeenCalledTimes(1);
  });

  it("isolates rejected stale hydration cleanup from the current database", async () => {
    const fixture = createEvidenceBoardTestSession();
    const { loads, repository } = makeLoadingRepository();
    const { resources, databaseFactory } = makeDatabaseFactory();
    const view = render(
      <SessionSaveRuntime
        content={fixture.content}
        mailChannelId="channel_test"
        initialState={fixture.initialState}
        slotId="slot_a"
        applicationVersion="0.1.0"
        repository={repository}
        databaseFactory={databaseFactory}
      />,
    );
    await waitFor(() => expect(loads).toHaveLength(1));
    view.rerender(
      <SessionSaveRuntime
        content={fixture.content}
        mailChannelId="channel_test"
        initialState={fixture.initialState}
        slotId="slot_b"
        applicationVersion="0.1.0"
        repository={repository}
        databaseFactory={databaseFactory}
      />,
    );
    await waitFor(() => expect(loads).toHaveLength(2));
    loads[1]!.deferred.resolve(null);
    await waitFor(() => expect(screen.getByRole("button", { name: "Launcher" })).toBeVisible());
    expect(resources).toHaveLength(2);
    loads[0]!.deferred.reject(new Error("stale A failed"));
    await Promise.resolve();
    expect(resources[0]!.close).toHaveBeenCalledTimes(1);
    expect(resources[1]!.close).not.toHaveBeenCalled();
    await act(async () => {
      view.unmount();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(resources[1]!.close).toHaveBeenCalledTimes(1);
  });

  it("does not remount the old runtime when the new slot fails hydration", async () => {
    const fixture = createEvidenceBoardTestSession();
    let saveCount = 0;
    const { loads, repository } = makeLoadingRepository(async () => { saveCount += 1; });
    const view = render(
      <SessionSaveRuntime
        content={fixture.content}
        mailChannelId="channel_test"
        initialState={fixture.initialState}
        slotId="slot_a"
        applicationVersion="0.1.0"
        repository={repository}
      />,
    );

    await waitFor(() => expect(loads).toHaveLength(1));
    loads[0]!.deferred.resolve(null);
    await waitFor(() => expect(screen.getByRole("button", { name: "Launcher" })).toBeVisible());

    view.rerender(
      <SessionSaveRuntime
        content={fixture.content}
        mailChannelId="channel_test"
        initialState={fixture.initialState}
        slotId="slot_b"
        applicationVersion="0.1.0"
        repository={repository}
      />,
    );
    await waitFor(() => expect(loads).toHaveLength(2));
    loads[1]!.deferred.reject(new Error("slot restore failed"));
    await waitFor(() => expect(document.querySelector("[data-hydration-status]")).toHaveAttribute("data-hydration-status", "failed"));
    expect(screen.queryByRole("button", { name: "Launcher" })).toBeNull();
    expect(saveCount).toBe(0);
    view.unmount();
  });

  it("defers discovery save until the matching board reconciliation callback", async () => {
    vi.useFakeTimers();
    const fixture = createEvidenceBoardTestSession();
    const content = contentBundleSchema.parse({
      ...fixture.content,
      evidence: [...fixture.content.evidence, { ...fixture.content.evidence[0]!, id: "evidence_pending" }],
    });
    const initialState = createInitialEngineState();
    const initialBoard = syncDiscoveredEvidence(createInitialEvidenceBoardState(), content, initialState.discoveredEntityIds);
    const statuses: PersistenceStatus[] = [];
    let persisted: SaveGameV2 | undefined;
    let reconciliationCount = 0;
    let saveBeforeReconciliation = false;
    let initialReconciliations = 0;
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content,
      applicationVersion: "0.1.0",
      caseEngineState: initialState,
      evidenceBoard: initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async (value) => {
        if (reconciliationCount === initialReconciliations) saveBeforeReconciliation = true;
        persisted = value;
      }),
      onPersistenceStatusChange: (status) => statuses.push(status),
    });
    let earlyFlush: Promise<void> | null = null;

    render(
      <CaseSessionProvider
        content={content}
        mailChannelId="channel_test"
        initialState={initialState}
        onCommittedChange={(commit) => {
          controller.onEngineCommit(commit);
          earlyFlush = controller.flush();
        }}
      >
        <EvidenceBoardProvider onBoardChange={(change) => {
          if (change.kind === "reconciled") reconciliationCount += 1;
          controller.onBoardChange(change);
        }}>
          <DiscoveryProbe />
        </EvidenceBoardProvider>
      </CaseSessionProvider>,
    );

    initialReconciliations = reconciliationCount;
    fireEvent.click(document.querySelector("button")!);
    expect(statuses.at(-1)).toBe("saving");
    await earlyFlush;
    expect(reconciliationCount).toBeGreaterThan(initialReconciliations);
    expect(saveBeforeReconciliation).toBe(false);

    await vi.advanceTimersByTimeAsync(800);
    await controller.flush();
    expect(persisted).toBeDefined();
    expect(statuses.at(-1)).toBe("saved");
    const written = persisted as SaveGameV2;
    expect(written.sessionSnapshot.caseEngineState.discoveredEntityIds).toContain("evidence_pending");
    expect(written.sessionSnapshot.evidenceBoard.evidenceNodes).toContainEqual({
      evidenceId: "evidence_pending",
      position: { x: 48, y: 48 },
    });
    await controller.dispose();
    vi.useRealTimers();
  });

  it("requires every latest discovered evidence node before releasing the barrier", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const priorState = { ...fixture.initialState, discoveredEntityIds: ["evidence_test"] };
    const latestState = { ...priorState, discoveredEntityIds: ["evidence_test", "evidence_pending"] };
    const boardWithOnlyPending = syncDiscoveredEvidence(fixture.initialBoard, fixture.content, ["evidence_pending"]);
    const boardWithBoth = syncDiscoveredEvidence(fixture.initialBoard, fixture.content, latestState.discoveredEntityIds);
    const statuses: PersistenceStatus[] = [];
    const persisted: SaveGameV2[] = [];
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: priorState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async (value) => { persisted.push(value); }),
      onPersistenceStatusChange: (status) => statuses.push(status),
    });

    controller.onEngineCommit({
      state: latestState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: latestState, appliedEffects: [] }],
    });
    controller.onBoardChange({ kind: "reconciled", state: boardWithOnlyPending });
    expect(statuses.at(-1)).toBe("error");
    controller.requestSave("objective_completed");
    controller.onBoardChange({ kind: "committed", state: boardWithOnlyPending });
    await vi.advanceTimersByTimeAsync(800);
    expect(persisted).toEqual([]);

    controller.onBoardChange({ kind: "reconciled", state: boardWithBoth });
    await vi.advanceTimersByTimeAsync(800);
    expect(persisted).toHaveLength(1);
    expect(persisted[0]!.sessionSnapshot.caseEngineState.discoveredEntityIds).toEqual(latestState.discoveredEntityIds);
    expect(persisted[0]!.sessionSnapshot.evidenceBoard.evidenceNodes).toEqual([
      { evidenceId: "evidence_test", position: { x: 48, y: 48 } },
      { evidenceId: "evidence_pending", position: { x: 308, y: 48 } },
    ]);
    await controller.dispose();
    vi.useRealTimers();
  });

  it("coalesces stale-hydration and runtime cleanup requests into one database close", () => {
    const close = vi.fn();
    const closeOnce = createCloseOnce(close);

    closeOnce();
    closeOnce();

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("flushes before closing the database during disposal", async () => {
    vi.useFakeTimers();
    let resolveSave: () => void = () => undefined;
    const save = new Promise<void>((resolve) => { resolveSave = resolve; });
    const events: string[] = [];
    const fixture = createEvidenceBoardTestSession();
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, fixture.initialState.discoveredEntityIds),
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async () => {
        events.push("save-start");
        await save;
        events.push("save-complete");
      }),
      closeDatabase: () => events.push("database-close"),
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    const disposal = controller.dispose();
    expect(events).toEqual(["save-start"]);
    resolveSave();
    await disposal;
    expect(events).toEqual(["save-start", "save-complete", "database-close"]);
    vi.useRealTimers();
  });

  it("waits for an in-flight write before closing resources when discovery retires its coordinator", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const save = deferred<void>();
    const events: string[] = [];
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async () => {
        events.push("save-start");
        await save.promise;
        events.push("save-complete");
      }),
      closeDatabase: () => events.push("database-close"),
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    controller.onEngineCommit({
      state: fixture.discoveredState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: fixture.discoveredState, appliedEffects: [] }],
    });
    const disposal = controller.dispose();
    expect(events).toEqual(["save-start"]);
    save.resolve();
    await disposal;
    expect(events).toEqual(["save-start", "save-complete", "database-close"]);
    vi.useRealTimers();
  });

  it("drains reconciliation-triggered save B before flush and cleanup resolve", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const writes: Array<Deferred<void>> = [];
    const events: string[] = [];
    const closeDatabase = vi.fn();
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: {
        ...makeRepository(async () => undefined),
        save: async () => {
          const write = deferred<void>();
          const writeNumber = writes.length + 1;
          writes.push(write);
          events.push(`save-${writeNumber}-start`);
          await write.promise;
          events.push(`save-${writeNumber}-complete`);
        },
      },
      closeDatabase,
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    expect(writes).toHaveLength(1);

    let flushSettled = false;
    const flush = controller.flush().then(() => { flushSettled = true; });
    controller.onEngineCommit({
      state: fixture.discoveredState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: fixture.discoveredState, appliedEffects: [] }],
    });
    controller.onBoardChange({ kind: "reconciled", state: fixture.reconciledBoard });
    writes[0]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(events).toEqual(["save-1-start", "save-1-complete", "save-2-start"]);
    expect(flushSettled).toBe(false);

    writes[1]!.resolve();
    await flush;
    expect(flushSettled).toBe(true);
    await controller.dispose();
    expect(events).toEqual(["save-1-start", "save-1-complete", "save-2-start", "save-2-complete"]);
    expect(closeDatabase).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("serializes B when reconciliation happens before flush begins", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const writes = makeDeferredWriteRepository();
    const closeDatabase = vi.fn();
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: writes.repository,
      closeDatabase,
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    controller.onEngineCommit({
      state: fixture.discoveredState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: fixture.discoveredState, appliedEffects: [] }],
    });
    controller.onBoardChange({ kind: "reconciled", state: fixture.reconciledBoard });
    const flush = controller.flush();
    await vi.advanceTimersByTimeAsync(0);
    expect(writes.writes).toHaveLength(1);

    writes.writes[0]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(writes.writes).toHaveLength(2);
    let flushSettled = false;
    void flush.then(() => { flushSettled = true; });
    expect(flushSettled).toBe(false);
    writes.writes[1]!.resolve();
    await flush;
    expect(writes.maximumActiveWrites()).toBe(1);
    await controller.dispose();
    expect(closeDatabase).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not let debounce expiry overlap an active write from a retired coordinator", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const writes = makeDeferredWriteRepository();
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: writes.repository,
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    controller.onEngineCommit({
      state: fixture.discoveredState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: fixture.discoveredState, appliedEffects: [] }],
    });
    controller.onBoardChange({ kind: "reconciled", state: fixture.reconciledBoard });
    await vi.advanceTimersByTimeAsync(800);
    expect(writes.writes).toHaveLength(1);

    writes.writes[0]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(writes.writes).toHaveLength(2);
    writes.writes[1]!.resolve();
    await controller.flush();
    expect(writes.maximumActiveWrites()).toBe(1);
    await controller.dispose();
    vi.useRealTimers();
  });

  it("allows B to start after retired A rejects without poisoning the write tail", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const writes = makeDeferredWriteRepository();
    const statuses: PersistenceStatus[] = [];
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: writes.repository,
      onPersistenceStatusChange: (status) => statuses.push(status),
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    controller.onEngineCommit({
      state: fixture.discoveredState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: fixture.discoveredState, appliedEffects: [] }],
    });
    controller.onBoardChange({ kind: "reconciled", state: fixture.reconciledBoard });
    const flush = controller.flush();
    await vi.advanceTimersByTimeAsync(0);
    writes.writes[0]!.reject(new Error("A failed"));
    await vi.advanceTimersByTimeAsync(0);
    expect(writes.writes).toHaveLength(2);
    writes.writes[1]!.resolve();
    await flush;
    expect(writes.maximumActiveWrites()).toBe(1);
    expect(statuses.at(-1)).toBe("saved");
    await controller.dispose();
    vi.useRealTimers();
  });

  it("observes callbacks during draining and rejects scheduling after finalization", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const writes = makeDeferredWriteRepository();
    const closeDatabase = vi.fn();
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: writes.repository,
      closeDatabase,
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    const disposal = controller.dispose();
    controller.onEngineCommit({
      state: fixture.discoveredState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: fixture.discoveredState, appliedEffects: [] }],
    });
    controller.onBoardChange({ kind: "reconciled", state: fixture.reconciledBoard });
    writes.writes[0]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(writes.writes).toHaveLength(2);
    writes.writes[1]!.resolve();
    await disposal;
    const writesAfterFinalization = writes.writes.length;
    controller.requestSave("evidence_board_edit");
    controller.onBoardChange({ kind: "committed", state: fixture.reconciledBoard });
    await vi.advanceTimersByTimeAsync(800);
    expect(writes.writes).toHaveLength(writesAfterFinalization);
    expect(closeDatabase).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("schedules at most one save for a multi-reason engine transaction", async () => {
    vi.useFakeTimers();
    const fixture = createEvidenceBoardTestSession();
    let saveCount = 0;
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, fixture.initialState.discoveredEntityIds),
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async () => { saveCount += 1; }),
    });

    controller.onEngineCommit({
      state: fixture.initialState,
      inputs: [{ kind: "dialogue_choice_selected", choiceId: "choice_test" }],
      results: [{ state: fixture.initialState, appliedEffects: [{ type: "complete_objective", objectiveId: "objective_test" }] }],
    });
    await vi.advanceTimersByTimeAsync(800);
    expect(saveCount).toBe(1);
    await controller.dispose();
    vi.useRealTimers();
  });

  it("blocks all later save reasons until discovery reconciliation and persists the latest pair once", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const persisted: SaveGameV2[] = [];
    const statuses: PersistenceStatus[] = [];
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async (value) => { persisted.push(value); }),
      onPersistenceStatusChange: (status) => statuses.push(status),
    });
    const editedBoard = createEvidenceBoardNote(fixture.reconciledBoard, "During discovery", { x: 321, y: 654 });

    controller.requestSave("evidence_board_edit");
    controller.onEngineCommit({
      state: fixture.discoveredState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: fixture.discoveredState, appliedEffects: [] }],
    });
    expect(statuses.at(-1)).toBe("saving");
    controller.onEngineCommit({
      state: fixture.objectiveState,
      inputs: [{ kind: "game_event", event: { type: "objective_completed" } }],
      results: [{ state: fixture.objectiveState, appliedEffects: [{ type: "complete_objective", objectiveId: "objective_test" }] }],
    });
    controller.onBoardChange({ kind: "committed", state: editedBoard });
    controller.requestSave("message_choice");
    await vi.advanceTimersByTimeAsync(800);
    expect(persisted).toEqual([]);

    controller.onBoardChange({ kind: "reconciled", state: editedBoard });
    await vi.advanceTimersByTimeAsync(800);
    expect(persisted).toHaveLength(1);
    expect(persisted[0]!.sessionSnapshot.caseEngineState.completedObjectives).toContain("objective_test");
    expect(persisted[0]!.sessionSnapshot.caseEngineState.discoveredEntityIds).toContain("evidence_pending");
    expect(persisted[0]!.sessionSnapshot.evidenceBoard.evidenceNodes).toContainEqual({ evidenceId: "evidence_pending", position: { x: 48, y: 48 } });
    expect(persisted[0]!.sessionSnapshot.evidenceBoard.noteNodes).toContainEqual(expect.objectContaining({ text: "During discovery" }));
    await controller.dispose();
    vi.useRealTimers();
  });

  it("fails closed after discovery materialization failure and blocks later reasons", async () => {
    vi.useFakeTimers();
    const fixture = makeDiscoveryControllerFixture();
    const statuses: PersistenceStatus[] = [];
    let saveCount = 0;
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: fixture.initialBoard,
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async () => { saveCount += 1; }),
      onPersistenceStatusChange: (status) => statuses.push(status),
    });

    controller.onEngineCommit({
      state: fixture.discoveredState,
      inputs: [{ kind: "evidence_discovered", evidenceId: "evidence_pending" }],
      results: [{ state: fixture.discoveredState, appliedEffects: [] }],
    });
    controller.onBoardChange({ kind: "reconciled", state: fixture.initialBoard });
    controller.onEngineCommit({
      state: fixture.objectiveState,
      inputs: [{ kind: "game_event", event: { type: "objective_completed" } }],
      results: [{ state: fixture.objectiveState, appliedEffects: [{ type: "complete_objective", objectiveId: "objective_test" }] }],
    });
    controller.requestSave("message_choice");
    controller.onBoardChange({ kind: "committed", state: fixture.initialBoard });
    await vi.advanceTimersByTimeAsync(800);

    expect(saveCount).toBe(0);
    expect(statuses.at(-1)).toBe("error");
    await controller.dispose();
    vi.useRealTimers();
  });

  it("composes the latest metadata refs at write-start", async () => {
    vi.useFakeTimers();
    const fixture = createEvidenceBoardTestSession();
    let persisted: SaveGameV2 | undefined;
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, fixture.initialState.discoveredEntityIds),
      gameEvents: [{ type: "old_event" }],
      uiSnapshot: { layout: "old" },
      settings: { volume: 0.1 },
      repository: makeRepository(async (value) => { persisted = value; }),
    });

    controller.updateMetadata({ gameEvents: [{ type: "new_event" }], uiSnapshot: { layout: "new" }, settings: { volume: 0.9 } });
    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    expect(persisted?.gameEvents).toEqual([{ type: "new_event" }]);
    expect(persisted?.uiSnapshot).toEqual({ layout: "new" });
    expect(persisted?.settings).toEqual({ volume: 0.9 });
    await controller.dispose();
    vi.useRealTimers();
  });

  it("reports repository rejection and recovers on a later successful request", async () => {
    vi.useFakeTimers();
    const fixture = createEvidenceBoardTestSession();
    const statuses: PersistenceStatus[] = [];
    let shouldReject = true;
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, fixture.initialState.discoveredEntityIds),
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: makeRepository(async () => {
        if (shouldReject) throw new Error("write failed");
      }),
      onPersistenceStatusChange: (status) => statuses.push(status),
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    await Promise.resolve();
    expect(statuses.at(-1)).toBe("error");
    expect(statuses).not.toContain("saved");

    shouldReject = false;
    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    await Promise.resolve();
    expect(statuses.at(-1)).toBe("saved");
    await controller.dispose();
    vi.useRealTimers();
  });

  it("keeps status saving between an in-flight write and its follow-up", async () => {
    vi.useFakeTimers();
    const fixture = createEvidenceBoardTestSession();
    const statuses: PersistenceStatus[] = [];
    const calls: Array<Deferred<void>> = [];
    const controller = createSaveRuntimeController({
      slotId: "slot_test",
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, fixture.initialState.discoveredEntityIds),
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      repository: {
        ...makeRepository(async () => undefined),
        save: async () => {
          const pending = deferred<void>();
          calls.push(pending);
          return pending.promise;
        },
      },
      onPersistenceStatusChange: (status) => statuses.push(status),
    });

    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    controller.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    expect(calls).toHaveLength(1);
    calls[0]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses).not.toContain("saved");
    expect(calls).toHaveLength(2);
    calls[1]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe("saved");
    await controller.dispose();
    vi.useRealTimers();
  });

  it("keeps an old controller isolated from a new identity controller", async () => {
    vi.useFakeTimers();
    const fixture = createEvidenceBoardTestSession();
    const savesA: SaveGameV2[] = [];
    const savesB: SaveGameV2[] = [];
    const base = {
      content: fixture.content,
      applicationVersion: "0.1.0",
      caseEngineState: fixture.initialState,
      evidenceBoard: syncDiscoveredEvidence(createInitialEvidenceBoardState(), fixture.content, fixture.initialState.discoveredEntityIds),
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
    };
    const controllerA = createSaveRuntimeController({ slotId: "slot_a", ...base, repository: makeRepository(async (value) => { savesA.push(value); }) });
    controllerA.requestSave("evidence_board_edit");
    const disposalA = controllerA.dispose();
    await disposalA;
    const controllerB = createSaveRuntimeController({ slotId: "slot_b", ...base, repository: makeRepository(async (value) => { savesB.push(value); }) });
    controllerB.requestSave("evidence_board_edit");
    await vi.advanceTimersByTimeAsync(800);
    await controllerB.flush();
    expect(savesA).toHaveLength(1);
    expect(savesA[0]!.slotId).toBe("slot_a");
    expect(savesB).toHaveLength(1);
    expect(savesB[0]!.slotId).toBe("slot_b");
    await controllerB.dispose();
    vi.useRealTimers();
  });
});
