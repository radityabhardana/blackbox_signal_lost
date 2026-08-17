"use client";

import { useEffect, useMemo, useState } from "react";
import type { GameEvent, PlayerSettings, UiSnapshot } from "@/content/schemas";
import type { ContentBundle } from "@/content/validator";
import {
  createInitialEngineState,
  type CaseEngineState,
} from "@/domain/engine";
import {
  createInitialEvidenceBoardState,
  hydrateEvidenceBoardSnapshot,
  serializeEvidenceBoardSnapshot,
  syncDiscoveredEvidence,
} from "@/domain/evidence-board";
import type { EvidenceBoardChange } from "@/features/evidence-board/evidence-board-provider";
import type { EvidenceBoardState } from "@/domain/evidence-board";
import {
  createAutosaveCoordinator,
  type AutosaveCoordinator,
  type AutosaveReason,
  type AutosaveScheduler,
} from "@/domain/saves";
import type { SaveGameV2, SaveRepository, SessionSaveSnapshotV1 } from "@/domain/saves";
import { parseSessionSaveSnapshot, parseTrustedSaveGameV2 } from "@/domain/saves";
import { createIndexedDbSaveRepository, SaveDatabase } from "@/infrastructure/persistence";
import { composeSaveGameV2 } from "./save-composer";
import { CaseSessionProvider } from "./case-session";
import type { CaseSessionCommit } from "./case-session";
import { WorkspaceShell } from "@/components/desktop/workspace-shell";
import { Taskbar } from "@/components/desktop/taskbar";
import { LayoutPersistence } from "@/components/desktop/layout-persistence";

export type HydrationStatus = "uninitialized" | "loading" | "ready" | "failed";
export type PersistenceStatus = "idle" | "saving" | "saved" | "error";
type RuntimeLifecycle = "active" | "draining" | "finalizing" | "disposed";

export class SessionSaveRuntimeError extends Error {
  readonly code = "session_restore_incompatible";

  constructor(message: string) {
    super(message);
    this.name = "SessionSaveRuntimeError";
  }
}

export function createCloseOnce(close: () => void): () => void {
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    close();
  };
}

export interface SessionSaveBootstrap {
  readonly repository: SaveRepository;
  readonly closeDatabase?: () => void;
  readonly caseEngineState: CaseEngineState;
  readonly evidenceBoard: EvidenceBoardState;
  readonly gameEvents: readonly GameEvent[];
  readonly uiSnapshot: UiSnapshot;
  readonly settings: PlayerSettings;
  readonly restoredFromSave: boolean;
  /** BBX-082: checkpoint persisted in the loaded save, if any (restore fallback). */
  readonly restoredCheckpoint: SessionSaveSnapshotV1 | null;
}

/**
 * BBX-082: in-memory seed produced by a checkpoint restore (a state swap, not
 * a page reload). The runtime remounts the session providers from this seed.
 */
export interface RestoredSessionSeed {
  readonly caseEngineState: CaseEngineState;
  readonly evidenceBoard: EvidenceBoardState;
}

interface ResolveSessionSaveInput {
  readonly repository: SaveRepository;
  readonly slotId: string;
  readonly content: ContentBundle;
  readonly initialState: CaseEngineState;
}

