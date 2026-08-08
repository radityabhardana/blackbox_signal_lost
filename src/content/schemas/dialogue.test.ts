import { describe, expect, it } from "vitest";
import { dialogueNodeSchema } from "./dialogue";

const baseNode = {
  id: "msg_test",
  channelId: "chan_test",
  speakerId: "char_test",
  text: "Test node text.",
  enterRule: { always: true },
};

describe("dialogueNodeSchema", () => {
  it("accepts a minimum valid dialogue node", () => {
    expect(dialogueNodeSchema.safeParse(baseNode).success).toBe(true);
  });

  it("accepts optional choices and attachments", () => {
    expect(
      dialogueNodeSchema.safeParse({
        ...baseNode,
        choices: [
          {
            id: "choice_test",
            label: "Continue",
            consequences: [],
            nextNodeId: "msg_test_next",
          },
        ],
        attachments: ["asset_test"],
        nextNodeId: "msg_test_next",
      }).success,
    ).toBe(true);
  });

  it("rejects missing text", () => {
    const { text: _text, ...missing } = baseNode;
    expect(dialogueNodeSchema.safeParse(missing).success).toBe(false);
  });
});