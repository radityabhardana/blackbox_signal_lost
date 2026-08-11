import { contentBundleSchema } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";

/**
 * Synthetic Records test content. Test-harness only: clones the neutral valid
 * canonical bundle and augments it with test-only records, search-index
 * entries, and a bootstrap trigger. The canonical fixture itself is never
 * modified — BBX-041 content lives here or nowhere. The bundle JSON is
 * imported statically because `__dirname` does not resolve under the Next.js
 * bundler.
 *
 * Availability is authoritative via the BBX-023 searchable index, evaluated
 * with the same rule context the engine uses:
 * - record_test: always available (canonical).
 * - record_second: available only after any record_opened event has been
 *   recorded by the engine (proves the Records app emits the domain event).
 * - record_classified_test: never released (records_release_authorized never
 *   fires) with unavailableBehavior "classified_placeholder" — surfaces as a
 *   sanitized generic row and must never be dereferenced.
 * - record_gated_test: never released with unavailableBehavior "hidden" —
 *   never surfaces at all.
 */
const bootstrapTrigger = {
  id: "trigger_records_test",
  once: true,
  priority: 1,
  rule: { eventOccurred: { type: "records_test_bootstrap" } },
  effects: [{ type: "unlock_record", recordId: "record_test" }],
};

const recordSecond = {
  id: "record_second",
  caseId: "case_test",
  recordType: "log",
  title: "Ferry transfer log",
  body: {},
  source: { organizationId: "org_ferry_services" },
  createdAt: "2041-11-18T23:10:00Z",
  relatedEntityIds: ["record_test"],
  searchTerms: ["ferry", "transfer"],
  aliases: [],
  availabilityRule: { always: true },
  metadata: { shift: "night" },
};

const recordClassified = {
  id: "record_classified_test",
  caseId: "case_test",
  recordType: "inspection",
  title: "Reactor core inspection",
  body: {},
  source: { system: "REACTOR_SCADA" },
  createdAt: "2041-11-18T19:00:00Z",
  relatedEntityIds: [],
  searchTerms: ["reactor", "core", "inspection"],
  aliases: [],
  availabilityRule: { always: true },
  metadata: { clearance: "zeta-9" },
};

const recordGated = {
  id: "record_gated_test",
  caseId: "case_test",
  recordType: "personnel",
  title: "Personnel file",
  body: {},
  source: { system: "HR_ARCHIVE" },
  createdAt: "2040-06-01T00:00:00Z",
  relatedEntityIds: [],
  searchTerms: ["personnel"],
  aliases: [],
  availabilityRule: { always: true },
  metadata: {},
};

const indexSecond = {
  entityId: "record_second",
  entityType: "record",
  title: "Ferry transfer log",
  exactTerms: [],
  aliases: [],
  partialTerms: ["ferry"],
  unavailableBehavior: "hidden",
  availabilityRule: { eventOccurred: { type: "record_opened" } },
  authoredRank: 3,
};

const indexClassified = {
  entityId: "record_classified_test",
  entityType: "record",
  title: "Reactor core inspection",
  exactTerms: [],
  aliases: [],
  partialTerms: ["reactor"],
  unavailableBehavior: "classified_placeholder",
  availabilityRule: { eventOccurred: { type: "records_release_authorized" } },
  authoredRank: 4,
};

const indexGated = {
  entityId: "record_gated_test",
  entityType: "record",
  title: "Personnel file",
  exactTerms: [],
  aliases: [],
  partialTerms: ["personnel"],
  unavailableBehavior: "hidden",
  availabilityRule: { eventOccurred: { type: "records_release_authorized" } },
  authoredRank: 5,
};

/**
 * The canonical valid bundle, cloned and augmented with the synthetic
 * BBX-041 Records content above. Re-validated end-to-end so the clone can
 * never leak an invalid bundle into the harness.
 */
export function loadRecordsTestBundle(): ContentBundle {
  const base = contentBundleSchema.parse(bundleJson);
  return contentBundleSchema.parse({
    ...base,
    records: [...base.records, recordSecond, recordClassified, recordGated],
    case: {
      ...base.case,
      triggers: [...base.case.triggers, bootstrapTrigger],
      searchableIndex: [...base.case.searchableIndex, indexSecond, indexClassified, indexGated],
    },
  });
}

export interface RecordsTestSessionFixture {
  readonly content: ContentBundle;
  readonly mailChannelId: "channel_test";
  readonly initialState: CaseEngineState;
}

export function createRecordsTestSession(): RecordsTestSessionFixture {
  const content = loadRecordsTestBundle();

  const afterBootstrap = stepCaseEngine(
    createInitialEngineState(),
    { kind: "game_event", event: { type: "records_test_bootstrap" } },
    content,
  );

  return {
    content,
    mailChannelId: "channel_test",
    initialState: afterBootstrap.state,
  };
}