export async function resolveSessionSave(input: ResolveSessionSaveInput): Promise<SessionSaveBootstrap> {
  const save = await input.repository.load(input.slotId);
  if (save === null) {
    return {
      repository: input.repository,
      caseEngineState: input.initialState,
      evidenceBoard: syncDiscoveredEvidence(
        createInitialEvidenceBoardState(),
        input.content,
        input.initialState.discoveredEntityIds,
      ),
      gameEvents: [],
      uiSnapshot: {},
      settings: {},
      restoredFromSave: false,
      restoredCheckpoint: null,
    };
  }

  if (save.slotId !== input.slotId) {
    throw new SessionSaveRuntimeError(`save slot '${save.slotId}' does not match selected slot '${input.slotId}'`);
  }
  if (save.currentCaseId !== input.content.case.id) {
    throw new SessionSaveRuntimeError(`save case '${save.currentCaseId}' does not match current case '${input.content.case.id}'`);
  }
  if (save.contentVersion !== input.content.case.version) {
    throw new SessionSaveRuntimeError(`save content version '${save.contentVersion}' does not match current content '${input.content.case.version}'`);
  }

  const caseEngineState = save.sessionSnapshot.caseEngineState;
  const evidenceBoard = syncDiscoveredEvidence(
    hydrateEvidenceBoardSnapshot(save.sessionSnapshot.evidenceBoard),
    input.content,
    caseEngineState.discoveredEntityIds,
  );

  return {
    repository: input.repository,
    caseEngineState,
    evidenceBoard,
    gameEvents: save.gameEvents,
    uiSnapshot: save.uiSnapshot,
    settings: save.settings,
    restoredFromSave: true,
    restoredCheckpoint: save.sessionSnapshot.checkpoint ?? null,
  };
}

export interface SaveRuntimeControllerInput {
  readonly slotId: string;
  readonly content: ContentBundle;
  readonly applicationVersion: string;
  readonly caseEngineState: CaseEngineState;
  readonly evidenceBoard: EvidenceBoardState;
  readonly gameEvents: readonly GameEvent[];
  readonly uiSnapshot: UiSnapshot;
  readonly settings: PlayerSettings;
  readonly repository: SaveRepository;
  readonly debounceMs?: number;
  readonly scheduler?: AutosaveScheduler;
  readonly closeDatabase?: () => void;
  readonly onPersistenceStatusChange?: (status: PersistenceStatus) => void;
  /** BBX-082: checkpoint persisted in the loaded save (restore fallback). */
  readonly restoredCheckpoint?: SessionSaveSnapshotV1 | null;
}

export interface SaveRuntimeMetadata {
  readonly gameEvents: readonly GameEvent[];
  readonly uiSnapshot: UiSnapshot;
  readonly settings: PlayerSettings;
}

export type SaveRuntimeMetadataUpdate = Partial<SaveRuntimeMetadata>;

export interface SaveRuntimeController {
  readonly onEngineCommit: (commit: CaseSessionCommit) => void;
  readonly onBoardChange: (change: EvidenceBoardChange) => void;
  readonly updateMetadata: (metadata: SaveRuntimeMetadataUpdate) => void;
  readonly requestSave: (reason: AutosaveReason) => void;
  /**
   * BBX-082: swaps the session back to the captured checkpoint. Returns the
   * remount seed, or null when no checkpoint exists (defensive no-op). As a
   * side effect it resets the controller's latest engine/board refs so the
   * next autosave captures the restored session.
   */
  readonly restoreCheckpoint: () => RestoredSessionSeed | null;
  readonly flush: () => Promise<void>;
  readonly dispose: () => Promise<void>;
}

