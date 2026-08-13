import { contentBundleSchema, validateContentBundle } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import type { NotificationDefinition, TriggerDefinition } from "@/content/schemas";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";

export interface NotificationTestSessionFixture {
  readonly content: ContentBundle;
  readonly initialState: CaseEngineState;
}

export function createNotificationTestSession(): NotificationTestSessionFixture {
  const content = contentBundleSchema.parse(augmentContent(bundleJson));
  const validation = validateContentBundle(content);
  if (!validation.success) {
    throw new Error("notification test fixture failed content validation");
  }

  const afterBootstrap = stepCaseEngine(
    createInitialEngineState(),
    { kind: "game_event", event: { type: "notification_test_bootstrap" } },
    content,
  );

  return { content, initialState: afterBootstrap.state };
}

function augmentContent(raw: unknown): unknown {
  const bundle = raw as {
    case: { triggers: unknown[] };
    notifications?: NotificationDefinition[];
  };

  return {
    ...bundle,
    case: {
      ...bundle.case,
      triggers: [...bundle.case.triggers, NOTIFICATION_BOOTSTRAP_TRIGGER, NOTIFICATION_ARRIVAL_TRIGGER],
    },
    notifications: [...(bundle.notifications ?? []), ...NOTIFICATIONS],
  };
}

const NOTIFICATIONS: readonly NotificationDefinition[] = [
  {
    id: "notification_test_a",
    text: "Test notification A.",
    priority: "informational",
  },
  {
    id: "notification_test_b",
    text: "Test notification B.",
    priority: "system_anomaly",
  },
];

const NOTIFICATION_BOOTSTRAP_TRIGGER: TriggerDefinition = {
  id: "trigger_notification_test",
  once: true,
  priority: 1,
  rule: { eventOccurred: { type: "notification_test_bootstrap" } },
  effects: [
    { type: "show_notification", notificationId: "notification_test_a" },
    { type: "show_notification", notificationId: "notification_test_a" },
    { type: "show_notification", notificationId: "notification_test_b" },
  ],
};

const NOTIFICATION_ARRIVAL_TRIGGER: TriggerDefinition = {
  id: "trigger_notification_test_arrival",
  once: true,
  priority: 1,
  rule: { eventOccurred: { type: "notification_test_arrival" } },
  effects: [{ type: "show_notification", notificationId: "notification_test_b" }],
};
