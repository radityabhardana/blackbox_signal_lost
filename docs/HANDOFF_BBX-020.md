# Session Handoff — BBX-020 Zod Content Schemas

**Task:** BBX-020 — structural Zod schemas and inferred TypeScript types for the content contract in `docs/09_DATA_AND_CONTENT_SCHEMA.md`, proven with valid/invalid fixtures, plus a real `pnpm validate:content` command.

**Completed:**

- `src/content/schemas/ids.ts` — `idSchema` (lowercase snake_case: `^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$`); ID *shape* only, no uniqueness/existence checks (those belong to BBX-024).
- `src/content/schemas/opaque.ts` — isolated opaque schema boundaries for subtypes docs/09 names but never defines internally: `richTextDocumentSchema`, `caseStageSchema`, `entityReferenceSchema`, `claimSlotDefinitionSchema`, `disclosureChoiceDefinitionSchema`, plus `save.ts` payload boundaries `sessionSnapshotSchema`, `uiSnapshotSchema`, `playerSettingsSchema`, `gameEventSchema`. Each placeholder carries a comment naming its owning future task; none invent undocumented structure (no invented rich-text AST, no GameEvent union, no PlayerSettings fields).
- `src/content/schemas/sources.ts` — `sourceDescriptorSchema` and re-export of the opaque rich-text boundary. `catchall` is used here only because docs/09 does not enumerate SourceDescriptor's full field list; the accessing character production shape remains strict.
- Documented entities from docs/09 §3–§14, all schema-first with `z.infer` types: `records.ts` (RecordDefinition with **required** `availabilityRule`), `characters.ts` (authoring + production variants: `productionCharacterDefinitionSchema` = authoring schema with `privateAuthorNotes` omitted — a clean character **passes**, a character carrying the field **fails** via the closed `.strict()` shape, i.e. rejected not stripped), `evidence.ts` (EvidenceDefinition + 9 documented EvidenceType values), `objectives.ts`, `hints.ts` (tiers 1–4), `triggers.ts`, `rule-expression.ts` (recursive closed operator set, exactly one operator per node; the public `RuleExpression` type is `z.infer` of the schema — only a private annotation satisfies TS recursion), `game-effect.ts` (all 9 documented effect variants with exact documented field names, every variant `.strict()`), `dialogue.ts` (DialogueNode/DialogueChoice), `search-index.ts`, `conclusion.ts`, `outcomes.ts`, `case.ts` (CaseManifest with opaque CaseStage/EntityReference arrays), `save.ts` (structural SaveGame only).
- Version fields validated as documented plain strings (`version`, `contentVersion`, `applicationVersion`); `saveSchemaVersion` as integer. No semver/ISO regexes, no `CURRENT_CONTENT_VERSION`, no compatibility or migration logic.
- `src/content/schemas/parse.ts` — `parseContent(schema, raw, { entityType, entityId })`: formats Zod structural issues into `{ entityType, entityId, code, path, reason }`. Schema-level formatting only; no references, registries, reachability, or graph validation.
- `src/content/schemas/fixture-schemas.ts` — directory→schema map shared by tests and the CLI; `index.ts` barrel re-exports everything.
- Fixtures (static JSON, neutral synthetic IDs such as `case_test`/`record_test`): `src/content/fixtures/valid/**` (19 files incl. six rule-expression variants and a clean production character) and `src/content/fixtures/invalid/**` (5 focused failures: missing field, bad ID, invalid enum, unexpected key, unknown rule operator).
- `scripts/validate-content.ts` — real structural validation: reads only `fixtures/valid/**`, parses each against its schema, reports file/path/reason on failure, exits 0 on success. Invalid fixtures are exercised by Vitest, never by this command.

**Fixtures:** 19 valid + 5 invalid; `src/content/cases/case_001_missing_signal/` remains scaffold-only (no narrative content).

**validate:content:** `pnpm validate:content` → exits 0 (`all 19 valid fixtures conform`), non-zero with per-file issue lines if any valid fixture breaks.

**Tests:** 34 test files / 244 tests — per-schema structural tests (IDs, rule operators + recursion + nested-operator strictness, all effect variants incl. unknown-key rejection, evidence enums, character production clean/reject behavior, required record availabilityRule, objective/hint/trigger/dialogue/search/conclusion/outcome/case/save shapes) plus `fixtures.test.ts` (every valid fixture parses, every invalid fixture fails) and `parse.test.ts`.

**Validation:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (244/244), `pnpm validate:content`, `pnpm build`, `pnpm test:e2e` (4/4) — all green. No new dependencies (Zod 3.25 already present); no changes to BBX-010/011/013, stores, hooks, persistence, or UI.

**Decisions:**

- Schema-first pattern only: public types are `z.infer` of the schemas; the only handwritten type is `RuleExpressionShape`, an implementation-local annotation required for recursive `z.lazy` self-typing, and the exported `RuleExpression` type is still inferred from the schema.
- `.strict()` on every closed object documented in docs/09 (entities, rule-expression nodes, nested operator objects, GameEffect variants); `catchall(z.unknown())` only where docs leave the shape open (SourceDescriptor, opaque placeholders).
- Rule expressions enforce exactly one operator per node (matches the documented "closed operator set" intent; an empty or multi-operator node is a structural error).
- `RecordDefinition.availabilityRule` is required per docs/09 §6.
- Duplicate-ID/reference/rule-existence validation deliberately absent — the schemas assert structure only.

**BBX-024 deferred:** dangling references, cross-collection/global duplicate IDs, reachability, objective/dialogue/trigger graph traversal, trigger cycles, referenced-entity existence, global deterministic lookup maps, case-wide graph integrity.

**BBX-100 deferred:** all Case 001 content (records, evidence, objectives, triggers, dialogue, conclusions, outcomes, search index, narrative facts). No Maya/Sera/Reno content is encoded anywhere.

**SaveGame / BBX-030 boundary:** structural schema only — no IndexedDB/Dexie, no checksum computation, no migrations, no save repository, no persistence behavior; `gameEvents`, `sessionSnapshot`, `uiSnapshot`, `settings` remain opaque until BBX-030 defines them.

**Known limitations:**

- `docs/03` (GDD) lists 10 evidence kinds while `docs/09` §4 defines 9 (`video loop`/`physical-object report` differ in wording). Schemas implement docs/09 exactly; wording reconciliation is a documentation task, not a schema blocker.
- RichText/GameEvent/Snapshot internals intentionally opaque until their owning tasks; fixtures carry `{}` placeholders for those fields.
- Not committed (per instruction).

**Next recommended task:** BBX-024 — content validator (references and reachability) on top of these schemas, or BBX-030 if persistence sequencing matters more.
