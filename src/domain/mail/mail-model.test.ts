import { describe, expect, it } from "vitest";
import { buildMailInbox, isEvidenceDiscovered } from "./mail-model";
import type { MailViewModelInput } from "./mail-model";
import { createInitialEngineState } from "../../domain/engine";
import { contentBundleSchema } from "../../content/validator";
import bundleJson from "../../content/fixtures/bundles/valid/bundle_basic_valid.json";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadContent() {
  const local = path.join(
    __dirname,
    "../../content/fixtures/bundles/valid/bundle_basic_valid.json",
  );
  return contentBundleSchema.parse(JSON.parse(readFileSync(local, "utf-8")));
}

const CONTENT = loadContent();

function baseInput(overrides: Partial<MailViewModelInput> = {}): MailViewModelInput {
  return {
    content: CONTENT,
    state: createInitialEngineState(),
    mailChannelId: "channel_test",
    readMessageIds: new Set(),
    selectedNodeId: null,
    ...overrides,
  };
}

function withQueue(queuedDialogue: readonly string[]): CoB {
  return { ...createInitialEngineState(), queuedDialogue };
}

type CoB = ReturnType<typeof createInitialEngineState>;

describe("buildMailInbox", () => {
  it("queuedDialogue drives rows in queue order", () => {
    const state = withQueue(["dialogue_test_next", "dialogue_test"]);
    const inbox = buildMailInbox(baseInput({ state }));
    expect(inbox.kind).toBe("ok");
    if (inbox.kind !== "ok") throw new Error("expected ok");
    expect(inbox.rows.map((row) => row.nodeId)).toEqual(["dialogue_test_next", "dialogue_test"]);
  });

  it("skips queued nodes on other channels and unresolved ids", () => {
    const state = withQueue(["dialogue_test", "not_a_node"]);
    const inbox = buildMailInbox(baseInput({ state }));
    expect(inbox.kind).toBe("ok");
    if (inbox.kind !== "ok") throw new Error("expected ok");
    expect(inbox.rows).toHaveLength(1);
    expect(inbox.rows[0]!.nodeId).toBe("dialogue_test");
  });

  it("empty queue yields empty state", () => {
    expect(buildMailInbox(baseInput()).kind).toBe("empty");
  });

  it("maps sender via character displayName, body from text, optional time", () => {
    const state = withQueue(["dialogue_test"]);
    const inbox = buildMailInbox(baseInput({ state }));
    if (inbox.kind !== "ok") throw new Error("expected ok");
    expect(inbox.rows[0]).toMatchObject({
      nodeId: "dialogue_test",
      senderLabel: "Test Character",
      body: "First test message.",
      time: null,
      isUnread: true,
    });
  });

  it("sender falls back to null when character missing", () => {
    const state = withQueue(["dialogue_test"]);
    const noChar = { ...CONTENT, characters: [] };
    const inbox = buildMailInbox(baseInput({ state, content: noChar }));
    if (inbox.kind !== "ok") throw new Error("expected ok");
    expect(inbox.rows[0]!.senderLabel).toBeNull();
  });

  it("read set controls isUnread", () => {
    const state = withQueue(["dialogue_test"]);
    const inbox = buildMailInbox(baseInput({ state, readMessageIds: new Set(["dialogue_test"]) }));
    if (inbox.kind !== "ok") throw new Error("expected ok");
    expect(inbox.rows[0]!.isUnread).toBe(false);
  });

  it("does not include rows absent from queuedDialogue", () => {
    const inbox = buildMailInbox(baseInput());
    expect(inbox.kind).toBe("empty");
  });
});

