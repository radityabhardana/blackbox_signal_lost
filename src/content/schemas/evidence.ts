import { z } from "zod";
import { idSchema } from "./ids";
import { sourceDescriptorSchema } from "./sources";

// docs/09 §4 — evidence record shape.
export const evidenceTypeSchema = z.enum([
  "document",
  "image",
  "audio",
  "video",
  "database_record",
  "message",
  "system_log",
  "location",
  "testimony",
]);

const evidenceDefinitionFields = {
  id: idSchema,
  caseId: idSchema,
  title: z.string().min(1),
  type: evidenceTypeSchema,
  summary: z.string().min(1),
  source: sourceDescriptorSchema,
  occurredAt: z.string().optional(),
  recordedAt: z.string().optional(),
  confidence: z.enum(["low", "medium", "high", "unknown"]).optional(),
  tags: z.array(z.string()),
  relatedEntityIds: z.array(idSchema),
  assetIds: z.array(idSchema),
  discoveryRule: z.lazy(() => ruleExpressionSchema as z.ZodTypeAny),
  optional: z.boolean(),
  contested: z.boolean(),
  redHerring: z.boolean(),
  reportClaimsSupported: z.array(idSchema),
  accessibilityDescription: z.string().optional(),
} as const;

export const evidenceDefinitionSchema = z
  .object(evidenceDefinitionFields)
  .strict();

export type EvidenceType = z.infer<typeof evidenceTypeSchema>;
export type EvidenceDefinition = z.infer<typeof evidenceDefinitionSchema>;

// Forward declaration for rule expressions (rule-expression.ts is defined separately).
import { ruleExpressionSchema } from "./rule-expression";