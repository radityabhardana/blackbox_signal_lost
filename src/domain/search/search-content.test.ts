import { describe, expect, it } from "vitest";
import { searchContent } from "./index";
import { normalizeTerm } from "./index";
import type { RuleEvaluationContext } from "../rules";
import type { SearchIndexEntry } from "../../content/schemas";

function entry(
  partial: Partial<SearchIndexEntry> & Pick<SearchIndexEntry, "entityId" | "title">,
): SearchIndexEntry {
  return {
    entityType: "record",
    exactTerms: [],
    aliases: [],
    partialTerms: [],
    unavailableBehavior: "hidden",
    availabilityRule: { always: true },
    authoredRank: 0,
    ...partial,
  };
}

function context(overrides: Partial<RuleEvaluationContext> = {}): RuleEvaluationContext {
  return {
    flags: {},
    events: [],
    discoveredEntities: new Set(),
    completedObjectives: new Set(),
    selectedChoices: new Set(),
    ...overrides,
  };
}

describe("normalizeTerm", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeTerm("  ferry   departure  ")).toBe("ferry departure");
  });

  it("lowercases without locale sensitivity", () => {
    expect(normalizeTerm("Ferry Departure")).toBe("ferry departure");
  });

  it("replaces punctuation runs with a single space", () => {
    expect(normalizeTerm("ferry-departure!?")).toBe("ferry departure");
  });

  it("preserves Unicode letters and numbers, without diacritic folding", () => {
    expect(normalizeTerm("café")).toBe("café");
    expect(normalizeTerm("CAFÉ")).toBe("café");
    expect(normalizeTerm("區塊鏈123")).toBe("區塊鏈123");
  });
});

describe("searchContent normalization behavior", () => {
  it("returns [] for empty and whitespace-only queries", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "Ferry" })] };
    expect(searchContent("", index, context())).toEqual([]);
    expect(searchContent("   ", index, context())).toEqual([]);
  });

  it("matches case-insensitively", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "Ferry Departure" })] };
    const results = searchContent("ferry departure", index, context());
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ entityId: "record_test", available: true });
  });

  it("matches with collapsed internal whitespace", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "X", exactTerms: ["multi   spaced  term"] })] };
    expect(searchContent("multi spaced term", index, context())).toHaveLength(1);
  });

  it("matches punctuation-insensitively", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "X", exactTerms: ["ferry-departure"] })] };
    expect(searchContent("ferry departure", index, context())).toHaveLength(1);
  });

  it("does not fold diacritics", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "X", exactTerms: ["café"] })] };
    expect(searchContent("cafe", index, context())).toEqual([]);
    expect(searchContent("café", index, context())).toHaveLength(1);
  });
});

describe("searchContent exact matching", () => {
  it("matches on title (exact_title)", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "Ferry Departure" })] };
    const [result] = searchContent("ferry departure", index, context());
    expect(result).toMatchObject({ entityId: "record_test", available: true, title: "Ferry Departure", matchedTerm: "ferry departure" });
  });

  it("matches on exactTerms", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "X", exactTerms: ["ferry departure"] })] };
    const [result] = searchContent("ferry departure", index, context());
    expect(result).toMatchObject({ entityId: "record_test", available: true, matchedTerm: "ferry departure" });
  });

  it("matches on aliases", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "X", aliases: ["maya"] })] };
    const [result] = searchContent("MAYA", index, context());
    expect(result).toMatchObject({ entityId: "record_test", available: true, matchedTerm: "maya" });
  });

  it("returns [] on no match", () => {
    const index = { searchableIndex: [entry({ entityId: "record_test", title: "Ferry" })] };
    expect(searchContent("terminal", index, context())).toEqual([]);
  });
});

describe("searchContent partial matching (query contained in authored partialTerm)", () => {
  const index = () => ({
    searchableIndex: [entry({ entityId: "record_test", title: "X", partialTerms: ["ferry terminal"] })],
  });

  it('"ferry" -> match', () => {
    expect(searchContent("ferry", index(), context())).toHaveLength(1);
  });

  it('"terminal" -> match', () => {
    expect(searchContent("terminal", index(), context())).toHaveLength(1);
  });

  it('"ferry terminal" -> match', () => {
    expect(searchContent("ferry terminal", index(), context())).toHaveLength(1);
  });

  it('"ferry terminal north" -> NO match', () => {
    expect(searchContent("ferry terminal north", index(), context())).toEqual([]);
  });
});

