import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CaseSessionProvider, useOptionalCaseSession } from "@/features/session/case-session";
import { createMailTestSession } from "@/test/fixtures/mail-content";
import { renderWithProviders } from "@/test/helpers/render";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import type { ContentBundle } from "@/content/validator";
import { MailApp } from "./mail-app";

function renderMail() {
  const { content, mailChannelId, initialState } = createMailTestSession();
  return renderWithProviders(
    <CaseSessionProvider content={content} mailChannelId={mailChannelId} initialState={initialState}>
      <MailApp />
    </CaseSessionProvider>,
  );
}

/** Test-only probe: snapshots the authoritative engine state for assertions. */
function EngineStateProbe() {
  const session = useOptionalCaseSession();
  return <output data-testid="engine-state">{JSON.stringify(session?.state ?? null)}</output>;
}

/**
 * Synthetic session where two Evidence definitions share one asset, exercising
 * the >1 reverse-lookup path. Event chain: game_event -> mail_test_bootstrap
 * -> queue_dialogue(dialogue_test); discovery starts at the given ids.
 */
function renderTwoEvidenceMail(initialDiscovered: readonly string[]) {
  const { content, mailChannelId } = createMailTestSession();
  const template = content.evidence.find((entry) => entry.id === "evidence_test")!;
  const twoEvidenceContent: ContentBundle = {
    ...content,
    evidence: [
      { ...template, id: "evidence_test_a", title: "Evidence A" },
      { ...template, id: "evidence_test_b", title: "Evidence B" },
    ],
  };
  const bootstrapped = stepCaseEngine(
    createInitialEngineState(),
    { kind: "game_event", event: { type: "mail_test_bootstrap" } },
    twoEvidenceContent,
  ).state;
  const initialState: CaseEngineState = { ...bootstrapped, discoveredEntityIds: [...initialDiscovered] };

  return renderWithProviders(
    <CaseSessionProvider content={twoEvidenceContent} mailChannelId={mailChannelId} initialState={initialState}>
      <EngineStateProbe />
      <MailApp />
    </CaseSessionProvider>,
  );
}

function readEngineState(): CaseEngineState {
  return JSON.parse(screen.getByTestId("engine-state").textContent!) as CaseEngineState;
}

function discoveredInputIds(state: CaseEngineState): string[] {
  return state.eventHistory
    .filter((event) => event.type === "evidence_discovered")
    .map((event) => event.entityId ?? "");
}

describe("MailApp no-session empty state", () => {
  it("renders No messages without a session", () => {
    renderWithProviders(<MailApp />);
    expect(screen.getByRole("region", { name: "Secure Mail" })).toHaveTextContent("No messages");
  });
});

