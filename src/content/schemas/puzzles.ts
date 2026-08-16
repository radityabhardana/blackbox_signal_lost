import { z } from "zod";
import { idSchema } from "./ids";

/**
 * One compared property in a signal-comparison puzzle: the authored values for
 * a reference (normal) event and the disputed event, plus whether this
 * property is DECISIVE for the determination. `decisive` is puzzle truth —
 * never rendered; only the pure domain evaluator reads it.
 */
export const comparisonPropertySchema = z
  .object({
    id: idSchema,
    label: z.string().min(1),
    referenceValue: z.string().min(1),
    disputedValue: z.string().min(1),
    decisive: z.boolean(),
  })
  .strict();

export const signalComparisonPuzzleSchema = z
  .object({
    kind: z.literal("signal_comparison"),
    id: idSchema,
    caseId: idSchema,
    title: z.string().min(1),
    referenceLabel: z.string().min(1),
    disputedLabel: z.string().min(1),
    sourceEvidenceId: idSchema, // the disputed record's evidence (e.g. ev_001_ferry_departure)
    referenceRecordId: idSchema, // the normal baseline record (e.g. rec_001_ferry_baseline)
    solutionEvidenceId: idSchema, // evidence discovered on correct completion (e.g. ev_replay_signature)
    properties: z.array(comparisonPropertySchema).min(1),
    conclusionText: z.string().min(1), // shown only after a correct submission
  })
  .strict();

/** Discriminated union — future puzzle kinds extend this union (BBX-071 deferred). */
export const puzzleDefinitionSchema = z.discriminatedUnion("kind", [signalComparisonPuzzleSchema]);

export type PuzzleDefinition = z.infer<typeof puzzleDefinitionSchema>;
export type SignalComparisonPuzzle = z.infer<typeof signalComparisonPuzzleSchema>;
export type ComparisonProperty = z.infer<typeof comparisonPropertySchema>;
