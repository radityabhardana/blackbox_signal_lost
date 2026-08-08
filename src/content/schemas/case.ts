import { z } from "zod";
import { idSchema } from "./ids";
import { caseStageSchema, entityReferenceSchema } from "./opaque";
import { objectiveDefinitionSchema } from "./objectives";
import { triggerDefinitionSchema } from "./triggers";
import { outcomeDefinitionSchema } from "./outcomes";
import { searchIndexEntrySchema } from "./search-index";

// docs/09 §3 — case manifests tie the whole case space together structurally.
export const caseManifestSchema = z
  .object({
    id: idSchema,
    version: z.string(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    estimatedMinutes: z.number().int().min(0),
    entryStageId: idSchema,
    stages: z.array(caseStageSchema),
    entities: z.array(entityReferenceSchema),
    objectives: z.array(objectiveDefinitionSchema),
    triggers: z.array(triggerDefinitionSchema),
    outcomes: z.array(outcomeDefinitionSchema),
    searchableIndex: z.array(searchIndexEntrySchema),
    assetBundleId: idSchema,
  })
  .strict();

export type CaseManifest = z.infer<typeof caseManifestSchema>;