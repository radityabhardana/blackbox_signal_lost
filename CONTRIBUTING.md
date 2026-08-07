Contributing
Purpose
This project uses a documentation-first workflow to prevent disconnected AI-generated features. Contributions must preserve the game’s design pillars, deterministic case logic, accessibility, and local-first architecture.
Branching
Recommended branch names:
feat/BBX-123-evidence-board
fix/BBX-217-save-migration
docs/BBX-041-case-template
test/BBX-178-conclusion-flow

Before coding
·	Read AGENTS.md.
·	Confirm the backlog item and acceptance criteria.
·	Check docs/16_DECISION_LOG.md.
·	Inspect related implementation and tests.
·	Ask for clarification only when a missing decision would materially change the implementation.
Pull request requirements
Every pull request should include:
·	Problem statement
·	Implemented behavior
·	Screenshots or recordings for UI changes
·	Tests added or updated
·	Accessibility impact
·	Save-data impact
·	Performance impact
·	Known limitations
Content contribution rules
Case content must include:
·	A truth timeline
·	Player-visible timeline
·	Evidence dependency map
·	Required and optional evidence
·	Contradiction matrix
·	Outcome rules
·	Hint ladder
·	Content warnings where relevant
·	Validation report
Do not merge a case that cannot be solved without guessing.
Code review checklist
Architecture
·	Is business logic outside React components?
·	Is content validated?
·	Are module boundaries respected?
·	Is the implementation smaller than the problem requires, rather than larger?
UX
·	Are states obvious?
·	Is keyboard navigation supported?
·	Can the player recover from mistakes?
·	Does the feature preserve immersion without hiding essential information?
Narrative
·	Does new content fit the world and tone?
·	Does it contradict the master timeline?
·	Does the player earn the conclusion?
·	Are consequences communicated without an artificial morality meter?
Quality
·	Are errors handled?
·	Are tests meaningful?
·	Are loading, empty, and failure states covered?
·	Is documentation current?
Commit examples
feat: add evidence link validation
fix: preserve minimized window state after reload
test: cover incorrect suspect conclusion path
docs: document case event schema

Licensing and assets
Only add assets with recorded provenance and a compatible license. Every asset must be registered in docs/14_ASSET_MANIFEST.md or the future machine-readable asset manifest.
Do not copy interface layouts, logos, dialogue, characters, music, or artwork from reference games.
