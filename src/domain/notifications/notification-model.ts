import type { NotificationPriority } from "@/content/schemas";
import type { ContentBundle } from "@/content/validator";
import type { CaseEngineState } from "@/domain/engine";

export interface NotificationHistoryRow {
  readonly notificationId: string;
  readonly occurrenceKey: string;
  readonly text: string;
  readonly priority: NotificationPriority;
  readonly priorityLabel: string;
}

export type NotificationHistoryView =
  | { kind: "empty" }
  | { kind: "ok"; notifications: readonly NotificationHistoryRow[] };

export interface NotificationHistoryInput {
  readonly content: ContentBundle;
  readonly state: CaseEngineState;
}

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  informational: "Informational",
  discovery: "Discovery",
  message: "Message",
  urgent: "Urgent",
  system_anomaly: "System anomaly",
};

/**
 * Projects the authoritative engine notification queue into authored display
 * content. Queue order and duplicate occurrences are preserved. Unresolvable
 * IDs are skipped only as runtime defense; BBX-024 rejects them in authored
 * validated content.
 */
export function buildNotificationHistory(input: NotificationHistoryInput): NotificationHistoryView {
  const definitions = new Map(
    input.content.notifications.map((notification) => [notification.id, notification]),
  );
  const notifications: NotificationHistoryRow[] = [];

  input.state.notifications.forEach((notificationId, index) => {
    const definition = definitions.get(notificationId);
    if (!definition) return;

    notifications.push({
      notificationId,
      occurrenceKey: `${notificationId}:${index}`,
      text: definition.text,
      priority: definition.priority,
      priorityLabel: PRIORITY_LABELS[definition.priority],
    });
  });

  return notifications.length === 0
    ? { kind: "empty" }
    : { kind: "ok", notifications };
}
