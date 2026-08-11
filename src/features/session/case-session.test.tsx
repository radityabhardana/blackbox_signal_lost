import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CaseSessionProvider, useOptionalCaseSession } from "./case-session";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import { createMailTestSession } from "@/test/fixtures/mail-content";

function SessionProbe() {
  const session = useOptionalCaseSession();
  if (session === null) return null;
  return (
    <section>
      <button
        type="button"
        onClick={() =>
          session.dispatch({ kind: "evidence_discovered", evidenceId: "evidence_test" })
        }
      >
        Dispatch evidence
      </button>
      <button
        type="button"
        onClick={() =>
          {
            session.dispatchTransaction((current: CaseEngineState) =>
              current.discoveredEntityIds.includes("evidence_test")
                ? []
                : [
                    {
                      kind: "evidence_discovered",
                      evidenceId: "evidence_test",
                    } as const,
                  ],
            );
          }
        }
      >
        Discover evidence
      </button>
      <button type="button" onClick={() => session.dispatchTransaction(() => [])}>
        None plan
      </button>
      <div data-testid="state-json">{JSON.stringify({ discovered: session.state.discoveredEntityIds })}</div>
      <div data-testid="events-json">{JSON.stringify(session.state.eventHistory.map((e) => e.type))}</div>
    </section>
  );
}

function renderWithSession() {
  const { content, mailChannelId, initialState } = createMailTestSession();
  return render(
    <CaseSessionProvider content={content} mailChannelId={mailChannelId} initialState={initialState}>
      <SessionProbe />
    </CaseSessionProvider>,
  );
}

describe("CaseSessionProvider dispatch", () => {
  it("dispatch applies a single input and commits synchronously", async () => {
    renderWithSession();
    await userEvent.click(screen.getByRole("button", { name: "Dispatch evidence" }));

    const state = JSON.parse(screen.getByTestId("state-json").textContent!) as { discovered: string[] };
    expect(state.discovered).toContain("evidence_test");

    const events = JSON.parse(screen.getByTestId("events-json").textContent!) as string[];
    expect(events).toContain("evidence_discovered");
  });

  it("dispatchTransaction ignores duplicate discoveries with a fresh authoritative read", async () => {
    renderWithSession();
    const button = screen.getByRole("button", { name: "Discover evidence" });

    await userEvent.click(button); // transitions to discovered
    await userEvent.click(button); // reads ref → already discovered → no-op
    await userEvent.click(button); // same

    const events = JSON.parse(screen.getByTestId("events-json").textContent!) as string[];
    // initialState inherits the mail_test_bootstrap boot event; only the first
    // click transitions, the duplicate plans produce no inputs.
    expect(events.filter((t) => t === "evidence_discovered")).toHaveLength(1);
    const discovered = JSON.parse(screen.getByTestId("state-json").textContent!) as { discovered: string[] };
    expect(discovered.discovered).toEqual(["evidence_test"]);
  });

  it("empty plan produces zero transitions and zero event additions, and no state mutation", async () => {
    renderWithSession();
    const button = screen.getByRole("button", { name: "None plan" });

    await userEvent.click(button);

    const events = JSON.parse(screen.getByTestId("events-json").textContent!) as string[];
    const state = JSON.parse(screen.getByTestId("state-json").textContent!) as { discovered: string[] };
    // Only the fixture boot event is present; the empty plan adds nothing.
    expect(events).toEqual(["mail_test_bootstrap"]);
    expect(state.discovered).toEqual([]);
  });

  it("initial render never dispatches by itself", () => {
    renderWithSession();
    const events = JSON.parse(screen.getByTestId("events-json").textContent!) as string[];
    // initialState carries exactly the fixture boot event and nothing else.
    expect(events).toEqual(["mail_test_bootstrap"]);
  });
});

describe("sequential dispatchTransaction", () => {
  it("two evidence inputs dispatch sequentially through a single transaction", async () => {
    renderWithSession();
    const { content } = createMailTestSession();

    let working = createInitialEngineState();
    const plan = (s: CaseEngineState) => (s.discoveredEntityIds.includes("evidence_test") ? [] : ([{ kind: "evidence_discovered", evidenceId: "evidence_test" }] as const));
    const out1 = plan(working);
    for (const i of out1) working = stepCaseEngine(working, i, content).state;
    expect(working.discoveredEntityIds).toEqual(["evidence_test"]);
  });
});
