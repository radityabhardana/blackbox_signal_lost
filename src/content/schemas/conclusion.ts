import { z } from "zod";
import { idSchema } from "./ids";
import { claimSlotDefinitionSchema, disclosureChoiceDefinitionSchema } from "./opaque";

// docs/09 §13 — the conclusion-report definition and outcome contract.
export const conclusionDefinitionSchema = z
  .object({
    id: idSchema,
    caseId: idSchema,
    claimSlots: z.array(claimSlotDefinitionSchema),
    evidenceSlotCount: z.number().int().min(0),
    disclosureChoices: z.array(disclosureChoiceDefinitionSchema),
  })
  .strict();

export type ConclusionDefinition = z.infer<typeof conclusionDefinitionSchema>;