import { z } from "zod";
import { idSchema } from "./ids";
import { richTextDocumentSchema } from "./opaque";

// docs/09 §4 — the source of a record/evidence item.
export const sourceDescriptorSchema = z
  .object({
    organizationId: idSchema.optional(),
    system: z.string().optional(),
  })
  .catchall(z.unknown())
  .strict();

export type SourceDescriptor = z.infer<typeof sourceDescriptorSchema>;
export { richTextDocumentSchema };