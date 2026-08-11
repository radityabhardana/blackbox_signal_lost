import { describe, expect, it } from "vitest";
import { contentBundleSchema } from "../../content/validator";
import { createInitialEngineState, stepCaseEngine } from "../engine";
import type { CaseEngineState } from "../engine";
import type { ContentBundle } from "../../content/validator";
import { loadRecordsTestBundle } from "@/test/fixtures/records-content";
import { buildRecordsModel } from "./index";

const FIXTURE = loadRecordsTestBundle();

function stateWith(overrides: Partial<CaseEngineState> = {}): CaseEngineState {
  return { ...createInitialEngineState(), ...overrides };
}

function model(
  state: CaseEngineState,
  overrides: { searchQuery?: string; selectedRecordId?: string | null } = {},
  content: ContentBundle = FIXTURE,
) {
  return buildRecordsModel({
    content,
    state,
    searchQuery: overrides.searchQuery ?? "",
    selectedRecordId: overrides.selectedRecordId ?? null,
  });
}

describe("buildRecordsModel search-first", () => {
  it("renders the search prompt, not a browse list, for a blank query", () => {
    expect(model(stateWith(), { searchQuery: "" })).toEqual({ kind: "search-prompt" });
    expect(model(stateWith(), { searchQuery: "   " })).toEqual({ kind: "search-prompt" });
  });

  it("never lists unlocked records without a query, even when unlocked", () => {
    const { initialState } = makeBootstrappedSession();
    expect(model(initialState)).toEqual({ kind: "search-prompt" });
  });

  it("does not consult unlockedRecords: always-available records surface on a fresh state", () => {
    const result = model(stateWith(), { searchQuery: "test" });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows).toEqual([
      {
        recordId: "record_test",
        title: "Test record",
        recordType: "test",
        createdAt: "2041-11-18T22:00:00Z",
        available: true,
      },
    ]);
  });

  it("preserves ranked order across multiple matches", () => {
    const content = withAlwaysAvailableContent();
    const result = model(stateWith(), { searchQuery: "ferry" }, content);
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows.map((row) => row.recordId)).toEqual(["record_gated_test", "record_second"]);
  });

  it("returns no rows when nothing matches", () => {
    const result = model(stateWith(), { searchQuery: "fishing" });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows).toEqual([]);
    expect(result.detail).toBeNull();
  });

  it("skips available results whose record is missing defensively", () => {
    const content: ContentBundle = {
      ...FIXTURE,
      records: FIXTURE.records.filter((record) => record.id !== "record_test"),
    };
    const result = model(stateWith(), { searchQuery: "test" }, content);
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows).toEqual([]);
  });
});

describe("buildRecordsModel availability through BBX-023", () => {
  it("keeps a record gated on record_opened out of results before the event", () => {
    const result = model(stateWith(), { searchQuery: "ferry" });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows).toEqual([]);
  });

  it("surfaces a record once the engine has recorded record_opened", () => {
    const result = model(stateWith({ eventHistory: [{ type: "record_opened" }] }), {
      searchQuery: "ferry",
    });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows.map((row) => row.recordId)).toEqual(["record_second"]);
    expect(result.rows[0]).toEqual(
      expect.objectContaining({ title: "Ferry transfer log", available: true }),
    );
  });

  it("renders a classified placeholder as a generic sanitized row", () => {
    const result = model(stateWith(), { searchQuery: "reactor" });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows).toEqual([
      { recordId: "record_classified_test", title: null, recordType: null, createdAt: null, available: false },
    ]);
  });

  it("keeps hidden-unavailable records entirely out of results", () => {
    const result = model(stateWith(), { searchQuery: "personnel" });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows).toEqual([]);
  });

  it("never dereferences a classified placeholder into detail", () => {
    const result = model(stateWith(), {
      searchQuery: "reactor",
      selectedRecordId: "record_classified_test",
    });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows[0]?.available).toBe(false);
    expect(result.detail).toBeNull();
  });

  it("keeps a classified placeholder generic even when its record is missing", () => {
    const content: ContentBundle = {
      ...FIXTURE,
      records: FIXTURE.records.filter((record) => record.id !== "record_classified_test"),
    };
    const result = model(stateWith(), { searchQuery: "reactor" }, content);
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.rows).toEqual([
      expect.objectContaining({ recordId: "record_classified_test", available: false, title: null }),
    ]);
  });
});

