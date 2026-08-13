import { describe, expect, it } from "vitest";

import { validateContentBundle } from "@/content/validator";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import { buildNotificationHistory } from "@/domain/notifications";
import { createNotificationTestSession } from "./notification-content";

describe("notification-content fixture", () => {
  it("parses and validates the cloned content bundle", () => {
    const { content } = createNotificationTestSession();

    expect(content.notifications.map((notification) => notification.id)).toEqual([
      "notification_test_a",
      "notification_test_b",
    ]);
    expect(validateContentBundle(content).success).toBe(true);
  });

  it("bootstraps A, A, B through the real case engine", () => {
    const { content, initialState } = createNotificationTestSession();
    const direct = stepCaseEngine(
      createInitialEngineState(),
      { kind: "game_event", event: { type: "notification_test_bootstrap" } },
      content,
    );

    expect(initialState.notifications).toEqual([
      "notification_test_a",
      "notification_test_a",
      "notification_test_b",
    ]);
    expect(direct.state).toEqual(initialState);
  });

  it("adds notification B through the authored arrival trigger", () => {
    const { content, initialState } = createNotificationTestSession();
    const result = stepCaseEngine(
      initialState,
      { kind: "game_event", event: { type: "notification_test_arrival" } },
      content,
    );

    expect(result.state.notifications).toEqual([
      "notification_test_a",
      "notification_test_a",
      "notification_test_b",
      "notification_test_b",
    ]);
  });

  it("projects the bootstrap history with authored text and priority", () => {
    const { content, initialState } = createNotificationTestSession();
    const view = buildNotificationHistory({ content, state: initialState });

    expect(view).toEqual({
      kind: "ok",
      notifications: [
        {
          notificationId: "notification_test_a",
          occurrenceKey: "notification_test_a:0",
          text: "Test notification A.",
          priority: "informational",
          priorityLabel: "Informational",
        },
        {
          notificationId: "notification_test_a",
          occurrenceKey: "notification_test_a:1",
          text: "Test notification A.",
          priority: "informational",
          priorityLabel: "Informational",
        },
        {
          notificationId: "notification_test_b",
          occurrenceKey: "notification_test_b:2",
          text: "Test notification B.",
          priority: "system_anomaly",
          priorityLabel: "System anomaly",
        },
      ],
    });
  });
});
