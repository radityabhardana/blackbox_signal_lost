# Session Handoff — BBX-042 Messenger

**Task:** BBX-042 — Messenger vertical slice (P1): single-thread messenger thread rendering authored `DialogueNode` content from the session's channel, authored choice buttons, and `dialogue_choice_selected` as the only emitted engine input. Reuses the BBX-022 transport (ADR-021 pattern); no engine/schema/rules/validator changes.

## Content model

- **No new Messenger schema.** Messenger = existing `DialogueNode` (docs/09 §7) projected from the authoritative `CaseEngineState.queuedDialogue`, filtered by the session's `messengerChannelId`.
- **Channel is optional.** `CaseSessionConfig.messengerChannelId?: string`. Undefined ⇒ honest "No messages" empty state — never a crash, never a fallback channel (tested because Messenger is reachable from the mail/records harnesses).
- **enterRule is never read.** `DialogueNode.enterRule` has no runtime owner: BBX-024 reference-validates it, BBX-022 never evaluates it, Messenger does not assume ownership (see ADR-023). Authored gating is exclusive to triggers.
- `nextNodeId` unconsumed (ADR-021); duplicates preserved in queue order; unresolvable queued ids skipped defensively; sender fallback "Unknown sender".

## Choices and re-click safety

- Choice buttons render authored `DialogueChoice` labels, one `<button>` each.
- Disabled state derives **only** from `session.state.selectedChoices.includes(choiceId)` — engine-authoritative, zero local `useState`.
- BBX-022 re-applies choice consequences on every `dialogue_choice_selected` input, so a re-click would duplicate `queue_dialogue`; the disabled button makes a second emission structurally impossible. Regression tests prove exactly one consequence application.
- `{ kind: "dialogue_choice_selected", choiceId }` is the **only** `EngineInput` Messenger emits. No `evidence_discovered`, no `record_opened`, no search events.

## Window integration

`app_messenger` already existed in `APP_CATALOG` (launcher/taskbar, `src/lib/apps.ts`); `WindowContent` now routes it to `MessengerApp`. Messages render in queue order with occurrence-safe React keys (`nodeId-${occurrence}`).

## Fixtures

- `bundle_basic_valid.json` receives **zero new modifications** (it was previously modified by BBX-040, commit `9409af7` — `trigger_mail_test`). BBX-042 synthetic content lives only in the cloned test bundle.
- `src/test/fixtures/messenger-content.ts`: clones the canonical bundle (JSON round-trip), augments with:
  - `trigger_messenger_test` — `eventOccurred { type: "messenger_test_bootstrap" }` → `queue_dialogue dialogue_messenger_greeting` (once, priority 1).
  - `dialogue_messenger_greeting` (channel `channel_messenger`, speaker `character_test`) with authored choice `choice_messenger_confirm` ("Acknowledge — continue", consequence `queue_dialogue dialogue_messenger_reply`).
  - `dialogue_messenger_reply` (channel `channel_messenger`).
  - Re-validated through `contentBundleSchema` and booted through the **real engine** with input `{ kind: "game_event", event: { type: "messenger_test_bootstrap" } }`. `queuedDialogue` is engine-written only; never mutated directly.

## Tests

- `messenger-content.test.ts` (5): schema parse; `validateContentBundle` passes; exact bootstrap queue `["dialogue_messenger_greeting"]`; choice confirm queues the reply once via the engine; messenger projection never renders a `channel_test` message even when `dialogue_test` is on the queue.
- `messenger-model.test.ts` (7): queue order, channel filtering, unresolvable-id skip, duplicates preserved, empty (no rows), empty (undefined channel), sender fallback.
- `messenger-app.test.tsx` (7): no-session empty state; greeting render; undefined-channel empty state; single `dialogue_choice_selected` + queue `[greeting, reply]`; re-click safety (disabled button, no duplicate consequence); keyboard Enter activation; duplicate-node occurrence keys without React key warnings.
- `case-session.test.tsx` (+2): `messengerChannelId` undefined when omitted; carried through when configured.
- E2E `e2e/messenger.spec.ts` (2): full thread flow (open → choose → reply + disabled, zero page errors); undefined channel via the mail harness renders "No messages" without crashing. Harness route `src/app/test/messenger/page.tsx` mirrors `/test/mail` (PLAYWRIGHT_TEST=1 gate, h-dvh shell).

## ADR / docs

- ADR-023 added to `docs/16_DECISION_LOG.md`: transport reuse, optional channel semantics, engine-derived disabled state, **enterRule no-runtime-owner gap** (BBX-024 validates references only; BBX-022 and Messenger never evaluate it; ownership deferred), zero canonical-bundle modifications, consequences-before-triggers ordering fact, nextNodeId unconsumed.

## Boundaries / deferred

- No engine/schema/rules/validator changes; no persistence or save-format changes; no read/unread; no search; no attachments rendering (presentation-only position recorded in ADR-023); no Notification Center / Evidence Board; no Mail/Records refactor; no production Case-001 messenger content; no window-dimension or launcher changes.
- `enterRule` runtime ownership, messenger persistence/hydration, multi-channel threads, and attachment presentation belong to later milestones.

## Known limitations

- The messenger thread is ephemeral: it projects live from engine state and is not persisted until the persistence milestone lands.
- `dialogue_messenger(...)` nodes authored for Case-001 will appear in Messenger once Case-001 content (BBX-100) and its messenger channel exist; none is added here.