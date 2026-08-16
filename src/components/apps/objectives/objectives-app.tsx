"use client";

import { useMemo } from "react";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { projectObjectives } from "@/domain/objectives/project-objectives";
import type { ObjectiveStatus } from "@/domain/objectives/project-objectives";

const STATUS_LABELS: Record<ObjectiveStatus, string> = {
  active: "Active",
  completed: "Completed",
  locked: "Locked",
};

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
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