describe("buildRecordsModel detail", () => {
  it("projects detail only for a record available in the current results", () => {
    const result = model(
      stateWith({ discoveredEntityIds: ["evidence_test"] }),
      { searchQuery: "test", selectedRecordId: "record_test" },
    );
    if (result.kind !== "ok" || result.detail === null) throw new Error("expected detail");
    expect(result.detail).toEqual({
      recordId: "record_test",
      title: "Test record",
      recordType: "test",
      createdAt: "2041-11-18T22:00:00Z",
      revisedAt: null,
      sourceLabel: "test",
      relatedLabels: [],
      evidenceLabel: "Test evidence",
      metadata: [],
    });
  });

  it("hides the evidence label until the evidence is discovered", () => {
    const undiscovered = model(stateWith(), { searchQuery: "test", selectedRecordId: "record_test" });
    if (undiscovered.kind !== "ok" || undiscovered.detail === null) throw new Error("expected detail");
    expect(undiscovered.detail.evidenceLabel).toBeNull();

    const discovered = model(
      stateWith({ discoveredEntityIds: ["evidence_test"] }),
      { searchQuery: "test", selectedRecordId: "record_test" },
    );
    if (discovered.kind !== "ok" || discovered.detail === null) throw new Error("expected detail");
    expect(discovered.detail.evidenceLabel).toBe("Test evidence");
  });

  it("resolves related labels only against records, raw id otherwise", () => {
    const record = FIXTURE.records.find((entry) => entry.id === "record_test")!;
    const content: ContentBundle = {
      ...FIXTURE,
      records: [
        ...FIXTURE.records.filter((entry) => entry.id !== "record_test"),
        { ...record, relatedEntityIds: ["evidence_test", "character_test", "record_second"] },
      ],
    };
    const result = model(stateWith(), { searchQuery: "test", selectedRecordId: "record_test" }, content);
    if (result.kind !== "ok" || result.detail === null) throw new Error("expected detail");
    expect(result.detail.relatedLabels).toEqual([
      { entityId: "evidence_test", label: "evidence_test" },
      { entityId: "character_test", label: "character_test" },
      { entityId: "record_second", label: "Ferry transfer log" },
    ]);
  });

  it("falls back to the raw id when a related record is unknown", () => {
    const record = FIXTURE.records.find((entry) => entry.id === "record_second")!;
    const content: ContentBundle = {
      ...FIXTURE,
      records: [
        ...FIXTURE.records.filter((entry) => entry.id !== "record_second"),
        { ...record, relatedEntityIds: ["entity_missing"] },
      ],
    };
    const result = model(
      stateWith({ eventHistory: [{ type: "record_opened" }] }),
      { searchQuery: "ferry", selectedRecordId: "record_second" },
      content,
    );
    if (result.kind !== "ok" || result.detail === null) throw new Error("expected detail");
    expect(result.detail.relatedLabels).toEqual([{ entityId: "entity_missing", label: "entity_missing" }]);
  });

  it("returns null detail for a selection outside the current results", () => {
    const result = model(stateWith(), { searchQuery: "ferry", selectedRecordId: "record_test" });
    if (result.kind !== "ok") throw new Error("expected ok");
    expect(result.detail).toBeNull();
  });

  it("computes the source label from system first, then organizationId", () => {
    const bySystem = model(
      stateWith({ eventHistory: [{ type: "record_opened" }] }),
      { searchQuery: "ferry", selectedRecordId: "record_second" },
    );
    if (bySystem.kind !== "ok" || bySystem.detail === null) throw new Error("expected detail");
    expect(bySystem.detail.sourceLabel).toBe("org_ferry_services");

    const record = FIXTURE.records.find((entry) => entry.id === "record_second")!;
    const noOrganization: ContentBundle = {
      ...FIXTURE,
      records: [
        ...FIXTURE.records.filter((entry) => entry.id !== "record_second"),
        { ...record, source: { system: undefined, organizationId: undefined } },
      ],
    };
    const unknown = model(
      stateWith({ eventHistory: [{ type: "record_opened" }] }),
      { searchQuery: "ferry", selectedRecordId: "record_second" },
      noOrganization,
    );
    if (unknown.kind !== "ok" || unknown.detail === null) throw new Error("expected detail");
    expect(unknown.detail.sourceLabel).toBe("Unknown source");
  });
});

/** Boots the real engine through the test bundle's bootstrap trigger. */
function makeBootstrappedSession() {
  const content = loadRecordsTestBundle();
  const initialState = stepCaseEngine(
    createInitialEngineState(),
    { kind: "game_event", event: { type: "records_test_bootstrap" } },
    content,
  ).state;
  return { content, initialState };
}

/** Fixture clone where every synthetic record is always available. */
function withAlwaysAvailableContent(): ContentBundle {
  const fixture = loadRecordsTestBundle();
  return contentBundleSchema.parse({
    ...fixture,
    case: {
      ...fixture.case,
      searchableIndex: fixture.case.searchableIndex.map((entry) =>
        entry.entityType === "record" &&
        (entry.entityId === "record_second" || entry.entityId === "record_gated_test")
          ? { ...entry, partialTerms: ["ferry"], availabilityRule: { always: true } }
          : entry,
      ),
    },
  });
}