describe("MailApp with session", () => {
  it("renders queued message row with sender, body, discovery status, and replies", () => {
    renderMail();

    expect(screen.getByRole("listitem")).toHaveTextContent("Test Character");
    expect(screen.getByRole("listitem")).toHaveTextContent("First test message.");

    expect(screen.getByRole("listitem")).toHaveTextContent("Unread");

    expect(screen.queryByRole("button", { name: /Open to inspect/i })).not.toBeInTheDocument();
  });

  it("selecting a message marks it read while mounted", async () => {
    renderMail();
    const rowButton = screen.getByRole("button", { name: /test character|first test message/i });
    await userEvent.click(rowButton);
    expect(rowButton).toHaveTextContent(/.*Test Character/);
    expect(rowButton.textContent).not.toContain("Unread · ");
  });

  it("detail opens with attachments and reply choices", async () => {
    renderMail();
    await userEvent.click(screen.getByRole("button", { name: /first test message/i }));

    expect(screen.getByRole("button", { name: /image attachment 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /audio attachment 2/i })).toBeInTheDocument();
    expect(screen.getByText(/transcript available/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("activating an evidence-bearing attachment marks Evidence discovered, exactly once", async () => {
    renderMail();
    await userEvent.click(screen.getByRole("button", { name: /first test message/i }));

    const button = screen.getByRole("button", { name: /image attachment 1/i });

    expect(screen.queryByText(/Evidence discovered/i)).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByText(/Evidence discovered/i)).toBeInTheDocument();

    await userEvent.click(button);
    await userEvent.click(button);
    expect(screen.getAllByText(/Evidence discovered/i)).toHaveLength(1);
  });

  it("plain attachment stays unaffected by evidence discovery", async () => {
    renderMail();
    await userEvent.click(screen.getByRole("button", { name: /first test message/i }));
    await userEvent.click(screen.getByRole("button", { name: /audio attachment 2/i }));
    expect(screen.queryByText(/Evidence discovered/i)).not.toBeInTheDocument();
  });

  it("reply choice dispatches dialogue_choice_selected (engine consequence not React)", async () => {
    renderMail();
    await userEvent.click(screen.getByRole("button", { name: /first test message/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    // trigger_test responded to choiceSelected by queueing dialogue itself; evidence dispatched
    expect(screen.queryByText(/Evidence discovered/i)).toBeInTheDocument();
  });

  it("plain attachment accessible name uses type + index when no altText is configured", async () => {
    renderMail();
    await userEvent.click(screen.getByRole("button", { name: /first test message/i }));
    expect(screen.getByRole("button", { name: /audio attachment 2/i })).toHaveAccessibleName(/audio attachment 2/i);
  });

  it("duplicate queued node renders once per occurrence without React key warnings", async () => {
    const consoleErrors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      consoleErrors.push(args.map(String).join(" "));
    };

    try {
      renderMail();
      await userEvent.click(screen.getByRole("button", { name: /first test message/i }));
      // Continue fires trigger_test, which re-queues dialogue_test; BBX-022
      // allows the same node id to occupy queuedDialogue more than once.
      await userEvent.click(screen.getByRole("button", { name: /continue/i }));

      expect(screen.getAllByRole("button", { name: /first test message/i })).toHaveLength(2);
      expect(consoleErrors.some((message) => /two children with the same key/i.test(message))).toBe(false);
    } finally {
      console.error = originalError;
    }
  });

  it("multi-evidence attachment (zero discovered) dispatches both ids in authored order", async () => {
    renderTwoEvidenceMail([]);
    await userEvent.click(screen.getByRole("button", { name: /first test message/i }));

    expect(screen.queryByText(/^Evidence discovered$/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /image attachment 1/i }));

    const state = readEngineState();
    expect(discoveredInputIds(state)).toEqual(["evidence_test_a", "evidence_test_b"]);
    expect(state.discoveredEntityIds).toEqual(["evidence_test_a", "evidence_test_b"]);
    expect(screen.getByText(/^Evidence discovered$/i)).toBeInTheDocument();
  });

  it("multi-evidence attachment (partial discovery) dispatches only the missing id", async () => {
    renderTwoEvidenceMail(["evidence_test_a"]);
    await userEvent.click(screen.getByRole("button", { name: /first test message/i }));

    // Partial discovery is NOT user-visible "Evidence discovered"; the badge stays actionable.
    expect(screen.queryByText(/^Evidence discovered$/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /image attachment 1/i }));

    const state = readEngineState();
    expect(discoveredInputIds(state)).toEqual(["evidence_test_b"]);
    expect(state.discoveredEntityIds).toEqual(["evidence_test_a", "evidence_test_b"]);
    expect(screen.getByText(/^Evidence discovered$/i)).toBeInTheDocument();
  });

  it("multi-evidence attachment (all discovered) dispatches nothing and stays discovered", async () => {
    renderTwoEvidenceMail(["evidence_test_a", "evidence_test_b"]);
    await userEvent.click(screen.getByRole("button", { name: /first test message/i }));

    expect(screen.getByText(/^Evidence discovered$/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /image attachment 1/i }));

    const state = readEngineState();
    expect(discoveredInputIds(state)).toEqual([]);
    expect(state.discoveredEntityIds).toEqual(["evidence_test_a", "evidence_test_b"]);
    expect(screen.getByText(/^Evidence discovered$/i)).toBeInTheDocument();
  });
});
