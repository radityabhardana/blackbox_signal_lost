import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CaseSessionProvider, useOptionalCaseSession } from "@/features/session/case-session";
import { createMessengerTestSession } from "@/test/fixtures/messenger-content";
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
}) {
  const sessionFixture = createMessengerTestSession();
  const channel: string | undefined =
    options?.messengerChannelId === undefined
      ? sessionFixture.messengerChannelId
      : (options.messengerChannelId ?? undefined);
  return render(
    <CaseSessionProvider
      content={sessionFixture.content}
      mailChannelId="channel_test"
      {...(channel !== undefined ? { messengerChannelId: channel } : {})}
      initialState={options?.initialState ?? sessionFixture.initialState}
    >
      <EngineStateProbe />
      <MessengerApp />
    </CaseSessionProvider>,
  );
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
    render(<MessengerApp />);
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
});