describe("tier precedence", () => {
  it("exact_title beats exact_term", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "a", title: "target", exactTerms: ["target"] }),
        entry({ entityId: "b", title: "other", exactTerms: ["target"] }),
      ],
    };
    const results = searchContent("target", index, context());
    expect(results.map((r) => r.entityId)).toEqual(["a", "b"]);
    expect(results[0]).toMatchObject({ available: true, matchedTerm: "target" });
  });

  it("exact_term beats alias", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "a", title: "x", exactTerms: ["target"] }),
        entry({ entityId: "b", title: "y", aliases: ["target"] }),
      ],
    };
    const results = searchContent("target", index, context());
    expect(results.map((r) => r.entityId)).toEqual(["a", "b"]);
  });

  it("alias beats partial", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "a", title: "x", aliases: ["target"] }),
        entry({ entityId: "b", title: "y", partialTerms: ["target zone"] }),
      ],
    };
    const results = searchContent("target", index, context());
    expect(results.map((r) => r.entityId)).toEqual(["a", "b"]);
  });
});

describe("one candidate per entry", () => {
  it("title + exact term yields exactly one result with exact_title", () => {
    const index = {
      searchableIndex: [entry({ entityId: "a", title: "target", exactTerms: ["target"] })],
    };
    const results = searchContent("target", index, context());
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ entityId: "a", matchedTerm: "target" });
  });

  it("exact term + alias yields exactly one result with exact_term", () => {
    const index = {
      searchableIndex: [entry({ entityId: "a", title: "x", exactTerms: ["target"], aliases: ["target"] })],
    };
    const results = searchContent("target", index, context());
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ entityId: "a", matchedTerm: "target" });
  });

  it("alias + partial yields exactly one result with alias", () => {
    const index = {
      searchableIndex: [entry({ entityId: "a", title: "x", aliases: ["target"], partialTerms: ["target zone"] })],
    };
    const results = searchContent("target", index, context());
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ entityId: "a", matchedTerm: "target" });
  });

  it("multiple matching terms in one tier: first authored term wins", () => {
    const index = {
      searchableIndex: [entry({ entityId: "a", title: "x", exactTerms: ["first term", "second term"] })],
    };
    const [result] = searchContent("second term", index, context());
    expect(result).toMatchObject({ entityId: "a", matchedTerm: "second term" });
  });
});

describe("ranking", () => {
  it("authoredRank descending within a tier", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "low", title: "x", exactTerms: ["target"], authoredRank: 1 }),
        entry({ entityId: "high", title: "y", exactTerms: ["target"], authoredRank: 9 }),
      ],
    };
    const results = searchContent("target", index, context());
    expect(results.map((r) => r.entityId)).toEqual(["high", "low"]);
  });

  it("declaration order is the final tie-break", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "first", title: "x", exactTerms: ["target"], authoredRank: 5 }),
        entry({ entityId: "second", title: "y", exactTerms: ["target"], authoredRank: 5 }),
      ],
    };
    const results = searchContent("target", index, context());
    expect(results.map((r) => r.entityId)).toEqual(["first", "second"]);
  });

  it("no entity-type weighting", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "char_x", entityType: "character", title: "t", exactTerms: ["target"], authoredRank: 1 }),
        entry({ entityId: "rec_x", entityType: "record", title: "t", exactTerms: ["target"], authoredRank: 1 }),
      ],
    };
    const results = searchContent("target", index, context());
    expect(results.map((r) => r.entityId)).toEqual(["char_x", "rec_x"]);
  });
});

describe("gates and unavailableBehavior", () => {
  const gated = (behavior: SearchIndexEntry["unavailableBehavior"]) =>
    entry({
      entityId: "a",
      title: "target",
      exactTerms: ["target"],
      unavailableBehavior: behavior,
      availabilityRule: { flagEquals: { key: "unlocked", value: true } },
    });

  it("available rule true -> available result", () => {
    const index = { searchableIndex: [gated("hidden")] };
    const ctx = context({ flags: { unlocked: true } });
    expect(searchContent("target", index, ctx)).toHaveLength(1);
    expect(searchContent("target", index, ctx)[0]).toMatchObject({ available: true });
  });

  it("hidden + rule false -> excluded", () => {
    const index = { searchableIndex: [gated("hidden")] };
    expect(searchContent("target", index, context())).toEqual([]);
  });

  it("classified_placeholder + rule false -> sanitized available:false result", () => {
    const index = { searchableIndex: [gated("classified_placeholder")] };
    const [result] = searchContent("target", index, context());
    expect(result).toEqual({ entityId: "a", entityType: "record", available: false });
  });

  it("classified result exposes no authored metadata", () => {
    const index = { searchableIndex: [gated("classified_placeholder")] };
    const result = searchContent("target", index, context())[0]!;
    expect(Object.keys(result).sort()).toEqual(["available", "entityId", "entityType"]);
  });

  it("placeholder retains its normal ranked position", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "open", title: "z", exactTerms: ["target"], authoredRank: 1 }),
        entry({
          entityId: "secret",
          title: "a",
          exactTerms: ["target"],
          authoredRank: 9,
          unavailableBehavior: "classified_placeholder",
          availabilityRule: { flagEquals: { key: "unlocked", value: true } },
        }),
      ],
    };
    const results = searchContent("target", index, context());
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ entityId: "secret", available: false });
    expect(results[1]).toMatchObject({ entityId: "open", available: true });
  });

  it("uses the real BBX-021 evaluateRule for gates", () => {
    const index = { searchableIndex: [gated("hidden")] };
    expect(searchContent("target", index, context({ flags: { unlocked: true } }))).toHaveLength(1);
    expect(searchContent("target", index, context({ flags: { unlocked: false } }))).toEqual([]);
  });
});

