import { z } from "zod";
import { idSchema } from "./ids";

// docs/09 §13 — the conclusion-report definition and outcome contract.
// BBX-080 owns the claim-slot and disclosure-choice contracts (docs/05 Stage 6).

export const claimAnswerOptionSchema = z
  .object({
    id: idSchema,
    label: z.string().min(1),
    /** Authored truth marker. Absent/undefined = never-correct distractor. */
    correct: z.boolean().optional(),
  })
  .strict();

export const claimSlotDefinitionSchema = z
  .object({
    id: idSchema, // e.g. claim_001_location — reference target for evidence.reportClaimsSupported
    prompt: z.string().min(1),
    answerOptions: z.array(claimAnswerOptionSchema).min(1),
    optional: z.boolean().default(false),
    /** Evidence ids that substantiate this claim (validator-resolved, kind "evidence"). */
    supportedByEvidenceIds: z.array(idSchema).default([]),
  })
  .strict();

export const disclosureChoiceDefinitionSchema = z
  .object({
    id: idSchema,
    label: z.string().min(1),
    recipient: z.enum(["mio", "pelaga", "open_signal"]),
    redactsLocation: z.boolean().default(false),
  })
  .strict();

export const conclusionDefinitionSchema = z
  .object({
    id: idSchema,
    caseId: idSchema,
    claimSlots: z.array(claimSlotDefinitionSchema),
    evidenceSlotCount: z.number().int().min(0),
    disclosureChoices: z.array(disclosureChoiceDefinitionSchema),
  })
  .strict();

export type ClaimAnswerOption = z.infer<typeof claimAnswerOptionSchema>;
export type ClaimSlotDefinition = z.infer<typeof claimSlotDefinitionSchema>;
export type DisclosureChoiceDefinition = z.infer<typeof disclosureChoiceDefinitionSchema>;
export type ConclusionDefinition = z.infer<typeof conclusionDefinitionSchema>;
