import { describe, expect, it } from "vitest";
import { notificationDefinitionSchema } from "./notifications";

describe("notificationDefinitionSchema", () => {
  it("accepts every docs/07 §14 priority tier", () => {
    for (const priority of ["informational", "discovery", "message", "urgent", "system_anomaly"]) {
      const result = notificationDefinitionSchema.safeParse({
        id: "notification_test",
        text: "Test notification.",
        priority,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects empty text", () => {
    const result = notificationDefinitionSchema.safeParse({
      id: "notification_test",
      text: "",
      priority: "informational",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown priority", () => {
    const result = notificationDefinitionSchema.safeParse({
      id: "notification_test",
      text: "Test notification.",
      priority: "critical",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed id", () => {
    const result = notificationDefinitionSchema.safeParse({
      id: "Notification_Bad",
      text: "Test notification.",
      priority: "informational",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown extra fields", () => {
    const result = notificationDefinitionSchema.safeParse({
      id: "notification_test",
      text: "Test notification.",
      priority: "informational",
      title: "invented metadata",
    });
    expect(result.success).toBe(false);
  });
});
