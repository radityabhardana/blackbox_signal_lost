import { describe, expect, it } from "vitest";
import { contentBundleSchema } from "../../content/validator";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ContentBundle } from "../../content/validator";
import { createInitialEngineState, stepCaseEngine } from "../../domain/engine";

function loadContent(): ContentBundle {
  const local = path.join(
    __dirname,
    "../../content/fixtures/bundles/valid/bundle_basic_valid.json",
  );
  return contentBundleSchema.parse(JSON.parse(readFileSync(local, "utf-8")));
}

const CONTENT = loadContent();

describe("mail-content fixture", () => {
  it("parses the valid bundle", () => {
    expect(CONTENT.case.id).toBe("case_test");
  });

  it("dialogue_test carries an evidence-bearing attachment plus a plain one", () => {
    const node = CONTENT.dialogue.find((n) => n.id === "dialogue_test")!;
    expect(node.attachments).toEqual(["asset_test", "asset_test_audio"]);
    const evidence = CONTENT.evidence.find((e) => e.id === "evidence_test")!;
    expect(evidence.assetIds).toContain("asset_test");
    expect(evidence.assetIds).not.toContain("asset_test_audio");
  });

  it("mail_test_bootstrap queues dialogue_test without discovering evidence", async () => {
    const result = stepCaseEngine(
      createInitialEngineState(),
      { kind: "game_event", event: { type: "mail_test_bootstrap" } },
      CONTENT,
    );
    expect(result.state.queuedDialogue).toEqual(["dialogue_test"]);
    expect(result.state.discoveredEntityIds).not.toContain("evidence_test");
    expect(result.state.unlockedRecords).not.toContain("record_test");
  });
});
