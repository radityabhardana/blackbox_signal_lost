import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { loadCase001Session } from "@/content/cases/case_001_missing_signal";
import type { ContentBundle } from "@/content/validator";
import { LocaleContext, LocaleProvider } from "@/lib/locale/provider";
import { CaseSessionProvider, useOptionalCaseSession } from "./case-session";

function ContentProbe({ canonical }: { canonical: ContentBundle }) {
  const session = useOptionalCaseSession();
  if (session === null) return null;
  const content = session.content;
  const objective = content.case.objectives.find((o) => o.id === "obj_001_verify_location");
  const record = content.records.find((r) => r.id === "rec_001_ferry_departure");
  return (
    <section>
      <span data-testid="objective-title">{objective?.title ?? ""}</span>
      <span data-testid="record-title">{record?.title ?? ""}</span>
      <span data-testid="is-canonical">{String(content === canonical)}</span>
      <span data-testid="objective-ids">{JSON.stringify(content.case.objectives.map((o) => o.id))}</span>
      <span data-testid="completion-rules">{JSON.stringify(content.case.objectives.map((o) => o.completionRule))}</span>
      <span data-testid="triggers">{JSON.stringify(content.case.triggers)}</span>
      <span data-testid="outcomes">{JSON.stringify(content.case.outcomes)}</span>
      <span data-testid="discovery-rules">{JSON.stringify(content.evidence.map((e) => e.discoveryRule))}</span>
    </section>
  );
}

function LocaleSwitcher() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleSwitcher requires a LocaleProvider");
  const { setLocale } = context;
  return (
    <button type="button" onClick={() => setLocale("id")}>
      switch to id
    </button>
  );
}

function renderSession(content: ContentBundle, initialLocale: "en" | "id") {
  const { initialState } = loadCase001Session();
  return render(
    <LocaleProvider initialLocale={initialLocale}>
      <CaseSessionProvider content={content} mailChannelId="channel_001_mail" initialState={initialState}>
        <ContentProbe canonical={content} />
        <LocaleSwitcher />
      </CaseSessionProvider>
    </LocaleProvider>,
  );
}

describe("CaseSessionProvider localization", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the canonical bundle reference for the en locale", () => {
    const { content } = loadCase001Session();
    renderSession(content, "en");
    expect(screen.getByTestId("is-canonical").textContent).toBe("true");
  });

  it("overlays presentation fields for the id locale while keeping ids and rules identical", () => {
    const { content } = loadCase001Session();
    renderSession(content, "id");

    // Presentation is overlaid; the bundle is a derived copy, not the canonical ref.
    expect(screen.getByTestId("objective-title").textContent).toBe(
      "Verifikasi lokasi terakhir Maya Pranata yang terkonfirmasi",
    );
    expect(screen.getByTestId("record-title").textContent).toBe("Catatan Keberangkatan Feri");
    expect(screen.getByTestId("is-canonical").textContent).toBe("false");

    // Ids and progression-critical structures are untouched.
    expect(JSON.parse(screen.getByTestId("objective-ids").textContent!)).toEqual(
      content.case.objectives.map((o) => o.id),
    );
    expect(JSON.parse(screen.getByTestId("completion-rules").textContent!)).toEqual(
      content.case.objectives.map((o) => o.completionRule),
    );
    expect(JSON.parse(screen.getByTestId("triggers").textContent!)).toEqual(content.case.triggers);
    expect(JSON.parse(screen.getByTestId("outcomes").textContent!)).toEqual(content.case.outcomes);
    expect(JSON.parse(screen.getByTestId("discovery-rules").textContent!)).toEqual(
      content.evidence.map((e) => e.discoveryRule),
    );
  });

  it("switches the consumed bundle live when the locale changes", async () => {
    const { content } = loadCase001Session();
    const user = userEvent.setup();
    renderSession(content, "en");

    expect(screen.getByTestId("objective-title").textContent).toBe(
      "Verify Maya Pranata's final confirmed location",
    );
    expect(screen.getByTestId("is-canonical").textContent).toBe("true");
    await user.click(screen.getByRole("button", { name: "switch to id" }));
    expect(screen.getByTestId("objective-title").textContent).toBe(
      "Verifikasi lokasi terakhir Maya Pranata yang terkonfirmasi",
    );
    expect(screen.getByTestId("record-title").textContent).toBe("Catatan Keberangkatan Feri");
    expect(screen.getByTestId("is-canonical").textContent).toBe("false");
  });
});
