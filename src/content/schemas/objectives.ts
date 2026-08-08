import { z } from "zod";
import { idSchema } from "./ids";
import { ruleExpressionSchema } from "./rule-expression";

// docs/09 §8 — objectives describe investigative goals, not clicks.
export const objectiveDefinitionSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    optional: z.boolean(),
    startRule: ruleExpressionSchema,
    completionRule: ruleExpressionSchema,
    hintIds: z.array(idSchema),
    nextObjectiveIds: z.array(idSchema),
  })
  .strict();

export type ObjectiveDefinition = z.infer<typeof objectiveDefinitionSchema>;