export function createSaveRuntimeController(input: SaveRuntimeControllerInput): SaveRuntimeController {
  let latestCaseEngineState = input.caseEngineState;
  let latestEvidenceBoardState = input.evidenceBoard;
  const latestGameEventsRef = { current: input.gameEvents };
  const latestUiSnapshotRef = { current: input.uiSnapshot };
  const latestSettingsRef = { current: input.settings };
  let persistenceStatus: PersistenceStatus = "idle";
  let pendingDiscovery: Set<string> | null = null;
  let discoveryIntegrationError = false;
  let runtimeActivityGeneration = 0;
  let flushPromise: Promise<void> | null = null;
  let disposePromise: Promise<void> | null = null;
  let lifecycle: RuntimeLifecycle = "active";
  let coordinator!: AutosaveCoordinator;
  const retiredCoordinators = new Set<AutosaveCoordinator>();
  const activeRepositoryWrites = new Set<Promise<void>>();
  let writeTail: Promise<void> = Promise.resolve();
  const contentEvidenceIds = new Set(input.content.evidence.map((evidence) => evidence.id));

  const acceptsRuntimeWork = (): boolean => lifecycle === "active" || lifecycle === "draining";

  const setPersistenceStatus = (status: PersistenceStatus): void => {
    if (persistenceStatus === status) return;
    persistenceStatus = status;
    input.onPersistenceStatusChange?.(status);
  };

  const observeCoordinatorSettled = (): void => {
    queueMicrotask(() => {
      queueMicrotask(() => {
        if (!acceptsRuntimeWork()) return;
        clearSettledRetiredCoordinators();
        if (pendingDiscovery === null
          && !discoveryIntegrationError
          && !coordinator.isSaving
          && !coordinator.hasPendingSave
          && retiredCoordinators.size === 0
          && activeRepositoryWrites.size === 0
          && coordinator.lastError === null) {
          setPersistenceStatus("saved");
        }
      });
    });
  };

  const decoratedRepository: SaveRepository = {
    load: (slotId) => input.repository.load(slotId),
    delete: (slotId) => input.repository.delete(slotId),
    list: () => input.repository.list(),
    save: async (slotId, value) => {
      if (acceptsRuntimeWork()) setPersistenceStatus("saving");
      const previousWrite = writeTail;
      const queuedWrite = previousWrite.catch(() => undefined).then(async () => {
        const write = input.repository.save(slotId, value);
        activeRepositoryWrites.add(write);
        try {
          await write;
        } finally {
          activeRepositoryWrites.delete(write);
        }
      });
      writeTail = queuedWrite.catch(() => undefined);
      try {
        await queuedWrite;
        if (acceptsRuntimeWork()) observeCoordinatorSettled();
      } catch (error: unknown) {
        if (acceptsRuntimeWork()) setPersistenceStatus("error");
        throw error;
      }
    },
  };

  /**
   * BBX-082: captured pre-submission checkpoint. Seeded from the persisted
   * save's sessionSnapshot.checkpoint when one was restored (fallback), then
   * replaced by the first captureCheckpoint. Once set it is preserved across
   * later autosaves by getSnapshot.
   */
  let checkpointSnapshot: SessionSaveSnapshotV1 | null = input.restoredCheckpoint ?? null;

  const getSnapshot = (): SaveGameV2 => {
    const base = composeSaveGameV2({
      slotId: input.slotId,
      contentVersion: input.content.case.version,
      applicationVersion: input.applicationVersion,
      updatedAt: new Date().toISOString(),
      currentCaseId: input.content.case.id,
      gameEvents: latestGameEventsRef.current,
      caseEngineState: latestCaseEngineState,
      evidenceBoard: latestEvidenceBoardState,
      uiSnapshot: latestUiSnapshotRef.current,
      settings: latestSettingsRef.current,
    });
    // Preserve a captured checkpoint across later autosaves: once captured it
    // must survive subsequent writes (composition alone would reset it to null).
    if (checkpointSnapshot === null) return base;
    return parseTrustedSaveGameV2({
      ...base,
      sessionSnapshot: { ...base.sessionSnapshot, checkpoint: checkpointSnapshot },
    });
  };

  /**
   * BBX-082: captures the current session state as an immutable checkpoint and
   * persists it in a dedicated flush-ordered write. Invoked by onEngineCommit
   * when a `checkpoint_requested` input is seen; once captured the checkpoint
   * is preserved by getSnapshot and served by restoreCheckpoint (state swap).
   */
  const captureCheckpoint = async (): Promise<void> => {
    if (!acceptsRuntimeWork()) return;
    const checkpoint: SessionSaveSnapshotV1 = parseSessionSaveSnapshot({
      version: 1,
      caseEngineState: latestCaseEngineState,
      evidenceBoard: serializeEvidenceBoardSnapshot(latestEvidenceBoardState),
    });
    checkpointSnapshot = checkpoint;
    await decoratedRepository.save(input.slotId, getSnapshot());
  };

  /**
   * BBX-082: restores the captured checkpoint as an in-memory state swap (no
   * IndexedDB reload). Returns the remount seed, or null when no checkpoint
   * exists (defensive no-op). Submission state is stripped so a restored
   * session never begins post-submission, and the controller's latest refs are
   * reset so the next autosave captures the restored session.
   */
  const restoreCheckpoint = (): RestoredSessionSeed | null => {
    if (checkpointSnapshot === null) return null;
    const caseEngineState = {
      ...checkpointSnapshot.caseEngineState,
      submittedReport: null,
      selectedOutcomeId: null,
      caseCompleted: false,
    };
    const evidenceBoard = hydrateEvidenceBoardSnapshot(checkpointSnapshot.evidenceBoard);
    latestCaseEngineState = caseEngineState;
    latestEvidenceBoardState = evidenceBoard;
    return { caseEngineState, evidenceBoard };
  };

  const autosaveDeps = {
    slotId: input.slotId,
    getSnapshot,
    repository: decoratedRepository,
    ...(input.debounceMs === undefined ? {} : { debounceMs: input.debounceMs }),
    ...(input.scheduler === undefined ? {} : { scheduler: input.scheduler }),
  };
  const createCoordinator = (): AutosaveCoordinator => createAutosaveCoordinator(autosaveDeps);
  coordinator = createCoordinator();

  const retireCoordinator = (): void => {
    retiredCoordinators.add(coordinator);
    coordinator.dispose();
    coordinator = createCoordinator();
  };

  const clearSettledRetiredCoordinators = (): void => {
    for (const retired of retiredCoordinators) {
      if (!retired.isSaving && !retired.hasPendingSave) retiredCoordinators.delete(retired);
    }
  };

  const updateMetadata = (metadata: SaveRuntimeMetadataUpdate): void => {
    if (!acceptsRuntimeWork()) return;
    if (metadata.gameEvents !== undefined) latestGameEventsRef.current = metadata.gameEvents;
    if (metadata.uiSnapshot !== undefined) latestUiSnapshotRef.current = metadata.uiSnapshot;
    if (metadata.settings !== undefined) latestSettingsRef.current = metadata.settings;
  };

  const scheduleSave = (reason: AutosaveReason): void => {
    if (!acceptsRuntimeWork()) return;
    runtimeActivityGeneration += 1;
    if (pendingDiscovery !== null) {
      if (!discoveryIntegrationError) setPersistenceStatus("saving");
      return;
    }
    if (discoveryIntegrationError) {
      setPersistenceStatus("error");
      return;
    }
    setPersistenceStatus("saving");
    coordinator.requestSave(reason);
  };

  const requestSave = scheduleSave;

  const waitForActiveRepositoryWrites = async (): Promise<void> => {
    while (activeRepositoryWrites.size > 0) {
      await Promise.allSettled([...activeRepositoryWrites]);
    }
  };

  const onEngineCommit = (commit: CaseSessionCommit): void => {
    if (!acceptsRuntimeWork()) return;
    const previousDiscovered = new Set(latestCaseEngineState.discoveredEntityIds);
    latestCaseEngineState = commit.state;
    const newlyDiscovered = commit.state.discoveredEntityIds.filter((id) => !previousDiscovered.has(id));

    if (newlyDiscovered.length > 0) {
      runtimeActivityGeneration += 1;
      if (coordinator.isSaving || coordinator.hasPendingSave) {
        retireCoordinator();
      }
      pendingDiscovery = new Set([...(pendingDiscovery ?? []), ...newlyDiscovered]);
      setPersistenceStatus(discoveryIntegrationError ? "error" : "saving");
      return;
    }

    if (pendingDiscovery !== null || discoveryIntegrationError) {
      runtimeActivityGeneration += 1;
      setPersistenceStatus(discoveryIntegrationError ? "error" : "saving");
      return;
    }

    if (commit.results.some((result) => result.appliedEffects.some((effect) => effect.type === "complete_objective"))) {
      scheduleSave("objective_completed");
      return;
    }
    if (commit.inputs.some((inputValue) => inputValue.kind === "dialogue_choice_selected")) {
      scheduleSave("message_choice");
      return;
    }
    if (commit.inputs.some((inputValue) => inputValue.kind === "hint_revealed")) {
      scheduleSave("hint_revealed");
      return;
    }
    if (commit.inputs.some((inputValue) => inputValue.kind === "checkpoint_requested")) {
      // BBX-082: capture is an explicit flush-ordered write, not a debounced
      // autosave; the checkpoint is preserved by getSnapshot afterwards.
      void captureCheckpoint().catch(() => undefined);
      return;
    }
    if (commit.inputs.some((inputValue) => inputValue.kind === "report_submitted" || inputValue.kind === "outcome_selected")) {
      // The report/outcome submission transaction; both inputs share one reason.
      scheduleSave("report_submitted");
      return;
    }
    if (commit.inputs.some((inputValue) => inputValue.kind === "checkpoint_restore_requested")) {
      // BBX-082: the engine input is recorded here; the state swap is driven by
      // the runtime wrapper (restoreCheckpoint + keyed provider remount), which
      // resets the refs below and schedules one save for the restored session.
      return;
    }
  };

  const onBoardChange = (change: EvidenceBoardChange): void => {
    if (!acceptsRuntimeWork()) return;
    latestEvidenceBoardState = change.state;
    if (change.kind === "committed") {
      scheduleSave("evidence_board_edit");
      return;
    }

    if (pendingDiscovery === null) return;
    const discoveredIds = latestCaseEngineState.discoveredEntityIds;
    const invalidIds = discoveredIds.filter((id) => !contentEvidenceIds.has(id));
    const missingIds = discoveredIds.filter((id) => contentEvidenceIds.has(id)
      && !change.state.evidenceNodes.some((node) => node.evidenceId === id));
    if (invalidIds.length > 0 || missingIds.length > 0) {
      discoveryIntegrationError = true;
      runtimeActivityGeneration += 1;
      setPersistenceStatus("error");
      return;
    }

    pendingDiscovery = null;
    discoveryIntegrationError = false;
    scheduleSave("evidence_discovered");
  };

  const yieldMicrotasks = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const drainToQuiescence = async (): Promise<void> => {
    let observedWork = false;
    while (true) {
      const observedGeneration = runtimeActivityGeneration;
      const observedCoordinator = coordinator;
      const observedWriteTail = writeTail;
      const coordinatorHasWork = observedCoordinator.isSaving || observedCoordinator.hasPendingSave;
      const retiredHasWork = [...retiredCoordinators].some((retired) => retired.isSaving || retired.hasPendingSave);
      if (coordinatorHasWork) {
        observedWork = true;
        if (pendingDiscovery === null && !discoveryIntegrationError) {
          await observedCoordinator.flush();
        }
      }
      if (retiredHasWork) observedWork = true;
      if (activeRepositoryWrites.size > 0) observedWork = true;
      await observedWriteTail;
      await waitForActiveRepositoryWrites();
      await yieldMicrotasks();

      clearSettledRetiredCoordinators();
      const currentCoordinator = coordinator;
      const coordinatorIdle = !currentCoordinator.isSaving && !currentCoordinator.hasPendingSave;
      const stable = observedGeneration === runtimeActivityGeneration
        && observedCoordinator === currentCoordinator
        && observedWriteTail === writeTail
        && coordinatorIdle
        && retiredCoordinators.size === 0
        && activeRepositoryWrites.size === 0;
      if (!stable) continue;

      if (acceptsRuntimeWork()
        && observedWork
        && pendingDiscovery === null
        && !discoveryIntegrationError
        && currentCoordinator.lastError === null) {
        setPersistenceStatus("saved");
      }
      return;
    }
  };

  const flush = (): Promise<void> => {
    if (flushPromise !== null) return flushPromise;
    let tracked: Promise<void>;
    tracked = drainToQuiescence().catch((error: unknown) => {
      if (acceptsRuntimeWork()) setPersistenceStatus("error");
      throw error;
    }).finally(() => {
      if (flushPromise === tracked) flushPromise = null;
    });
    flushPromise = tracked;
    return tracked;
  };

  const dispose = (): Promise<void> => {
    if (disposePromise !== null) return disposePromise;
    lifecycle = "draining";
    disposePromise = flush()
      .catch(() => undefined)
      .then(() => drainToQuiescence())
      .catch(() => undefined)
      .then(() => waitForActiveRepositoryWrites())
      .then(() => writeTail)
      .finally(() => {
        lifecycle = "finalizing";
        coordinator.dispose();
        for (const retired of retiredCoordinators) retired.dispose();
        retiredCoordinators.clear();
        lifecycle = "disposed";
        input.closeDatabase?.();
      });
    return disposePromise;
  };

  return { onEngineCommit, onBoardChange, updateMetadata, requestSave, restoreCheckpoint, flush, dispose };
}

