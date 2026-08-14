import type { SaveRepository } from "./types";
import type { SaveGameV2 } from "./session-save-schema";

/** ADR-018 convention: trailing debounce delay in milliseconds. */
export const AUTOSAVE_DEBOUNCE_MS = 800;

/** The five documented autosave trigger signals (docs/03 §5.11). */
export type AutosaveReason =
  | "evidence_discovered"
  | "objective_completed"
  | "message_choice"
  | "puzzle_completed"
  | "report_submitted";

export type TimerHandle = ReturnType<typeof setTimeout>;

export interface AutosaveScheduler {
  setTimeout(callback: () => void, ms: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
}

export interface AutosaveDeps {
  readonly slotId: string;
  readonly getSnapshot: () => SaveGameV2;
  readonly repository: SaveRepository;
  readonly debounceMs?: number;
  readonly scheduler?: AutosaveScheduler;
}

export interface AutosaveCoordinator {
  requestSave(reason: AutosaveReason): void;
  flush(): Promise<void>;
  dispose(): void;
  readonly isSaving: boolean;
  readonly hasPendingSave: boolean;
  readonly lastError: unknown | null;
}

/**
 * Debounced single-flight autosave coordinator (BBX-031). One coordinator is
 * bound to one slotId for its lifetime; the shell creates a new coordinator on
 * slot change. The trailing debounce captures the current snapshot only at
 * write-start, so the newest state wins. A failed generation is never
 * background-retried until explicitly retried via requestSave/flush. The
 * pending state is discarded on dispose; an already-in-flight write settles
 * but starts no follow-up.
 */
export function createAutosaveCoordinator(deps: AutosaveDeps): AutosaveCoordinator {
  const { slotId, getSnapshot, repository } = deps;
  const debounceMs = deps.debounceMs ?? AUTOSAVE_DEBOUNCE_MS;
  const scheduler = deps.scheduler ?? {
    setTimeout: (callback, ms) => globalThis.setTimeout(callback, ms),
    clearTimeout: (handle) => globalThis.clearTimeout(handle),
  };

  let disposed = false;
  let requestedGeneration = 0;
  let persistedGeneration = 0;
  let readyGeneration = 0;      // newest dirty gen whose trailing debounce elapsed / flush-forced
  let blockedGeneration = 0;    // background path must not auto-retry a failed gen
  let inFlight: Promise<void> | null = null;
  let timer: TimerHandle | null = null;
  let lastError: unknown | null = null;

  function clearTimer(): void {
    if (timer !== null) {
      scheduler.clearTimeout(timer);
      timer = null;
    }
  }

  function armTimer(): void {
    clearTimer();
    timer = scheduler.setTimeout(() => {
      timer = null;
      readyGeneration = requestedGeneration;
      maybeStart();
    }, debounceMs);
  }

  function settleSuccess(generation: number): void {
    inFlight = null;
    lastError = null;
    persistedGeneration = generation;
    followUp();
  }

  function settleFailure(generation: number, error: unknown): void {
    inFlight = null;
    lastError = error;
    if (generation > blockedGeneration) blockedGeneration = generation;
    // only a strictly newer ready generation may begin after a failure.
    followUp();
  }

  function settle(generation: number, error: unknown | undefined): void {
    if (error === undefined) {
      settleSuccess(generation);
    } else {
      settleFailure(generation, error);
    }
  }

  function followUp(): void {
    if (disposed) return;
    if (inFlight !== null) return;
    if (readyGeneration <= persistedGeneration) return;
    if (readyGeneration <= blockedGeneration) return;
    startWrite(readyGeneration);
  }

  function maybeStart(): void {
    if (disposed) return;
    if (inFlight !== null) return;
    if (readyGeneration <= persistedGeneration) return;
    if (readyGeneration <= blockedGeneration) return;
    startWrite(readyGeneration);
  }

  function startWrite(generation: number): void {
    if (disposed || inFlight !== null) return;
    const operation = repository.save(slotId, getSnapshot());
    const tracked = operation.then(
      () => {
        settle(generation, undefined);
      },
      (error: unknown) => {
        settle(generation, error);
        throw error;
      },
    );
    // Background path: attach a rejection handler so there's no unhandled rejection.
    void tracked.catch(() => undefined);
    inFlight = tracked;
  }

  function isPending(): boolean {
    return requestedGeneration > persistedGeneration;
  }

  const coordinator: AutosaveCoordinator = {
    requestSave(reason: AutosaveReason): void {
      if (disposed) return;
      void reason; // reason is an explicit, type-constrained signal only
      requestedGeneration += 1;
      armTimer();
    },

    async flush(): Promise<void> {
      if (disposed) return;
      clearTimer();
      if (!isPending()) return;
      // Explicit barrier: make the latest requested generation ready; explicit
      // flush may retry even a generation the background path blocked.
      readyGeneration = requestedGeneration;
      blockedGeneration = 0;

      if (inFlight !== null) {
        const current = inFlight;
        await current;
      }

      while (!disposed && readyGeneration > persistedGeneration) {
        if (inFlight !== null) {
          await inFlight;
          continue;
        }
        startWrite(readyGeneration);
        if (inFlight === null) break;
        const active = inFlight;
        await active;
      }

      while (!disposed && requestedGeneration > persistedGeneration) {
        readyGeneration = requestedGeneration;
        if (inFlight !== null) {
          await inFlight;
          continue;
        }
        startWrite(readyGeneration);
        if (inFlight === null) break;
        const active = inFlight;
        await active;
      }
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      clearTimer();
      // Drop unsaved pending generations so no follow-up fires after an in-flight settle.
      requestedGeneration = persistedGeneration;
      readyGeneration = persistedGeneration;
    },

    get isSaving(): boolean {
      return inFlight !== null;
    },

    get hasPendingSave(): boolean {
      return isPending();
    },

    get lastError(): unknown | null {
      return lastError;
    },
  };

  return coordinator;
}