describe("attachment projection", () => {
  const state = createInitialEngineState();
  const withDetail = { ...state, queuedDialogue: ["dialogue_test"] };
  const input = baseInput({ state: withDetail, selectedNodeId: "dialogue_test" });

  it("detail resolves attachments to assets with evidenceIds from Evidence.assetIds", () => {
    const inbox = buildMailInbox(input);
    if (inbox.kind !== "ok") throw new Error("expected ok");
    const detail = inbox.detail!;
    expect(detail.attachments).toHaveLength(2);

    const evidenceAsset = detail.attachments[0]!;
    expect(evidenceAsset.assetId).toBe("asset_test");
    expect(evidenceAsset.evidenceIds).toEqual(["evidence_test"]);
    expect(evidenceAsset.assetType).toBe("image");

    const plainAsset = detail.attachments[1]!;
    expect(plainAsset.assetId).toBe("asset_test_audio");
    expect(plainAsset.evidenceIds).toEqual([]);
    expect(plainAsset.hasTranscript).toBe(true);
  });

  it("altText stays null when unauthored (component localizes the fallback)", () => {
    const inbox = buildMailInbox(input);
    if (inbox.kind !== "ok") throw new Error("expected ok");
    expect(inbox.detail!.attachments.map((a) => a.altText)).toEqual([null, null]);
  });

  it("altText passes through verbatim when authored", () => {
    const tagged = { ...CONTENT, assets: CONTENT.assets.map((a) => (a.id === "asset_test" ? { ...a, altText: "  Raw alt  " } : a)) };
    const state = withQueue(["dialogue_test"]);
    const detailInbox = buildMailInbox(
      baseInput({ content: tagged, state, selectedNodeId: "dialogue_test" }),
    );
    if (detailInbox.kind !== "ok") throw new Error("expected ok");
    expect(detailInbox.detail!.attachments[0]!.altText).toBe("Raw alt");
  });

  it("time stays null when unauthored", () => {
    const inbox = buildMailInbox(input);
    if (inbox.kind !== "ok") throw new Error("expected ok");
    expect(inbox.detail!.time).toBeNull();
  });

  it("choices pass through verbatim", () => {
    const inbox = buildMailInbox(input);
    if (inbox.kind !== "ok") throw new Error("expected ok");
    expect(inbox.detail!.choices).toEqual([{ choiceId: "choice_test", label: "Continue" }]);
  });
it("multi-evidence reverse lookup preserves content.evidence declaration order on one asset", () => {
    const template = CONTENT.evidence.find((entry) => entry.id === "evidence_test")!;
    const evidenceA = { ...template, id: "evidence_test_a" };
    const evidenceB = { ...template, id: "evidence_test_b" };

    const state = withQueue(["dialogue_test"]);
    const forward = { ...CONTENT, evidence: [evidenceA, evidenceB] };
    const reversed = { ...CONTENT, evidence: [evidenceB, evidenceA] };

    const forwardDetail = buildMailInbox(
      baseInput({ content: forward, state, selectedNodeId: "dialogue_test" }),
    );
    if (forwardDetail.kind !== "ok") throw new Error("expected ok");
    expect(forwardDetail.detail!.attachments[0]!.evidenceIds).toEqual(["evidence_test_a", "evidence_test_b"]);

    const reversedDetail = buildMailInbox(
      baseInput({ content: reversed, state, selectedNodeId: "dialogue_test" }),
    );
    if (reversedDetail.kind !== "ok") throw new Error("expected ok");
    expect(reversedDetail.detail!.attachments[0]!.evidenceIds).toEqual(["evidence_test_b", "evidence_test_a"]);
  });
});

describe("isEvidenceDiscovered", () => {
  const engineState = createInitialEngineState();

  it("is false for plain attachments", () => {
    expect(isEvidenceDiscovered([], engineState)).toBe(false);
  });

  it("true only when all linked evidence discovered", () => {
    const id = ["evidence_test"];
    expect(isEvidenceDiscovered(id, engineState)).toBe(false);
    expect(isEvidenceDiscovered(id, { ...engineState, discoveredEntityIds: ["evidence_test"] })).toBe(true);
  });

  it("handles multi-evidence partially and fully discovered", () => {
    const ids = ["evidence_a", "evidence_b"];
    expect(isEvidenceDiscovered(ids, engineState)).toBe(false);
    expect(isEvidenceDiscovered(ids, { ...engineState, discoveredEntityIds: ["evidence_a"] })).toBe(false);
    expect(isEvidenceDiscovered(ids, { ...engineState, discoveredEntityIds: ["evidence_a", "evidence_b"] })).toBe(true);
  });
});

void bundleJson;
