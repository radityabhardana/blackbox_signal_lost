import { z } from "zod";
import { saveGameSchema } from "@/content/schemas";
import type { SaveGame } from "@/content/schemas";
import type { CaseEngineState } from "@/domain/engine";
import { parseEvidenceBoardSnapshot } from "@/domain/evidence-board";
import type { RuleEvent } from "@/domain/rules";

const flagValueSchema = z.union([z.string(), z.number(), z.boolean()]);
const ruleEventSchema: z.ZodType<RuleEvent> = z.union([
  z.object({ type: z.string() }).strict(),
  z.object({ type: z.string(), entityId: z.string() }).strict(),
]);

/** The serialized shape of the authoritative case-engine state. */
export const caseEngineStateSchema = z.object({
  flags: z.record(flagValueSchema),
  eventHistory: z.array(ruleEventSchema),
  discoveredEntityIds: z.array(z.string()),
  unlockedRecords: z.array(z.string()),
  unlockedApplications: z.array(z.string()),
  activeObjectives: z.array(z.string()),
  completedObjectives: z.array(z.string()),
  selectedChoices: z.array(z.string()),
  firedTriggerIds: z.array(z.string()),
  queuedDialogue: z.array(z.string()),
  audioCues: z.array(z.string()),
  notifications: z.array(z.string()),
  revealedHintIds: z.array(z.string()).default([]),
  // Cast: `.default([])` widens the schema input with `undefined` while the
  // output stays a full CaseEngineState; the annotation pins the output type.
}).strict() as unknown as z.ZodType<CaseEngineState>;

const evidenceBoardSnapshotSchema = z.unknown().transform((value, context) => {
  try {
    return parseEvidenceBoardSnapshot(value);
  } catch {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "invalid EvidenceBoardSnapshotV1" });
    return z.NEVER;
  }
});

/** Typed session payload persisted inside a SaveGame V2 envelope. */
export const sessionSaveSnapshotSchema = z.object({
  version: z.literal(1),
  caseEngineState: caseEngineStateSchema,
  evidenceBoard: evidenceBoardSnapshotSchema,
}).strict();

export type SessionSaveSnapshotV1 = z.infer<typeof sessionSaveSnapshotSchema>;
export type SaveGameV2 = Omit<SaveGame, "saveSchemaVersion" | "sessionSnapshot"> & {
  saveSchemaVersion: 2;
  sessionSnapshot: SessionSaveSnapshotV1;
};

export function parseCaseEngineState(value: unknown): CaseEngineState {
  return caseEngineStateSchema.parse(value);
}

export function parseSessionSaveSnapshot(value: unknown): SessionSaveSnapshotV1 {
  return sessionSaveSnapshotSchema.parse(value);
}

/**
 * The only boundary that turns an unknown SaveGame payload into a trusted V2
 * runtime value. The repository supplies checksum separately after integrity
 * verification; this function performs structural and nested validation.
 */
export function parseTrustedSaveGameV2(value: unknown): SaveGameV2 {
  const envelope = saveGameSchema.parse(value);
  if (envelope.saveSchemaVersion !== 2) {
    throw new Error(`expected SaveGame V2, received version ${envelope.saveSchemaVersion}`);
  }
  const sessionSnapshot = parseSessionSaveSnapshot(envelope.sessionSnapshot);
  return {
    ...envelope,
    saveSchemaVersion: 2,
    sessionSnapshot,
  };
}
