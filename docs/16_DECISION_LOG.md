# Architecture and Product Decision Log

This log records durable decisions. New entries should use the same format.

---

## ADR-001 — Web-first desktop interface

**Status:** Accepted

**Decision:** Build the first release for desktop web browsers.

**Rationale:**

- The operating-system interface naturally fits the browser.
- Sharing a playable link reduces friction.
- The project can later become an installable PWA or packaged desktop app.

**Consequences:**

- Desktop layout receives priority.
- Browser storage, loading, and compatibility require dedicated testing.
- Mobile receives a limited layout notice during the vertical slice.

---

## ADR-002 — Next.js and React for the shell

**Status:** Accepted

**Decision:** Use Next.js App Router, React, and TypeScript for the application shell and diegetic apps.

**Rationale:**

- Strong fit for interface-heavy applications
- Clear routing and deployment
- Good support for accessible components
- Suitable for AI-assisted development when architecture is documented

**Consequences:**

- Domain logic must remain separate from components.
- Client components should be limited to interactive boundaries.
- Heavy game modules must be lazy-loaded.

---

## ADR-003 — Phaser only for continuous-rendering modules

**Status:** Accepted

**Decision:** Do not build the desktop in Phaser. Use Phaser only for modules that benefit from a game loop.

**Rationale:**

- React is better for mail, records, forms, windows, and accessibility.
- Phaser is better for animated maps and game-like puzzles.
- Limiting Phaser lowers bundle and lifecycle complexity.

---

## ADR-004 — Authored deterministic narrative

**Status:** Accepted

**Decision:** Use authored case data and deterministic rules. No runtime generative AI in the MVP.

**Rationale:**

- Detective solutions require consistency and testability.
- Authored evidence enables fairness.
- Runtime generation increases safety, cost, and continuity risks.

---

## ADR-005 — Local-first save

**Status:** Accepted

**Decision:** Guest play and IndexedDB saves come before accounts and cloud synchronization.

**Rationale:**

- Reduces entry friction
- Enables offline-friendly development
- Prevents backend work from delaying the core game
- Preserves player privacy

---

## ADR-006 — Structured conclusion report

**Status:** Accepted

**Decision:** Players submit claims plus supporting evidence and a disclosure choice.

**Rationale:**

- Prevents random suspect selection from feeling equivalent to deduction
- Makes reasoning visible
- Supports multiple outcome dimensions

---

## ADR-007 — Fictional coastal city

**Status:** Accepted

**Decision:** Set the game in fictional Nusakara, inspired by Southeast Asian coastal infrastructure without directly portraying a real government.

**Rationale:**

- Creates visual and thematic identity
- Supports monsoon, flood-control, transit, and civic-data stories
- Avoids dependence on generic cyberpunk aesthetics

---

## ADR-008 — No morality meter

**Status:** Accepted

**Decision:** Do not display good/evil, trust, or ideology scores.

**Rationale:**

- Ethical choices should be interpreted through consequences.
- Numeric morality reduces ambiguity.
- Character trust should be communicated through behavior.

---

## ADR-009 — React Flow behind project adapters

**Status:** Accepted

**Decision:** Use React Flow for the evidence-board canvas but expose project-specific node and edge abstractions.

**Rationale:**

- Provides mature interaction primitives
- Avoids rebuilding pan, zoom, drag, and connections
- Adapter boundary reduces dependency lock-in

---

## ADR-010 — Local authored search

**Status:** Accepted

**Decision:** Use deterministic keyword and alias search. No embeddings or external search service in the vertical slice.

**Rationale:**

- Predictable
- Testable
- Localizable
- Works offline
- Prevents accidental answer leakage

---

## ADR-011 — One complete case before expansion

**Status:** Accepted

**Decision:** Complete Case 001 before adding accounts, chapter systems, user-generated content, or a full city simulation.

**Rationale:**

- The main risk is whether investigation is enjoyable.
- Additional systems do not validate the core loop.
- Scope discipline is essential for a small team.

---

## ADR-012 — BBX-012 satisfied by BBX-011 Session 3

**Status:** Accepted

**Decision:** Close BBX-012 (taskbar and launcher keyboard/pointer support) as a documentation-only task. No new implementation is required because BBX-011 Session 3 already delivered the taskbar, launcher, accessible window switcher, and their keyboard/pointer behaviour.

**Context:** The BBX-012 backlog item requested "keyboard and pointer support" for the taskbar and launcher. The AI execution playbook assigned these components to Session 3 (BBX-011) to enable the open, minimize, restore, and reset Playwright flow. An audit of the BBX-011 implementation confirmed all BBX-012 acceptance criteria are satisfied.

**Rationale:**

- Avoids reimplementing functionality that already exists.
- The custom accessible window switcher satisfies the documented "Alt+Tab or custom accessible switcher" requirement without OS-reserved shortcuts.
- Keeps work focused on the vertical-slice critical path.

**Consequences:**

- Taskbar and launcher keyboard/pointer support are considered complete.
- The notification center and settings shortcut remain listed as taskbar contents in `docs/07_UI_UX_SPEC.md` but are NOT completed by this closure; they stay assigned to the notification center backlog item (BBX-043) and the Settings milestone.

---

## ADR-013 — BBX-024 static content validation boundary

**Status:** Accepted

**Decision:** BBX-024 validates static content integrity only: global duplicate IDs for documented readable IDs, resolution of VALIDATE-class references, caseId relationships, objective/hint ownership, per-objective hint presence, and the required audio-transcript invariant. The validator is error-only, deterministic, and purely static. It does not evaluate RuleExpressions, execute GameEffects, simulate triggers/events, or prove runtime reachability.

**Context:** docs/09 §16 and docs/13 §3 list automated checks, but several of them (unreachable required records, impossible objectives, trigger cycles, outcome conflicts, every-ending-reachable) require rule/event semantics that only exist at runtime. docs/13 §3 explicitly assigns event-path traversal to a development simulation script, and docs/12 maps it to BBX-105 / BBX-100 Session 10.

**Options considered:**

- Implement full event-path reachability in BBX-024 (rejected: requires a RuleExpression evaluator, which belongs to the engine, and no documented static roots exist for the objective/dialogue/ending graphs).
- Add a warning severity (rejected: docs describe a failing build, not warnings; nothing consumes warnings).

**Rationale:**

- Reference IDs cannot be resolved yet for several documented fields because their target collections are intentionally opaque or undefined (CaseStage, ClaimSlot, Ending content, Application, Notification, Organization, Location, Channel, AssetBundle). Those are deferred, not guessed.
- "Missing hints" is enforced as at-least-one-hint per objective because docs/09 §9 requires only a complete ladder "before release"; four-tier completeness is BBX-104/105 content work, not a schema invariant.
- The reachability term in the backlog is honored, not redefined: BBX-024 implements static reference resolvability/integrity; the docs explicitly name a separate simulation script for runtime reachability.

**Consequences:**

- BBX-024 additions are all static and pure; the validator returns sorted error-only issues.
- Runtime/event-path reachability remains BBX-021/022, BBX-105, and BBX-100 Session 10.
- Future target collections added by BBX-080/100 must each add their own reference checks.

---

## Proposed-decision template

```text
## ADR-XXX — Title

Status: Proposed | Accepted | Rejected | Superseded

Decision:

Context:

Options considered:

Rationale:

Consequences:

Supersedes:
```