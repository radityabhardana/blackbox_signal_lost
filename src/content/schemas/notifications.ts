import { z } from "zod";
import { idSchema } from "./ids";

// docs/09 §11 — notification definitions. Priority tiers come verbatim from
// docs/07 §14; identity/text are the minimal displayable content.
export const NOTIFICATION_PRIORITIES = [
  "informational",
  "discovery",
  "message",
  "urgent",
  "system_anomaly",
] as const;

export const notificationPrioritySchema = z.enum(NOTIFICATION_PRIORITIES);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export const notificationDefinitionSchema = z
  .object({
    id: idSchema,
    text: z.string().min(1),
    priority: notificationPrioritySchema,
  })
  .strict();

export type NotificationDefinition = z.infer<typeof notificationDefinitionSchema>;
