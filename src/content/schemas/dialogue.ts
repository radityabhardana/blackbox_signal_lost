import { z } from "zod";
import { idSchema } from "./ids";
import { ruleExpressionSchema } from "./rule-expression";
import { gameEffectSchema } from "./game-effect";

// docs/09 §7 — dialogue nodes and choices.
export const dialogueChoiceSchema = z
  .object({
    id: idSchema,
    label: z.string().min(1),
    consequences: z.array(gameEffectSchema),
    nextNodeId: idSchema,
  })
  .strict();

export const dialogueNodeSchema = z
  .object({
    id: idSchema,
    channelId: idSchema,
    speakerId: idSchema,
    text: z.string().min(1),
    sentAtNarrativeTime: z.string().optional(),
    enterRule: ruleExpressionSchema,
    choices: z.array(dialogueChoiceSchema).optional(),
    nextNodeId: idSchema.optional(),
    attachments: z.array(idSchema).optional(),
  })
  .strict();

export type DialogueChoice = z.infer<typeof dialogueChoiceSchema>;
export type DialogueNode = z.infer<typeof dialogueNodeSchema>;