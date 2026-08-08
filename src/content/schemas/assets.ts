import { z } from "zod";
import { idSchema } from "./ids";

// docs/09 §15 — asset registration; every asset has a provenance record.
export const assetDefinitionSchema = z
  .object({
    id: idSchema,
    type: z.enum(["image", "audio", "video", "font", "document"]),
    sourcePath: z.string().min(1),
    optimizedPath: z.string().min(1),
    altText: z.string().optional(),
    transcriptPath: z.string().optional(),
    license: z.string().min(1),
    creator: z.string().min(1),
    provenanceNote: z.string().min(1),
    caseIds: z.array(idSchema),
    preload: z.enum(["none", "stage", "immediate"]),
  })
  .strict();

export type AssetDefinition = z.infer<typeof assetDefinitionSchema>;