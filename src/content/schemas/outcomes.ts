import { z } from "zod";
import { idSchema } from "./ids";
import { ruleExpressionSchema } from "./rule-expression";
import { gameEffectSchema } from "./game-effect";

// docs/09 §13 — outcomes evaluate by priority; this module keeps the shape structural.
export const outcomeDefinitionSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    evaluationRule: ruleExpressionSchema,
    priority: z.number().int(),
    endingContentId: idSchema,
    effects: z.array(gameEffectSchema),
  })
  .strict();

export type OutcomeDefinition = z.infer<typeof outcomeDefinitionSchema>;