describe("collisions and duplicates", () => {
  it("duplicate terms inside one entry do not duplicate results", () => {
    const index = {
      searchableIndex: [entry({ entityId: "a", title: "x", exactTerms: ["target", "target"] })],
    };
    expect(searchContent("target", index, context())).toHaveLength(1);
  });

  it("same term across entries returns multiple ranked results", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "a", title: "x", exactTerms: ["target"], authoredRank: 2 }),
        entry({ entityId: "b", title: "y", exactTerms: ["target"], authoredRank: 1 }),
      ],
    };
    const results = searchContent("target", index, context());
    expect(results.map((r) => r.entityId)).toEqual(["a", "b"]);
  });
});

describe("organization and location entries", () => {
  it("returns org/location results by authored id without dereferencing", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "org_nta", entityType: "organization", title: "Nusakara Transit Authority" }),
        entry({ entityId: "loc_ferry", entityType: "location", title: "Ferry Terminal" }),
      ],
    };
    const results = searchContent("nusakara transit authority", index, context());
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ entityId: "org_nta", entityType: "organization", available: true });
    const terminal = searchContent("ferry terminal", index, context());
    expect(terminal).toHaveLength(1);
    expect(terminal[0]).toMatchObject({ entityId: "loc_ferry", entityType: "location", available: true });
  });
});

describe("determinism and immutability", () => {
  it("same query + index + context returns identical results repeatedly", () => {
    const index = {
      searchableIndex: [
        entry({ entityId: "a", title: "x", exactTerms: ["target"], aliases: ["target"] }),
        entry({ entityId: "b", title: "target", partialTerms: ["target zone"] }),
      ],
    };
    const first = searchContent("target", index, context());
    for (let i = 0; i < 10; i++) {
      expect(searchContent("target", index, context())).toEqual(first);
    }
  });

  it("does not mutate the searchableIndex or gate context", () => {
    const index = {
      searchableIndex: [entry({ entityId: "a", title: "Target", exactTerms: ["target"] })],
    };
    const gateContext = context({
      flags: { unlocked: true },
      events: [{ type: "record_opened" }],
    });
    const beforeIndex = JSON.stringify(index);
    const beforeContext = JSON.stringify({ flags: gateContext.flags, events: gateContext.events });
    searchContent("target", index, gateContext);
    expect(JSON.stringify(index)).toBe(beforeIndex);
    expect(JSON.stringify({ flags: gateContext.flags, events: gateContext.events })).toBe(beforeContext);
  });

  it("does not mutate the membership Sets (snapshot + size comparison)", () => {
    const discovered = new Set(["ev_1"]);
    const completed = new Set(["obj_1"]);
    const choices = new Set(["choice_1"]);
    const snapshot = (set: ReadonlySet<string>) => ({ size: set.size, values: [...set].sort() });
    const before = [snapshot(discovered), snapshot(completed), snapshot(choices)];

    const index = {
      searchableIndex: [
        entry({
          entityId: "a",
          title: "target",
          availabilityRule: {
            all: [
              { entityDiscovered: "ev_1" },
              { objectiveCompleted: "obj_1" },
              { choiceSelected: "choice_1" },
            ],
          },
        }),
      ],
    };
    const results = searchContent("target", index, context({ discoveredEntities: discovered, completedObjectives: completed, selectedChoices: choices }));

    expect(results).toHaveLength(1);
    expect(snapshot(discovered)).toEqual(before[0]);
    expect(snapshot(completed)).toEqual(before[1]);
    expect(snapshot(choices)).toEqual(before[2]);
  });
});
