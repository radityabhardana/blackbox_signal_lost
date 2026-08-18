import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CaseSessionProvider, useOptionalCaseSession } from "@/features/session/case-session";
import { createMessengerTestSession } from "@/test/fixtures/messenger-content";
import { renderWithProviders } from "@/test/helpers/render";
import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import type { DialogueNode } from "@/content/schemas";
import type { CaseEngineState } from "@/domain/engine";
import { MessengerApp } from "./messenger-app";

/**
 * Renders MessengerApp inside a session. A `messengerChannelId` of `null`
 * configures no messenger channel (the honest empty state); omitting the
 * option (or passing a string) uses that channel for the session.
 */
function renderMessenger(options?: {
  initialState?: CaseEngineState;
  messengerChannelId: string | null;
  content?: ContentBundle;
}) {
  const sessionFixture = createMessengerTestSession();
  const channel: string | undefined =
    options?.messengerChannelId === undefined
      ? sessionFixture.messengerChannelId
      : (options.messengerChannelId ?? undefined);
  return renderWithProviders(
    <CaseSessionProvider
      content={options?.content ?? sessionFixture.content}
      mailChannelId="channel_test"
      {...(channel !== undefined ? { messengerChannelId: channel } : {})}
      initialState={options?.initialState ?? sessionFixture.initialState}
    >
      <EngineStateProbe />
      <MessengerApp />
    </CaseSessionProvider>,
  );
}

/**
 * Fixture augmentation: parses the test-session content plus a synthetic
 * 3-choice dialogue node (same channel, no consequences — selection only
 * records the choice), and queues that node for rendering.
 */
const BRANCH_NODE: DialogueNode = {
  id: "dialogue_messenger_branch",
  channelId: "channel_messenger",
  speakerId: "character_test",
  text: "Branch message.",
  enterRule: { always: true },
  choices: [
    { id: "choice_branch_one", label: "Branch one", consequences: [], nextNodeId: "dialogue_messenger_branch" },
    { id: "choice_branch_two", label: "Branch two", consequences: [], nextNodeId: "dialogue_messenger_branch" },
    { id: "choice_branch_three", label: "Branch three", consequences: [], nextNodeId: "dialogue_messenger_branch" },
  ],
};

function branchContent(): ContentBundle {
  const fixture = createMessengerTestSession();
  return contentBundleSchema.parse({
    ...fixture.content,
    dialogue: [...fixture.content.dialogue, BRANCH_NODE],
  });
}

function branchState(): CaseEngineState {
  const fixture = createMessengerTestSession();
  return {
    ...fixture.initialState,
    queuedDialogue: [...fixture.initialState.queuedDialogue, "dialogue_messenger_branch"],
  };
}

/** Test-only probe: snapshots the authoritative engine state for assertions. */
function EngineStateProbe() {
  const session = useOptionalCaseSession();
  return <output data-testid="engine-state">{JSON.stringify(session?.state ?? null)}</output>;
}

function readEngineState(): CaseEngineState {
  return JSON.parse(screen.getByTestId("engine-state").textContent!) as CaseEngineState;
}

function choiceInputIds(state: CaseEngineState): string[] {
  return state.eventHistory
    .filter((event) => event.type === "dialogue_choice_selected")
    .map((event) => event.entityId ?? "");
}

describe("MessengerApp no-session empty state", () => {
  it("renders No messages without a session", () => {
    renderWithProviders(<MessengerApp />);
    expect(screen.getByRole("region", { name: "Messenger" })).toHaveTextContent("No messages");
  });
});

