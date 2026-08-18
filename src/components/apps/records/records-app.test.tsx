import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CaseSessionProvider, useCaseSession } from "@/features/session/case-session";
import { createRecordsTestSession } from "@/test/fixtures/records-content";
import { renderWithProviders } from "@/test/helpers/render";
import { RecordsApp } from "./records-app";

type EngineEvent = { type: string; entityId?: string };

function Harness() {
  const session = useCaseSession();
  return (
    <>
      <output data-testid="event-history">{JSON.stringify(session.state.eventHistory)}</output>
      <RecordsApp />
    </>
  );
}

function renderRecords() {
  const fixture = createRecordsTestSession();
  renderWithProviders(
    <CaseSessionProvider
      content={fixture.content}
      mailChannelId={fixture.mailChannelId}
      initialState={fixture.initialState}
    >
      <Harness />
    </CaseSessionProvider>,
  );
  return fixture;
}

function eventHistory(): readonly EngineEvent[] {
  const output = screen.getByTestId("event-history");
  return JSON.parse(output.textContent ?? "[]") as readonly EngineEvent[];
}

describe("RecordsApp", () => {
  it("is search-first: no results before a query is submitted", async () => {
    renderRecords();
    expect(screen.getByText(/search the archive to find records/i)).toBeVisible();
    expect(screen.queryByRole("button", { name: /test record/i })).not.toBeInTheDocument();
  });

  it("emits record_opened when an available record is opened, and nothing else", async () => {
    renderRecords();
    const user = userEvent.setup();
    const baseline = eventHistory();

    await user.type(screen.getByRole("searchbox", { name: /search records/i }), "test");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await user.click(screen.getByRole("button", { name: /test record/i }));

    expect(eventHistory()).toEqual([...baseline, { type: "record_opened", entityId: "record_test" }]);
    expect(screen.getByRole("region", { name: "Record" })).toHaveTextContent("Test record");
    expect(screen.queryByText("Test evidence")).not.toBeInTheDocument();
  });

  it("keeps classified placeholders generic and inert", async () => {
    renderRecords();
    const user = userEvent.setup();
    const baseline = eventHistory();

    await user.type(screen.getByRole("searchbox", { name: /search records/i }), "reactor");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.queryByRole("button", { name: /reactor/i })).not.toBeInTheDocument();
    expect(screen.getByText("Unavailable record")).toBeVisible();

    await user.click(screen.getByText("Unavailable record"));
    expect(eventHistory()).toEqual(baseline);
    expect(screen.queryByText("Reactor core inspection")).not.toBeInTheDocument();
  });

  it("surfaces a record only after record_opened unlocked it", async () => {
    renderRecords();
    const user = userEvent.setup();

    const searchbox = screen.getByRole("searchbox", { name: /search records/i });
    await user.type(searchbox, "ferry");
    await user.keyboard("{Enter}");
    expect(screen.getByText(/no records match your search/i)).toBeVisible();

    await user.clear(searchbox);
    await user.type(searchbox, "test");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: /test record/i }));

    await user.clear(searchbox);
    await user.type(searchbox, "ferry");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: /ferry transfer log/i })).toBeVisible();
  });
});