export interface SessionSaveRuntimeProps {
  readonly content: ContentBundle;
  readonly mailChannelId: string;
  readonly messengerChannelId?: string;
  readonly initialState?: CaseEngineState;
  readonly slotId: string;
  readonly applicationVersion: string;
  readonly repository?: SaveRepository;
  readonly databaseFactory?: () => SaveDatabase;
}

interface SessionRuntimeToken {
  readonly content: ContentBundle;
  readonly initialState: CaseEngineState;
  readonly repositoryOverride: SaveRepository | undefined;
  readonly slotId: string;
  readonly databaseFactory: (() => SaveDatabase) | undefined;
}

export function SessionSaveRuntime({
  content,
  mailChannelId,
  messengerChannelId,
  initialState: initialStateProp,
  slotId,
  applicationVersion,
  repository: repositoryOverride,
  databaseFactory,
}: SessionSaveRuntimeProps) {
  const initialState = useMemo(() => initialStateProp ?? createInitialEngineState(), [initialStateProp]);
  const runtimeToken = useMemo(
    (): SessionRuntimeToken => ({ content, initialState, repositoryOverride, slotId, databaseFactory }),
    [content, databaseFactory, initialState, repositoryOverride, slotId],
  );
  const [hydrationStatus, setHydrationStatus] = useState<HydrationStatus>("loading");
  const [bootstrap, setBootstrap] = useState<SessionSaveBootstrap | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [hydrationToken, setHydrationToken] = useState<SessionRuntimeToken | null>(null);

  useEffect(() => {
    let cancelled = false;
    let transferredDatabase = false;
    const database = databaseFactory?.() ?? (repositoryOverride === undefined ? new SaveDatabase() : null);
    const closeDatabaseOnce = createCloseOnce(() => database?.close());
    const repository = repositoryOverride ?? createIndexedDbSaveRepository(database!);
    void resolveSessionSave({ repository, slotId, content, initialState }).then(
      (resolved) => {
        if (cancelled) {
          closeDatabaseOnce();
          return;
        }
        transferredDatabase = true;
        setBootstrap(database === null ? resolved : { ...resolved, closeDatabase: closeDatabaseOnce });
        setHydrationToken(runtimeToken);
        setHydrationStatus("ready");
      },
      (reason: unknown) => {
        if (cancelled) {
          closeDatabaseOnce();
          return;
        }
        closeDatabaseOnce();
        setError(reason);
        setHydrationToken(runtimeToken);
        setHydrationStatus("failed");
      },
    );
    return () => {
      cancelled = true;
      if (!transferredDatabase) closeDatabaseOnce();
    };
  }, [content, databaseFactory, initialState, repositoryOverride, runtimeToken, slotId]);

  const isReadyForCurrentRuntime = hydrationStatus === "ready"
    && bootstrap !== null
    && hydrationToken === runtimeToken;
  const displayHydrationStatus: HydrationStatus = hydrationStatus === "failed" && hydrationToken === runtimeToken
    ? "failed"
    : isReadyForCurrentRuntime ? "ready" : "loading";

  if (!isReadyForCurrentRuntime) {
    return (
      <div data-hydration-status={displayHydrationStatus} className="grid h-dvh place-items-center bg-bbx-bg-0 p-6">
        {displayHydrationStatus === "failed" ? (
          <p role="alert" className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
            Save restore failed: {error instanceof Error ? error.message : "unknown error"}
          </p>
        ) : (
          <p role="status" aria-live="polite" className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
            Loading saved session
          </p>
        )}
      </div>
    );
  }

  return (
    <HydratedSessionRuntime
      bootstrap={bootstrap}
      content={content}
      mailChannelId={mailChannelId}
      {...(messengerChannelId === undefined ? {} : { messengerChannelId })}
      slotId={slotId}
      applicationVersion={applicationVersion}
    />
  );
}

