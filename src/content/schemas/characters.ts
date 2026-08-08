import { z } from "zod";
import { idSchema } from "./ids";
import { richTextDocumentSchema } from "./opaque";

// docs/09 §5 — characters. production characters must not contain author-only notes.
export const characterDefinitionSchema = z
  .object({
    id: idSchema,
    displayName: z.string().min(1),
    aliases: z.array(z.string()),
    role: z.string().min(1),
    organizationIds: z.array(idSchema),
    publicProfile: richTextDocumentSchema,
    portraitAssetId: idSchema,
    searchTerms: z.array(z.string()),
    knownEvidenceIds: z.array(idSchema),
    privateAuthorNotes: z.string().optional(),
  })
  .strict();

// Production schema: a clean character passes; the author-only field, when present,
// is rejected by the closed base shape rather than silently stripped.
export const productionCharacterDefinitionSchema = characterDefinitionSchema.omit({
  privateAuthorNotes: true,
});

export type CharacterDefinition = z.infer<typeof characterDefinitionSchema>;
export type ProductionCharacterDefinition = z.infer<typeof productionCharacterDefinitionSchema>;