# Session Handoff — BBX-023 Search Index

**Task:** BBX-023 — deterministic authored search over the validated `CaseManifest.searchableIndex`. Domain search only: pure, no UI/persistence/engine mutation.

## Public API

```ts
searchContent(
  query: string,
  content: Pick<CaseManifest, "searchableIndex">,
  gateContext: RuleEvaluationContext,
): SearchResult[]
```

- `content` shape is derived from the existing BBX-020 `CaseManifest` (`searchableIndex`, never duplicated or renamed).
- `gateContext` is the BBX-021 `RuleEvaluationContext` reused directly — no `SearchGateContext`. Gates are evaluated via `evaluateRule(entry.availabilityRule, gateContext)`.
- Dependency direction: `content schemas → domain/rules → domain/search`. `domain/rules` and `content/schemas` are unchanged.

## Result model (discriminated, leak-free)

```ts
type SearchResult =
  | { entityId; entityType; available: true; title: string; matchedTerm: string }
  | { entityId; entityType; available: false };
```

Classified placeholders expose only `entityId`, `entityType`, `available:false` — never title, matchedTerm, authoredRank, terms, tier, or index. Internal candidates (`SearchCandidate`) carry tier/rank/declaration index/matched term for sorting only and are never exported.

## Normalization

One deterministic function (`normalizeTerm`), applied to query and every authored term:

`trim → toLowerCase() (not toLocaleLowerCase) → replace /[^\p{L}\p{N}]+/gu runs with a single space → collapse whitespace → trim`

No diacritic folding, no stemming, no fuzzy normalization.

## Matching

- Tiers: `exact_title` (normalized title === query) > `exact_term` (first exactTerms match) > `alias` (first aliases match) > `partial` (query contained within normalized partialTerm).
- One candidate per entry; strongest tier wins; first authored term wins within a tier.
- Partial direction: `normalizeTerm(partialTerm).includes(normalizeTerm(query))` (e.g., authored `"ferry terminal"` matches `"ferry"`, `"terminal"`, `"ferry terminal"`, but not `"ferry terminal north"`).
- `matchedTerm` on available results is the normalized authored winning value (never the raw query).

## Ranking & gating

- Rank by tier, then `authoredRank` descending, then declaration order. No entity-type bias, no invented relevance.
- Gate via BBX-021 `evaluateRule`: rule true → available result; `hidden` false → removed; `classified_placeholder` false → keeps its sorted position but returns only `{ entityId, entityType, available: false }`.
- Organization/location entries returned by authored id without dereferencing entity content; their unresolved targets remain BBX-024's deferral, not an error.

## Behavior

- Total: empty/whitespace query → `[]`; no match → `[]`; hidden → omitted; classified → sanitized. Term collisions are allowed (no error), and multiple entries may share the same authored term.

## Tests

39 tests in `search-content.test.ts`: normalization (empty/whitespace/case/collapse/punctuation/Unicode/no-diacritic-fold), exact title/term/alias, partial asymmetry set, tier precedence, one-candidate-per-entry (title+term, term+alias, alias+partial, multiple-in-tier), authoredRank-desc + declaration ties, no entity-type bias, gates (available/hidden/classified/leak-free/position), real BBX-021 gate integration, collisions, org/location no-dereference, determinism (10×), and immutability (index/context snapshot + Set snapshot-and-size).

## Validation evidence

- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` 38 files / 383 tests PASS · `pnpm validate:content` PASS · `pnpm test:e2e` 4/4 PASS · `pnpm build` PASS.
- No new dependencies; `src/content/**`, `src/domain/rules/**`, `src/domain/engine/**`, `scripts/validate-content.ts` unchanged.

## Deferred

Records/Mail/search UI, keyboard nav, highlighting, pagination, suggestion/correction (BBX-101), search-event emission, BBX-030 persistence, BBX-100 Case 001 content, BBX-105 reachability, fuzzy/AI search.

**Known limitations / remaining BBX-023 issues:** none within documented scope; conventions recorded in ADR-016.
