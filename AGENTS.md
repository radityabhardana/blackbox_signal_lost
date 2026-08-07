# AGENTS.md

This file defines mandatory operating rules for AI coding agents working on **BLACKBOX: Signal Lost**.

## 1. Read before editing

Before implementing any task, read:

1. `README.md`
2. The task-relevant document under `docs/`
3. Existing files in the target module
4. Existing tests for that module
5. `docs/16_DECISION_LOG.md`

Do not infer architecture from filenames alone.

## 2. Required workflow

For every task:

1. Restate the goal in one sentence.
2. Identify affected files.
3. Identify risks and assumptions.
4. Implement the smallest coherent change.
5. Run relevant checks.
6. Report changed files, tests run, and unresolved issues.
7. Update documentation when behavior or architecture changes.

Do not begin a broad refactor unless the task explicitly requires it.

## 3. Scope discipline

- One task should have one primary outcome.
- Do not add unrelated features.
- Do not rename public APIs without updating every caller and test.
- Do not replace the selected stack merely because another library is familiar.
- Do not add dependencies without explaining why native or existing project capabilities are insufficient.
- Do not create backend features before the local-first vertical slice needs them.
- Do not implement multiplayer.
- Do not add runtime generative AI to story, dialogue, or conclusions.

## 4. TypeScript rules

- TypeScript strict mode is mandatory.
- `any` is prohibited except at a documented external boundary.
- Prefer discriminated unions for game events and state.
- Validate external and content data with Zod.
- Do not trust JSON imports without schema validation.
- Export explicit domain types from domain modules.
- UI component props must be typed.
- Functions that can fail must return typed results or throw domain-specific errors.

## 5. Architecture boundaries

Use the following dependency direction:

```text
UI components
    ↓
application services / hooks
    ↓
domain engines
    ↓
repositories and adapters
    ↓
browser storage or remote services
```

Rules:

- Domain engines must not import React.
- Content files must not contain executable code.
- UI components must not hardcode case logic.
- Storage adapters must not decide story progression.
- Case progression must be deterministic from content plus recorded player events.
- Phaser scenes may communicate through typed events, not direct mutation of React stores.
- Supabase code must remain behind repository interfaces.

## 6. State management

Separate state into:

- `uiState`: windows, focus, layout, preferences
- `sessionState`: current case, objectives, discovered evidence
- `contentState`: validated immutable case content
- `saveState`: versioned serializable snapshot
- `remoteState`: account and cloud synchronization

Do not put all state in one global store.

## 7. Content rules

- Dialogue, emails, evidence, objectives, and case outcomes belong in structured content files.
- Every content entity requires a stable ID.
- IDs are lowercase snake_case.
- Never reuse an ID for a different entity.
- All unlock rules must be explicit and testable.
- Every mandatory conclusion must be solvable using evidence available in the same case.
- Red herrings may mislead but must not contradict objective facts.
- No puzzle may require knowledge outside the game unless the information is also provided in-game.

## 8. UI rules

- The interface is diegetic but usability takes priority.
- Essential information must not rely on color alone.
- Animations must respect reduced-motion preferences.
- Glitch effects cannot cover readable text for longer than 300 ms.
- Every interactive control requires visible hover, focus, pressed, and disabled states.
- Every major action must be reachable by keyboard.
- Window positions must remain recoverable on viewport changes.
- Do not block game completion on audio perception.

## 9. Styling rules

- Use design tokens from the theme layer.
- Do not introduce arbitrary colors in components.
- Do not use inline styles except for dynamic geometry that cannot be represented by classes or variables.
- Keep z-index values in a centralized scale.
- Prefer composable primitives over one-off duplicated components.
- Do not copy the visual identity of reference games.

## 10. Performance rules

- Lazy-load Phaser, CCTV media, and heavy evidence assets.
- Do not preload an entire chapter.
- Avoid rerendering every desktop window when one window changes.
- Virtualize long lists when evidence or messages exceed practical limits.
- Clean up timers, subscriptions, audio instances, and scene listeners.
- Do not store binary assets inside save files.
- Keep save events debounced and transactional.

