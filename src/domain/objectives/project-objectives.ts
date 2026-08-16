import type { ObjectiveDefinition } from "@/content/schemas";

export type ObjectiveStatus = "active" | "completed" | "locked";

export interface ObjectiveProjection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly optional: boolean;
  readonly status: ObjectiveStatus;
}

export interface ProjectObjectivesInput {
  readonly definitions: readonly ObjectiveDefinition[];
  readonly activeObjectiveIds: readonly string[];
  readonly completedObjectiveIds: readonly string[];
}

/**
 * Projects authored objective definitions plus engine state into stable UI
 * projections. Pure and deterministic: output order follows authored order,
 * unknown ids are skipped, and "completed" wins over "active".
 */
export function projectObjectives(
  input: ProjectObjectivesInput,
): readonly ObjectiveProjection[] {
  const completed = new Set(input.completedObjectiveIds);
  const active = new Set(input.activeObjectiveIds);

  const projections = input.definitions.map((definition) => {
    const status: ObjectiveStatus = completed.has(definition.id)
      ? "completed"
      : active.has(definition.id)
        ? "active"
        : "locked";

    return Object.freeze({
      id: definition.id,
      title: definition.title,
      description: definition.description,
      optional: definition.optional,
      status,
    });
  });

  return Object.freeze(projections);
}
