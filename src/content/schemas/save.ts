import { z } from "zod";
import { gameEventSchema, playerSettingsSchema, sessionSnapshotSchema, uiSnapshotSchema } from "./opaque";

// docs/09 §14 — SaveGame; versioning/migration remain BBX-030 responsibilities.
export const saveGameSchema = z
  .object({
    saveSchemaVersion: z.number().int().min(0),
    contentVersion: z.string(),
    applicationVersion: z.string(),
    slotId: z.string(),
    updatedAt: z.string(),
    currentCaseId: z.string(),
    gameEvents: z.array(gameEventSchema),
    sessionSnapshot: sessionSnapshotSchema,
    uiSnapshot: uiSnapshotSchema,
    settings: playerSettingsSchema,
    checksum: z.string(),
  })
  .strict();

export type SaveGame = z.infer<typeof saveGameSchema>;