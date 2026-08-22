import { z } from "zod";
import { idSchema } from "./ids";
import { ruleExpressionSchema } from "./rule-expression";

// docs/09 §8 — objectives describe investigative goals, not clicks.
// `recommendedAppId` (BBX-### Stage 0 foundation) is presentation metadata
// pointing the shell at the app that best serves the objective; app ids are a
// UI catalog concern, not content-entity references, so it stays a plain
// optional string. `requiresHints` defaults to true so the hint-ladder
// invariant keeps applying to investigation objectives; onboarding steps
// (e.g. Stage 0 analyst verification) opt out explicitly.
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
    recommendedAppId: z.string().optional(),
    requiresHints: z.boolean().optional(),
  })
  .strict();

export type ObjectiveDefinition = z.infer<typeof objectiveDefinitionSchema>;