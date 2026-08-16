"use client";

import { useMemo } from "react";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { projectObjectives } from "@/domain/objectives/project-objectives";
import type { ObjectiveProjection, ObjectiveStatus } from "@/domain/objectives/project-objectives";
import { buildHintLadder, HINT_TIER_LABELS } from "@/domain/hints";
import type { HintLadderState } from "@/domain/hints";

const STATUS_LABELS: Record<ObjectiveStatus, string> = {
  active: "Active",
  completed: "Completed",
  locked: "Locked",
};

interface HintLadderProps {
  readonly objective: ObjectiveProjection;
  readonly ladder: HintLadderState | null;
  onReveal: (hintId: string) => void;
}

function HintLadder({ objective, ladder, onReveal }: HintLadderProps) {
  if (ladder === null || ladder.hasNoHints || objective.status === "locked") return null;

  const next = ladder.next;

  return (
    <div className="mt-2 space-y-1">
      {objective.status === "active" && next !== null ? (
        <button
          type="button"
          className="rounded-sm border border-bbx-surface-2 px-2 py-1 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-1 hover:bg-bbx-surface-2 focus-visible:outline-1 focus-visible:outline-bbx-accent"
          onClick={() => onReveal(next.id)}
        >
          Hint ({ladder.nextLabel})
        </button>
      ) : objective.status === "active" ? (
        <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
          All hints revealed
        </p>
      ) : null}
      {ladder.revealed.length > 0 ? (
        <ul className="space-y-1">
          {ladder.revealed.map((hint) => (
            <li key={hint.id} className="font-mono text-[0.625rem] leading-4 text-bbx-text-2">
              [{HINT_TIER_LABELS[hint.tier]}] {hint.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ObjectivesApp() {
  const session = useOptionalCaseSession();

  const objectives = useMemo(() => {
    if (session === null) return null;

    return projectObjectives({
      definitions: session.content.case.objectives,
      activeObjectiveIds: session.state.activeObjectives,
      completedObjectiveIds: session.state.completedObjectives,
    });
  }, [session]);

  const ladders = useMemo(() => {
    if (session === null) return null;

    const ladders = new Map<string, HintLadderState>();
    for (const definition of session.content.case.objectives) {
      ladders.set(
        definition.id,
        buildHintLadder({
          objectiveId: definition.id,
          objectiveHintIds: definition.hintIds,
          allHints: session.content.hints,
          revealedHintIds: session.state.revealedHintIds,
        }),
      );
    }
    return ladders;
  }, [session]);

  if (objectives === null) {
    return (
      <div className="p-6" role="region" aria-label="Objectives">
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">No objectives</p>
      </div>
    );
  }

  return (
    <section aria-label="Objectives" className="flex h-full min-h-0 flex-col">
      <header className="px-4 pt-3 pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Objectives</h2>
      </header>
      {objectives.length === 0 ? (
        <p className="px-4 pb-3 font-mono text-xs text-bbx-text-2">No objectives yet.</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-3">
          {objectives.map((objective) => (
            <li key={objective.id}>
              <article
                className={`border border-bbx-surface-2 bg-bbx-surface-1 px-3 py-2${
                  objective.status === "completed" ? " opacity-70" : ""
                }`}
              >
                <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
                  {STATUS_LABELS[objective.status]}
                  {objective.optional ? " · Optional" : ""}
                </p>
                <h3 className="mt-1 text-sm text-bbx-text-1">{objective.title}</h3>
                <p className="mt-1 text-xs leading-5 text-bbx-text-2">{objective.description}</p>
                <HintLadder
                  objective={objective}
                  ladder={ladders?.get(objective.id) ?? null}
                  onReveal={(hintId: string) =>
                    session?.dispatch({ kind: "hint_revealed", hintId })
                  }
                />
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