function HydratedSessionRuntime({
  bootstrap,
  content,
  mailChannelId,
  messengerChannelId,
  slotId,
  applicationVersion,
}: {
  readonly bootstrap: SessionSaveBootstrap;
  readonly content: ContentBundle;
  readonly mailChannelId: string;
  readonly messengerChannelId?: string;
  readonly slotId: string;
  readonly applicationVersion: string;
}) {
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("idle");
  // BBX-082: checkpoint restore is a state swap, not a page reload. Bumping
  // sessionEpoch remounts the session providers from checkpointSeed; the
  // controller itself is stable (memoized on bootstrap) so its refs persist.
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const [checkpointSeed, setCheckpointSeed] = useState<RestoredSessionSeed | null>(null);
  const controller = useMemo(() => createSaveRuntimeController({
    slotId,
    content,
    applicationVersion,
    caseEngineState: bootstrap.caseEngineState,
    evidenceBoard: bootstrap.evidenceBoard,
    gameEvents: bootstrap.gameEvents,
    uiSnapshot: bootstrap.uiSnapshot,
    settings: bootstrap.settings,
    repository: bootstrap.repository,
    ...(bootstrap.closeDatabase === undefined ? {} : { closeDatabase: bootstrap.closeDatabase }),
    restoredCheckpoint: bootstrap.restoredCheckpoint,
    onPersistenceStatusChange: setPersistenceStatus,
  }), [applicationVersion, bootstrap, content, slotId]);

  const handleEngineCommit = (commit: CaseSessionCommit): void => {
    controller.onEngineCommit(commit);
    if (!commit.inputs.some((inputValue) => inputValue.kind === "checkpoint_restore_requested")) return;
    // A checkpoint-less restore is a defensive no-op.
    const restored = controller.restoreCheckpoint();
    if (restored === null) return;
    setCheckpointSeed(restored);
    setSessionEpoch((epoch) => epoch + 1);
    // The restored session becomes current; persist it. "report_submitted" is
    // reused as a type-constrained signal only — the reason has no behavioral
    // meaning beyond triggering the write.
    controller.requestSave("report_submitted");
  };

  useEffect(() => {
    controller.updateMetadata({
      gameEvents: bootstrap.gameEvents,
      uiSnapshot: bootstrap.uiSnapshot,
      settings: bootstrap.settings,
    });
  }, [bootstrap.gameEvents, bootstrap.settings, bootstrap.uiSnapshot, controller]);

  useEffect(() => {
    const handlePageHide = (): void => {
      void controller.flush().catch(() => undefined);
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      void controller.dispose();
    };
  }, [controller]);

  return (
    <div data-hydration-status="ready" data-persistence-status={persistenceStatus} className="flex h-dvh flex-col overflow-hidden bg-bbx-bg-0">
      <div role="status" aria-live="polite" className="sr-only">Persistence status: {persistenceStatus}</div>
      <CaseSessionProvider
        key={sessionEpoch}
        content={content}
        mailChannelId={mailChannelId}
        {...(messengerChannelId === undefined ? {} : { messengerChannelId })}
        initialState={checkpointSeed?.caseEngineState ?? bootstrap.caseEngineState}
        onCommittedChange={handleEngineCommit}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 outline-none">
            <WorkspaceShell initialBoard={checkpointSeed?.evidenceBoard ?? bootstrap.evidenceBoard} onBoardChange={controller.onBoardChange} />
          </main>
          <Taskbar />
          <LayoutPersistence />
        </div>
      </CaseSessionProvider>
    </div>
  );
}
