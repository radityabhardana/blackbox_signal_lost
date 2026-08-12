# Session Handoff — BBX-024 Content Validator

**Task:** BBX-024 — static content-integrity validator layered above the BBX-020 structural schemas. Validates references and integrity relationships without duplicating structural validation.

## Validator architecture

```
BBX-020 schemas (src/content/schemas/**)                      — unchanged structural layer
      ↓  reuses element schemas (imports downward only)
contentBundleSchema + ContentBundle (src/content/validator/types.ts)
      ↓
validateContentBundle (src/content/validator/validate-bundle.ts)
      ↓
scripts/validate-content.ts  (Pass 2: fixtures/bundles/valid/**)
```

- `src/content/schemas/**` does **not** import from `src/content/validator/**`; dependency direction is strictly downward.
- `fixture-schemas.ts` was **not** modified; the BBX-020 structural fixture layer (Pass 1) is untouched.
- All validation is pure. Maps/Sets are created and discarded inside each `validateContentBundle` call; there is no module-level mutable state, no React/browser/persistence.

## Bundle shape

Schema-first: `contentBundleSchema` → `ContentBundle = z.infer<typeof contentBundleSchema>`. No handwritten interface.

```ts
contentBundleSchema = z.object({
  case: caseManifestSchema,
  characters, records, evidence, hints, dialogue, conclusions, assets,
})
```

Objectives, triggers, outcomes, and searchableIndex remain embedded in `CaseManifest` and are not duplicated at bundle root.

## Validated reference relationships

Every field below must resolve to an existing entity of the listed kind (else `reference_unresolved` or `reference_wrong_kind`):

- Record.caseId, Evidence.caseId, Conclusion.caseId, Asset.caseIds[] → CaseManifest.id (`case_reference_mismatch` when not equal)
- Record.evidenceId → Evidence
- Evidence.assetIds[], Character.portraitAssetId, DialogueNode.attachments[] → Asset
- Character.knownEvidenceIds[] → Evidence
- DialogueNode.speakerId → Character; DialogueNode.nextNodeId, DialogueChoice.nextNodeId → DialogueNode
- Hint.objectiveId → Objective; Objective.hintIds[] → Hint; Objective.nextObjectiveIds[] → Objective
- GameEffects: unlock_record→Record, queue_dialogue→DialogueNode, start/complete_objective→Objective, discover_evidence→Evidence, play_audio_cue→Asset, show_notification→Notification
- RuleExpression operands: objectiveCompleted→Objective, choiceSelected→DialogueChoice (recursed through all/any/not)
- SearchIndexEntry.entityId → Record or Character (only when entityType is record/character)

## Deferred reference relationships (not validated; target collections undefined or opaque)

- GameEffect unlock_application.applicationId (show_notification.notificationId stopped being deferred in ADR-024: it now validates against NotificationDefinition and is listed under VALIDATE-class references)
- RuleExpression entityDiscovered, eventOccurred.*, countAtLeast.eventType, set_flag key/value (runtime/engine domain)
- Evidence.relatedEntityIds[], Record.relatedEntityIds[], Character.organizationIds[], DialogueNode.channelId
- Evidence.reportClaimsSupported[] (claim slots opaque until BBX-080)
- Outcome.endingContentId, CaseManifest.entryStageId (CaseStage opaque), CaseManifest.assetBundleId

## Duplicate-ID policy

Global uniqueness across the whole bundle, per docs/09 §2 ("globally stable, never reused"). Registry members (only id-bearing, documented-readable objects):

- CaseManifest, Character, Record, Evidence, Objective, Trigger, Hint, DialogueNode, DialogueChoice, Outcome, Conclusion, Asset, Notification

Opaque subtypes are never inspected; naming prefixes are not enforced. Duplicates emit `duplicate_id`.

## Hint rules

