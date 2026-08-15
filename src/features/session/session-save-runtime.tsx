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
import type { SaveGameV2, SaveRepository } from "@/domain/saves";
import { createIndexedDbSaveRepository, SaveDatabase } from "@/infrastructure/persistence";
import { composeSaveGameV2 } from "./save-composer";
import { CaseSessionProvider } from "./case-session";
import type { CaseSessionCommit } from "./case-session";
import { WorkspaceShell } from "@/components/desktop/workspace-shell";
import { Taskbar } from "@/components/desktop/taskbar";
import { LayoutPersistence } from "@/components/desktop/layout-persistence";

export type HydrationStatus = "uninitialized" | "loading" | "ready" | "failed";
export type PersistenceStatus = "idle" | "saving" | "saved" | "error";

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
  let disposed = false;
  let coordinator!: AutosaveCoordinator;
  const activeRepositoryWrites = new Set<Promise<void>>();
  const contentEvidenceIds = new Set(input.content.evidence.map((evidence) => evidence.id));

  const setPersistenceStatus = (status: PersistenceStatus): void => {
    if (persistenceStatus === status) return;
    persistenceStatus = status;
    input.onPersistenceStatusChange?.(status);
  };

  const observeCoordinatorSettled = (): void => {
    queueMicrotask(() => {
      queueMicrotask(() => {
        if (disposed) return;
        if (pendingDiscovery === null
          && !discoveryIntegrationError
          && !coordinator.isSaving
          && !coordinator.hasPendingSave
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
      if (!disposed) setPersistenceStatus("saving");
      const write = input.repository.save(slotId, value);
      activeRepositoryWrites.add(write);
      try {
        await write;
        if (!disposed) observeCoordinatorSettled();
      } catch (error: unknown) {
        if (!disposed) setPersistenceStatus("error");
        throw error;
      } finally {
        activeRepositoryWrites.delete(write);
      }
    },
  };

  const getSnapshot = (): SaveGameV2 => composeSaveGameV2({
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

  const autosaveDeps = {
    slotId: input.slotId,
    getSnapshot,
    repository: decoratedRepository,
    ...(input.debounceMs === undefined ? {} : { debounceMs: input.debounceMs }),
    ...(input.scheduler === undefined ? {} : { scheduler: input.scheduler }),
  };
  const createCoordinator = (): AutosaveCoordinator => createAutosaveCoordinator(autosaveDeps);
  coordinator = createCoordinator();

  const updateMetadata = (metadata: SaveRuntimeMetadataUpdate): void => {
    if (metadata.gameEvents !== undefined) latestGameEventsRef.current = metadata.gameEvents;
    if (metadata.uiSnapshot !== undefined) latestUiSnapshotRef.current = metadata.uiSnapshot;
    if (metadata.settings !== undefined) latestSettingsRef.current = metadata.settings;
  };

  const scheduleSave = (reason: AutosaveReason): void => {
    if (disposed) return;
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
    const previousDiscovered = new Set(latestCaseEngineState.discoveredEntityIds);
    latestCaseEngineState = commit.state;
    const newlyDiscovered = commit.state.discoveredEntityIds.filter((id) => !previousDiscovered.has(id));

    if (newlyDiscovered.length > 0) {
      runtimeActivityGeneration += 1;
      if (coordinator.isSaving || coordinator.hasPendingSave) {
        coordinator.dispose();
        coordinator = createCoordinator();
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
    }
  };

  const onBoardChange = (change: EvidenceBoardChange): void => {
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
      const coordinatorHasWork = observedCoordinator.isSaving || observedCoordinator.hasPendingSave;
      if (coordinatorHasWork) {
        observedWork = true;
        if (pendingDiscovery === null && !discoveryIntegrationError) {
          await observedCoordinator.flush();
        }
      }
      if (activeRepositoryWrites.size > 0) observedWork = true;
      await waitForActiveRepositoryWrites();
      await yieldMicrotasks();

      const currentCoordinator = coordinator;
      const coordinatorIdle = !currentCoordinator.isSaving && !currentCoordinator.hasPendingSave;
      const stable = observedGeneration === runtimeActivityGeneration
        && observedCoordinator === currentCoordinator
        && coordinatorIdle
        && activeRepositoryWrites.size === 0;
      if (!stable) continue;

      if (!disposed
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
      if (!disposed) setPersistenceStatus("error");
      throw error;
    }).finally(() => {
      if (flushPromise === tracked) flushPromise = null;
    });
    flushPromise = tracked;
    return tracked;
  };

  const dispose = (): Promise<void> => {
    if (disposePromise !== null) return disposePromise;
    disposePromise = flush()
      .catch(() => undefined)
      .then(() => waitForActiveRepositoryWrites())
      .finally(() => {
        disposed = true;
        coordinator.dispose();
        input.closeDatabase?.();
      });
    return disposePromise;
  };

  return { onEngineCommit, onBoardChange, updateMetadata, requestSave, flush, dispose };
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
    onPersistenceStatusChange: setPersistenceStatus,
  }), [applicationVersion, bootstrap, content, slotId]);

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
        content={content}
        mailChannelId={mailChannelId}
        {...(messengerChannelId === undefined ? {} : { messengerChannelId })}
        initialState={bootstrap.caseEngineState}
        onCommittedChange={controller.onEngineCommit}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 outline-none">
            <WorkspaceShell initialBoard={bootstrap.evidenceBoard} onBoardChange={controller.onBoardChange} />
          </main>
          <Taskbar />
          <LayoutPersistence />
        </div>
      </CaseSessionProvider>
    </div>
  );
}
