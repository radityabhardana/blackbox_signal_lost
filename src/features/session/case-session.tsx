"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState, EngineInput, EngineResult } from "@/domain/engine";
import type { ContentBundle } from "@/content/validator";
import { resolveLocalizedBundle } from "@/content/localization/resolve";
import { caseOverlays } from "@/content/cases/case_001_missing_signal/i18n";
import { LocaleContext } from "@/lib/locale/provider";
import { DEFAULT_LOCALE } from "@/lib/locale/locales";

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
  // Localization is applied at this consumption boundary only: config.content
  // stays the canonical (English) bundle for saves and progression, while the
  // overlay-derived bundle is what every consumer reads. "en" (or a case with
  // no overlay) returns the canonical reference unchanged. The locale context
  // is read directly (not useLocale) so a provider-less session — e.g. unit
  // test renders — falls back to the canonical locale instead of throwing.
  const locale = useContext(LocaleContext)?.locale ?? DEFAULT_LOCALE;
  const content = useMemo(() => {
    const overlay = locale === "en" ? undefined : caseOverlays[locale];
    return resolveLocalizedBundle(config.content, overlay, locale);
  }, [config.content, locale]);
  const [state, setState] = useState<CaseEngineState>(() => config.initialState ?? createInitialEngineState());
  // Mirror of the localized bundle so the stable dispatch closures (created once
  // below) always step the engine against the current locale's content, not the
  // bundle captured at mount. The overlay never alters ids/rules/effects, so this
  // keeps progression deterministic while staying live across locale switches.
  // Synced in an effect (never during render); React flushes passive effects
  // before discrete events, so handlers always read the current bundle.
  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
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
        const result = stepCaseEngine(working, input, contentRef.current);
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
      content,
      mailChannelId: config.mailChannelId,
      ...(config.messengerChannelId !== undefined
        ? { messengerChannelId: config.messengerChannelId }
        : {}),
    }),
    [state, actions, content, config.mailChannelId, config.messengerChannelId],
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