- `objective_missing_hints` — objective.hintIds is empty.
- `objective_hint_unresolved` — objective references a missing hint, or a hint's objectiveId does not resolve to an objective.
- `objective_hint_mismatch` — objective A lists hint H but H.objectiveId ≠ A.id.
- Tier 1–4 completeness and ladder sequencing are NOT enforced (BBX-104/105 content work; docs/09 §9 says "complete ladder" is a release expectation, not a schema invariant).

## Transcript rule

- `asset_missing_transcript` — an asset of type `audio` has no `transcriptPath` (docs/13 §3; docs/09 §16 "required audio lacks a transcript").

## Deterministic error model

- Error-only (`ValidationIssue`), no warning severity.
- Issue shape: `{ code, entityType, entityId, path, referencedId?, reason }`.
- Codes used: `duplicate_id`, `reference_unresolved`, `reference_wrong_kind`, `case_reference_mismatch`, `objective_missing_hints`, `objective_hint_unresolved`, `objective_hint_mismatch`, `asset_missing_transcript`.
- Final issues sorted by `entityType → entityId → path → code` — stable for tests and debugging.

## Reference resolution vs reachability

- BBX-024 implements **static reference resolvability/integrity** only.
- No static graph reachability is sound at this layer: the docs provide no static roots for the objective/dialogue/ending graphs, and entry-stage IDs live inside the opaque CaseStage type. Adding roots or rule evaluation would invent engine semantics (recorded in ADR-013).
- Runtime/event-path reachability ("unreachable required records", "every ending reachable", objective completion simulation) remains **BBX-021/022, BBX-105, and BBX-100 Session 10**.

## validate:content integration

```
PASS 1 (unchanged): src/content/fixtures/valid/**  → resolveFixtureSchema → parseContent
PASS 2 (new):       src/content/fixtures/bundles/valid/** → contentBundleSchema → validateContentBundle
exit 0 ⇔ both passes clean
```

Invalid bundle fixtures are test-only inputs; they never fail the normal command.

## Fixture strategy

- `src/content/fixtures/bundles/valid/bundle_basic_valid.json` — one fully-connected fully valid neutral bundle (`case_test`, `character_test`, `record_test`, `evidence_test`, `objective_test(_final)`, `hint_test(_final)`, `dialogue_test(_next)`, `conclusion_test`, `asset_test(_audio)`), exercising every validated relationship and operator.
- `src/content/fixtures/bundles/invalid/*.json` — six focused bundles, each structurally valid but failing exactly one intended invariant: dangling reference, duplicate ID, wrong target kind, bad caseId, missing hints, missing audio transcript.

## Tests

`src/content/validator/validate-bundle.test.ts` (31 tests) covering: valid bundle success; duplicate within/a cross collection; unresolved reference; wrong-kind; caseId mismatch; objective missing hints; unresolved objective hint; ownership mismatches (both directions); audio transcript; multiple simultaneous issues; deterministic ordering; no input mutation; opaque subtypes ignored; deferred/not-content references ignored; all six invalid fixtures structurally valid + failing with the expected code; `pnpm validate:content` exits 0.

## Validation evidence

- `pnpm lint` PASS
- `pnpm typecheck` PASS
- `pnpm test` — 35 files / 268 tests PASS
- `pnpm validate:content` PASS — "all structural fixtures and content bundles conform."
- `pnpm test:e2e` PASS (4/4)
- `pnpm build` PASS

## Deferred to later tasks

- RuleExpression evaluation and runtime trigger/event semantics → BBX-021/022.
- Full reachability simulation and dead-end detection → BBX-105 / BBX-100 Session 10.
- Case 001 content → BBX-100.
- Save repository → BBX-030.
- ADR-013 records the validation boundary.

## Known limitations / remaining BBX-024 issues

- None within the documented static scope. All meaningful gaps are explicit DEFER cases owned by later milestones (CaseStage/ClaimSlot/Ending/Application/Organization/Location/Channel collections), not BBX-024 defects. Notification is no longer a deferred collection: ADR-024 defined NotificationDefinition and the validator resolves show_notification.notificationId.

**Next recommended task:** per scope rules, do not start BBX-021/030/100/105 in this session unless explicitly requested.