## 11. Testing requirements

A feature is incomplete until relevant tests exist.

Minimum expectations:

- Domain rule changes: unit tests
- Content schema changes: validation tests
- UI interaction changes: component tests
- Player-critical flow changes: Playwright test
- Save format changes: migration test
- Bug fixes: regression test whenever practical

Commands must finish without unresolved errors:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

During focused work, run the relevant subset. Before a milestone merge, run all checks.

## 12. Security rules

- Never expose service-role keys to the browser.
- Never commit secrets.
- Treat all remote data as untrusted.
- Sanitize user-created labels and notes.
- Do not render arbitrary HTML from case data.
- Use row-level security before enabling cloud saves.
- Do not collect personal information that the product does not require.
- Never create realistic hacking instructions; all security puzzles must remain fictional and abstract.

## 13. Git and change quality

- Keep commits focused.
- Use conventional commit prefixes where possible:
  - `feat:`
  - `fix:`
  - `refactor:`
  - `test:`
  - `docs:`
  - `chore:`
- Do not commit generated build output.
- Do not modify lockfiles unless dependencies changed.
- Do not silently delete unfinished content.
- Mark placeholders clearly with `TODO(BBX-###)`.

## 14. Definition of done

A task is done only when:

- Acceptance criteria pass.
- Relevant tests pass.
- Type checking passes.
- No new console errors appear.
- Keyboard behavior is considered.
- Save compatibility is considered.
- Documentation is updated where necessary.
- The agent reports any remaining risk honestly.

## 15. Agent response format

At the end of a task, report:

```text
Implemented:
- ...

Files changed:
- ...

Validation:
- ...

Known limitations:
- ...

Recommended next task:
- BBX-...
```

CONTRIBUTING.md

# Contributing

## Purpose

This project uses a documentation-first workflow to prevent disconnected AI-generated features. Contributions must preserve the game’s design pillars, deterministic case logic, accessibility, and local-first architecture.

## Branching

Recommended branch names:

```text
feat/BBX-123-evidence-board
fix/BBX-217-save-migration
docs/BBX-041-case-template
test/BBX-178-conclusion-flow
```

## Before coding

- Read `AGENTS.md`.
- Confirm the backlog item and acceptance criteria.
- Check `docs/16_DECISION_LOG.md`.
- Inspect related implementation and tests.
- Ask for clarification only when a missing decision would materially change the implementation.

## Pull request requirements

Every pull request should include:

- Problem statement
- Implemented behavior
- Screenshots or recordings for UI changes
- Tests added or updated
- Accessibility impact
- Save-data impact
- Performance impact
- Known limitations

## Content contribution rules

Case content must include:

- A truth timeline
- Player-visible timeline
- Evidence dependency map
- Required and optional evidence
- Contradiction matrix
- Outcome rules
- Hint ladder
- Content warnings where relevant
- Validation report

Do not merge a case that cannot be solved without guessing.

## Code review checklist

### Architecture

- Is business logic outside React components?
- Is content validated?
- Are module boundaries respected?
- Is the implementation smaller than the problem requires, rather than larger?

### UX

- Are states obvious?
- Is keyboard navigation supported?
- Can the player recover from mistakes?
- Does the feature preserve immersion without hiding essential information?

### Narrative

- Does new content fit the world and tone?
- Does it contradict the master timeline?
- Does the player earn the conclusion?
- Are consequences communicated without an artificial morality meter?

### Quality

- Are errors handled?
- Are tests meaningful?
- Are loading, empty, and failure states covered?
- Is documentation current?

## Commit examples

```text
feat: add evidence link validation
fix: preserve minimized window state after reload
test: cover incorrect suspect conclusion path
docs: document case event schema
```

## Licensing and assets

Only add assets with recorded provenance and a compatible license. Every asset must be registered in `docs/14_ASSET_MANIFEST.md` or the future machine-readable asset manifest.

Do not copy interface layouts, logos, dialogue, characters, music, or artwork from reference games.