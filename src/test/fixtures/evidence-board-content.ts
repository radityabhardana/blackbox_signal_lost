import { contentBundleSchema, validateContentBundle } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import bundleJson from "@/content/fixtures/bundles/valid/bundle_basic_valid.json";

export interface EvidenceBoardTestSession {
  readonly content: ContentBundle;
  readonly initialState: CaseEngineState;
}

export function createEvidenceBoardTestSession(): EvidenceBoardTestSession {
  const content = contentBundleSchema.parse({
    ...bundleJson,
    evidence: [...bundleJson.evidence, { ...bundleJson.evidence[0], id: "evidence_board_test_second", title: "Second board evidence" }],
    case: {
      ...bundleJson.case,
      triggers: [...bundleJson.case.triggers, {
        id: "trigger_evidence_board_test",
        once: true,
        priority: 1,
        rule: { eventOccurred: { type: "evidence_board_test_bootstrap" } },
        effects: [
          { type: "discover_evidence", evidenceId: "evidence_test" },
          { type: "discover_evidence", evidenceId: "evidence_board_test_second" },
        ],
      }],
    },
  });
  if (!validateContentBundle(content).success) throw new Error("evidence board fixture validation failed");
  return {
    content,
    initialState: stepCaseEngine(createInitialEngineState(), { kind: "game_event", event: { type: "evidence_board_test_bootstrap" } }, content).state,
  };
}
