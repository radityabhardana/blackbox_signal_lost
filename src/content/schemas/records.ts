import { z } from "zod";
import { idSchema } from "./ids";
import { sourceDescriptorSchema, richTextDocumentSchema } from "./sources";
import { ruleExpressionSchema } from "./rule-expression";

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

// docs/09 §6 — database records.
export const recordDefinitionSchema = z
  .object({
    id: idSchema,
    caseId: idSchema,
    recordType: z.string().min(1),
    title: z.string().min(1),
    body: richTextDocumentSchema,
    source: sourceDescriptorSchema,
    createdAt: z.string(),
    revisedAt: z.string().optional(),
    relatedEntityIds: z.array(idSchema),
    searchTerms: z.array(z.string()),
    aliases: z.array(z.string()),
    availabilityRule: ruleExpressionSchema,
    evidenceId: idSchema.optional(),
    metadata: z.record(z.string(), metadataValueSchema),
  })
  .strict();

export type RecordDefinition = z.infer<typeof recordDefinitionSchema>;