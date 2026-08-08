import { z } from "zod";
import {
  assetDefinitionSchema,
  caseManifestSchema,
  characterDefinitionSchema,
  conclusionDefinitionSchema,
  dialogueNodeSchema,
  evidenceDefinitionSchema,
  hintDefinitionSchema,
  recordDefinitionSchema,
} from "../schemas";

/**
 * BBX-024 bundle: a case manifest plus the external entity collections that
 * reference it. Objectives, triggers, outcomes, and searchableIndex remain
 * embedded in the case manifest and are intentionally not duplicated here.
 * Schema-first: ContentBundle is inferred from contentBundleSchema.
 */
export const contentBundleSchema = z.object({
  case: caseManifestSchema,
  characters: z.array(characterDefinitionSchema),
  records: z.array(recordDefinitionSchema),
  evidence: z.array(evidenceDefinitionSchema),
  hints: z.array(hintDefinitionSchema),
  dialogue: z.array(dialogueNodeSchema),
  conclusions: z.array(conclusionDefinitionSchema),
  assets: z.array(assetDefinitionSchema),
});

export type ContentBundle = z.infer<typeof contentBundleSchema>;

export type EntityKind =
  | "case"
  | "character"
  | "record"
  | "evidence"
  | "objective"
  | "trigger"
  | "hint"
  | "dialogue_node"
  | "dialogue_choice"
  | "outcome"
  | "conclusion"
  | "asset";

export type ValidationIssueCode =
  | "duplicate_id"
  | "reference_unresolved"
  | "reference_wrong_kind"
  | "case_reference_mismatch"
  | "objective_missing_hints"
  | "objective_hint_unresolved"
  | "objective_hint_mismatch"
  | "asset_missing_transcript";

export interface ValidationIssue {
  code: ValidationIssueCode;
  entityType: string;
  entityId: string;
  path: string;
  referencedId?: string;
  reason: string;
}

export type ValidationResult =
  | { success: true }
  | { success: false; issues: ValidationIssue[] };
