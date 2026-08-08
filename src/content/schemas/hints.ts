import { z } from "zod";
import { idSchema } from "./ids";

// docs/09 §9 — hints exist in four escalating tiers per objective.
export const hintDefinitionSchema = z
  .object({
    id: idSchema,
    objectiveId: idSchema,
    tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    text: z.string().min(1),
  })
  .strict();

export type HintDefinition = z.infer<typeof hintDefinitionSchema>;