describe("MessengerApp with session", () => {
  it("renders the queued greeting with sender, body, and the authored choice", () => {
    renderMessenger();

    expect(screen.getByText("Test Character")).toBeInTheDocument();
    expect(screen.getByText("First test message.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acknowledge — continue" })).toBeEnabled();
    expect(screen.queryByText("Reply acknowledged.")).not.toBeInTheDocument();
  });

  it("renders the honest No messages empty state when messengerChannelId is undefined", () => {
    renderMessenger({
      initialState: createMessengerTestSession().initialState,
      messengerChannelId: null,
    });
    expect(screen.getByRole("region", { name: "Messenger" })).toHaveTextContent("No messages");
  });

  it("choosing replies dispatches dialogue_choice_selected exactly once and queues the reply", async () => {
    renderMessenger();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Acknowledge — continue" }));

    const state = readEngineState();
    expect(choiceInputIds(state)).toEqual(["choice_messenger_confirm"]);
    expect(state.queuedDialogue).toEqual([
      "dialogue_messenger_greeting",
      "dialogue_messenger_reply",
    ]);
    expect(screen.getByText("Reply acknowledged.")).toBeInTheDocument();
  });

  it("a second activation cannot duplicate the queue_dialogue consequence (re-click safety)", async () => {
    renderMessenger();
    const user = userEvent.setup();

    const button = screen.getByRole("button", { name: "Acknowledge — continue" });
    await user.click(button);

    expect(button).toBeDisabled();

    // A disabled button cannot dispatch; click it anyway to prove the guard.
    fireEvent.click(button);
    fireEvent.click(button);

    const state = readEngineState();
    expect(choiceInputIds(state)).toEqual(["choice_messenger_confirm"]);
    expect(state.queuedDialogue).toEqual([
      "dialogue_messenger_greeting",
      "dialogue_messenger_reply",
    ]);
    expect(screen.getAllByText("Reply acknowledged.")).toHaveLength(1);
  });

  it("the authored choice is reachable and activatable by keyboard", async () => {
    renderMessenger();
    const user = userEvent.setup();

    const button = screen.getByRole("button", { name: "Acknowledge — continue" });
    button.focus();
    await user.keyboard("{Enter}");

    const state = readEngineState();
    expect(choiceInputIds(state)).toEqual(["choice_messenger_confirm"]);
    expect(state.queuedDialogue).toEqual([
      "dialogue_messenger_greeting",
      "dialogue_messenger_reply",
    ]);
    expect(button).toBeDisabled();
  });

  it("duplicate queued node renders once per occurrence without React key warnings", async () => {
    const consoleErrors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      consoleErrors.push(args.map(String).join(" "));
    };

    try {
      const sessionFixture = createMessengerTestSession();
      const dupState = {
        ...sessionFixture.initialState,
        queuedDialogue: ["dialogue_messenger_greeting", "dialogue_messenger_greeting"] as const,
      };
      renderMessenger({
        initialState: dupState,
        messengerChannelId: sessionFixture.messengerChannelId,
      });

      expect(screen.getAllByText("First test message.")).toHaveLength(2);
      expect(consoleErrors.some((message) => /two children with the same key/i.test(message))).toBe(false);
    } finally {
      console.error = originalError;
    }
  });

  it("selecting one choice disables all sibling choices on the node", async () => {
    renderMessenger({
      initialState: branchState(),
      messengerChannelId: "channel_messenger",
      content: branchContent(),
    });
    const user = userEvent.setup();

    const one = screen.getByRole("button", { name: "Branch one" });
    const two = screen.getByRole("button", { name: "Branch two" });
    const three = screen.getByRole("button", { name: "Branch three" });

    await user.click(one);

    expect(two).toBeDisabled();
    expect(three).toBeDisabled();

    // Clicking a disabled sibling must not dispatch a second event.
    fireEvent.click(two);
    fireEvent.click(three);

    const state = readEngineState();
    expect(choiceInputIds(state)).toEqual(["choice_branch_one"]);
  });

  it("all three choices enabled before any selection", () => {
    renderMessenger({
      initialState: branchState(),
      messengerChannelId: "channel_messenger",
      content: branchContent(),
    });

    expect(screen.getByRole("button", { name: "Branch one" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Branch two" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Branch three" })).toBeEnabled();
  });

  it("keyboard activation of first choice works, then siblings disabled", async () => {
    renderMessenger({
      initialState: branchState(),
      messengerChannelId: "channel_messenger",
      content: branchContent(),
    });
    const user = userEvent.setup();

    const one = screen.getByRole("button", { name: "Branch one" });
    const two = screen.getByRole("button", { name: "Branch two" });
    one.focus();
    await user.keyboard("{Enter}");

    const state = readEngineState();
    expect(choiceInputIds(state)).toEqual(["choice_branch_one"]);
    expect(one).toBeDisabled();
    expect(two).toBeDisabled();
  });

  it("single-choice node still disables its own button after selection (regression)", async () => {
    renderMessenger();
    const user = userEvent.setup();

    const button = screen.getByRole("button", { name: "Acknowledge — continue" });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(choiceInputIds(readEngineState())).toEqual(["choice_messenger_confirm"]);
  });
});