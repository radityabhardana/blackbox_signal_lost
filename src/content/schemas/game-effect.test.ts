import { describe, expect, it } from "vitest";
import { gameEffectSchema } from "./game-effect";

const validEffect = (value: unknown) => gameEffectSchema.safeParse(value).success;

describe("gameEffectSchema", () => {
  it("accepts every documented effect type", () => {
    expect(validEffect({ type: "unlock_record", recordId: "record_test" })).toBe(true);
    expect(validEffect({ type: "unlock_application", applicationId: "app_test" })).toBe(true);
    expect(validEffect({ type: "queue_dialogue", nodeId: "msg_test" })).toBe(true);
    expect(validEffect({ type: "start_objective", objectiveId: "obj_test" })).toBe(true);
    expect(validEffect({ type: "complete_objective", objectiveId: "obj_test" })).toBe(true);
    expect(validEffect({ type: "set_flag", key: "test_flag", value: true })).toBe(true);
    expect(validEffect({ type: "discover_evidence", evidenceId: "evidence_test" })).toBe(true);
    expect(validEffect({ type: "play_audio_cue", assetId: "asset_test" })).toBe(true);
    expect(validEffect({ type: "show_notification", notificationId: "notification_test" })).toBe(true);
  });

  it("rejects unknown types and bad shape", () => {
    expect(validEffect({ type: "teleport" })).toBe(false);
    expect(validEffect({ type: "unlock_record" })).toBe(false);
    expect(validEffect({ type: "set_flag", flagKey: "x" })).toBe(false);
  });

  it("rejects unexpected fields on documented variants", () => {
    expect(validEffect({ type: "unlock_record", recordId: "record_test", junk: 1 })).toBe(false);
    expect(validEffect({ type: "set_flag", key: "k", value: true, junk: 1 })).toBe(false);
  });
});