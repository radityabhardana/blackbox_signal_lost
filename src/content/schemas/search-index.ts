import { z } from "zod";
import { idSchema } from "./ids";
import { ruleExpressionSchema } from "./rule-expression";

// docs/09 §12 — searchable index entries with authored rank and gates.
export const searchIndexEntrySchema = z
  .object({
    entityId: idSchema,
    entityType: z.enum(["record", "character", "organization", "location"]),
    title: z.string().min(1),
    exactTerms: z.array(z.string()),
    aliases: z.array(z.string()),
    partialTerms: z.array(z.string()),
    unavailableBehavior: z.enum(["hidden", "classified_placeholder"]),
    availabilityRule: ruleExpressionSchema,
    authoredRank: z.number().finite().nonnegative(),
  })
  .strict();

export type SearchIndexEntry = z.infer<typeof searchIndexEntrySchema>;