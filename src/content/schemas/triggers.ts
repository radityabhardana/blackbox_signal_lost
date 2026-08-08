import { z } from "zod";
import { idSchema } from "./ids";
import { ruleExpressionSchema } from "./rule-expression";
import { gameEffectSchema } from "./game-effect";

// docs/09 §10 — triggers run once (or repeatedly), ordered by priority.
export const triggerDefinitionSchema = z
  .object({
    id: idSchema,
    once: z.boolean(),
    priority: z.number().int(),
    rule: ruleExpressionSchema,
    effects: z.array(gameEffectSchema),
  })
  .strict();

export type TriggerDefinition = z.infer<typeof triggerDefinitionSchema>;