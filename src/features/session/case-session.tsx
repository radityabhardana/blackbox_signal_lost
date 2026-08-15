"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState, EngineInput, EngineResult } from "@/domain/engine";
import type { ContentBundle } from "@/content/validator";

export interface CaseSessionConfig {
  readonly content: ContentBundle;
  readonly mailChannelId: string;
  readonly messengerChannelId?: string;
  readonly initialState?: CaseEngineState;
  readonly onCommittedChange?: (commit: CaseSessionCommit) => void;
}

export interface CaseSessionCommit {
  readonly state: CaseEngineState;
  readonly inputs: readonly EngineInput[];
  readonly results: readonly EngineResult[];
}

export interface CaseSession extends CaseSessionConfig {
  state: CaseEngineState;
  dispatchTransaction(plan: (current: CaseEngineState) => readonly EngineInput[]): EngineResult[];
  dispatch(input: EngineInput): EngineResult;
}

const CaseSessionContext = createContext<CaseSession | null>(null);

/**
 * Case-session owner: holds a validated ContentBundle plus the authoritative
 * (ref-mirrored) CaseEngineState, and hands descendants a stable dispatch
 * boundary into BBX-022. dispatchTransaction plans against the authoritative
 * ref (never render-facing state), folds inputs sequentially, and commits once
 * — a failed transaction leaves the ref untouched. The consumed session object
 * is recreated whenever the committed state changes so context consumers
 * re-render, while dispatch closures stay referentially stable.
 */
export function CaseSessionProvider({ children, ...config }: { children: ReactNode } & CaseSessionConfig) {
  const [state, setState] = useState<CaseEngineState>(() => config.initialState ?? createInitialEngineState());
  const [actions] = useState(() => {
    // Authoritative mirror of the committed engine state for planning inside
    // transactions. Read/written only from event handlers, never during render.
    const stateRef = { current: config.initialState ?? createInitialEngineState() };
    const dispatchTransaction = (plan: (current: CaseEngineState) => readonly EngineInput[]): EngineResult[] => {
      const current = stateRef.current;
      const inputs = plan(current);
      if (inputs.length === 0) return [];

      let working = current;
      const results: EngineResult[] = [];
      for (const input of inputs) {
        const result = stepCaseEngine(working, input, config.content);
        results.push(result);
        working = result.state;
      }

      stateRef.current = working;
      setState(working);
      config.onCommittedChange?.({ state: working, inputs, results });
      return results;
    };

    return {
      dispatchTransaction,
      dispatch: (input: EngineInput) => dispatchTransaction(() => [input])[0]!,
    };
  });

  const session = useMemo<CaseSession>(
    () => ({
      state,
      dispatch: actions.dispatch,
      dispatchTransaction: actions.dispatchTransaction,
      content: config.content,
      mailChannelId: config.mailChannelId,
      ...(config.messengerChannelId !== undefined
        ? { messengerChannelId: config.messengerChannelId }
        : {}),
    }),
    [state, actions, config.content, config.mailChannelId, config.messengerChannelId],
  );

  return <CaseSessionContext.Provider value={session}>{children}</CaseSessionContext.Provider>;
}

/** Throws if no session exists. Use only where an active case is required. */
export function useCaseSession(): CaseSession {
  const session = useContext(CaseSessionContext);
  if (session === null) {
    throw new Error("useCaseSession requires a CaseSessionProvider");
  }
  return session;
}

/** Returns the active session or null (empty/no-case shells). */
export function useOptionalCaseSession(): CaseSession | null {
  return useContext(CaseSessionContext);
}
