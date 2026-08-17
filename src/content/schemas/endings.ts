import { z } from "zod";
import { idSchema } from "./ids";

/**
 * Authored ending presentation content (docs/05 §5). Rendered only after the
 * outcome evaluator selects the outcome whose endingContentId resolves here.
 * `isHiddenMeta` marks the BLACKBOX meta epilogue (not a fifth primary ending).
 */
export const endingDefinitionSchema = z
  .object({
    id: idSchema,
    caseId: idSchema,
    title: z.string().min(1),
    body: z.record(z.unknown()), // opaque rich text — content authoring owns it (docs/09 §6)
    isHiddenMeta: z.boolean().default(false),
  })
  .strict();

export type EndingDefinition = z.infer<typeof endingDefinitionSchema>;
