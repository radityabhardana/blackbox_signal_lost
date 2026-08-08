import { z } from "zod";
import { idSchema } from "./ids";

// docs/09 §10 — game effects. Every documented variant is a closed object.
export const gameEffectSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("unlock_record"), recordId: idSchema }).strict(),
  z.object({ type: z.literal("unlock_application"), applicationId: idSchema }).strict(),
  z.object({ type: z.literal("queue_dialogue"), nodeId: idSchema }).strict(),
  z.object({ type: z.literal("start_objective"), objectiveId: idSchema }).strict(),
  z.object({ type: z.literal("complete_objective"), objectiveId: idSchema }).strict(),
  z.object({ type: z.literal("set_flag"), key: z.string(), value: z.union([z.string(), z.number(), z.boolean()]) }).strict(),
  z.object({ type: z.literal("discover_evidence"), evidenceId: idSchema }).strict(),
  z.object({ type: z.literal("play_audio_cue"), assetId: idSchema }).strict(),
  z.object({ type: z.literal("show_notification"), notificationId: idSchema }).strict(),
]);

export type GameEffect = z.infer<typeof gameEffectSchema>;
