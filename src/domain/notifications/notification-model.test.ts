import { describe, expect, it } from "vitest";

import { createInitialEngineState } from "@/domain/engine";
import { createNotificationTestSession } from "@/test/fixtures/notification-content";
import { buildNotificationHistory } from "./notification-model";

describe("buildNotificationHistory", () => {
  it("returns an empty view for an empty notification queue", () => {
    const { content } = createNotificationTestSession();

    expect(buildNotificationHistory({ content, state: createInitialEngineState() })).toEqual({
      kind: "empty",
    });
  });

  it("preserves authored order and duplicate occurrences", () => {
    const { content } = createNotificationTestSession();
    const state = {
      ...createInitialEngineState(),
      notifications: ["notification_test_b", "notification_test_a", "notification_test_a"],
    };

    const view = buildNotificationHistory({ content, state });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.notifications.map(({ notificationId, occurrenceKey }) => ({ notificationId, occurrenceKey }))).toEqual([
      { notificationId: "notification_test_b", occurrenceKey: "notification_test_b:0" },
      { notificationId: "notification_test_a", occurrenceKey: "notification_test_a:1" },
      { notificationId: "notification_test_a", occurrenceKey: "notification_test_a:2" },
    ]);
  });

  it("skips unresolved ids without changing surrounding queue indexes", () => {
    const { content } = createNotificationTestSession();
    const state = {
      ...createInitialEngineState(),
      notifications: ["notification_test_a", "notification_missing", "notification_test_b"],
    };

    const view = buildNotificationHistory({ content, state });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.notifications.map(({ notificationId, occurrenceKey }) => ({ notificationId, occurrenceKey }))).toEqual([
      { notificationId: "notification_test_a", occurrenceKey: "notification_test_a:0" },
      { notificationId: "notification_test_b", occurrenceKey: "notification_test_b:2" },
    ]);
  });

  it("returns empty when every queued id is unresolved", () => {
    const { content } = createNotificationTestSession();
    const state = { ...createInitialEngineState(), notifications: ["notification_missing"] };

    expect(buildNotificationHistory({ content, state })).toEqual({ kind: "empty" });
  });

  it("maps every authored priority to its player-visible label", () => {
    const { content } = createNotificationTestSession();
    const priorities = [
      ["informational", "Informational"],
      ["discovery", "Discovery"],
      ["message", "Message"],
      ["urgent", "Urgent"],
      ["system_anomaly", "System anomaly"],
    ] as const;
    const notificationDefinitions = priorities.map(([priority], index) => ({
      id: `notification_priority_${index}`,
      text: `Priority ${index}.`,
      priority,
    }));
    const state = {
      ...createInitialEngineState(),
      notifications: notificationDefinitions.map((notification) => notification.id),
    };
    const view = buildNotificationHistory({
      content: { ...content, notifications: notificationDefinitions },
      state,
    });

    expect(view.kind).toBe("ok");
    if (view.kind !== "ok") return;
    expect(view.notifications.map((notification) => notification.priorityLabel)).toEqual(
      priorities.map(([, label]) => label),
    );
  });
});
