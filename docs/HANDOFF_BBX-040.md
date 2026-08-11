# Session Handoff — BBX-040 Secure Mail

**Task:** BBX-040 — Secure Mail vertical slice (P1): authored fixture content rendered via DialogueNode, inbox from the BBX-022 engine queue, attachments with evidence events through the case session.

## Content model

- **No new Mail schema.** Mailbox = existing `DialogueNode` behind a configurable `mailChannelId` (ADR-021).
- Sender = `Character.displayName` (via `speakerId`); body = `DialogueNode.text`; time = `sentAtNarrativeTime` only when authored.
- Deferred mailbox metadata: subject, caseLabel, trust classification (documented content-model gap).

## Inbox

- Rows derive strictly from `CaseEngineState.queuedDialogue`, filtered by channel, preserving **queue order** exactly (no sorting; duplicates kept; unresolvable ids skipped).
- Sender/body/time fallback: "Unknown sender" when Character unresolved; time null when unauthored. Empty queue -> "No messages".

## Case session (new)

- `src/features/session/case-session.tsx`: `CaseSessionProvider(content, mailChannelId, initialState?)`; hooks `useCaseSession()` (throws) and `useOptionalCaseSession()` (null outside a provider).
- Engine state lives in a closure-held authoritative mirror initialized inside a `useState` initializer (satisfies `react-hooks/refs`: no render-phase ref reads). `dispatch(input)` and `dispatchTransaction(plan)` fold inputs sequentially through `stepCaseEngine`, plan against the authoritative mirror (never stale render state), commit once; empty plans produce no transition. Rapid repeat activation cannot create duplicate `evidence_discovered` events.
- The consumed `CaseSession` object is **recreated per committed state** so React context consumers re-render (mutating a stable object in place does not notify consumers — the root-cause fix for invisible evidence discovery), while `dispatch`/`dispatchTransaction` stay referentially stable.
- Production `/game` mounts no provider (BBX-100 deferred) -> MailApp renders the legitimate empty state. No fake content/bundle/engine state.

## Attachments / evidence

- Relation used: `Evidence.assetIds` contains `asset.id` (declaration order). 0 matches -> plain attachment (no engine input); 1 -> evidence-bearing; >1 -> all matching evidence processed sequentially, re-reading `discoveredEntityIds` from the returned engine state between inputs.
- Activation: `dispatchTransaction` planning only missing evidence ids; "Evidence discovered" shown iff every linked id is in `session.state.discoveredEntityIds`.
- Presentation uses only real Asset fields: `altText ?? "<Type> attachment <n>"`; type label; `transcriptPath` presence -> "Transcript available" (never rendered as transcript text); no fetching; no `dangerouslySetInnerHTML`.
- Replies: authored `DialogueChoice` label buttons dispatch `dialogue_choice_selected` only. `nextNodeId` is not consumed by Mail/engine independently.

## Read state

- Component-local React state `selectedMessageId` + `readMessageIds`; selecting marks read while mounted; resets on unmount; not persisted.

## Fixtures / E2E

- Synthetic bundle edit: `trigger_mail_test` (rule `eventOccurred: mail_test_bootstrap`, once, effects: only `queue_dialogue: dialogue_test`) and `attachments: [asset_test, asset_test_audio]` on `dialogue_test`. Bootstrap input `{ kind: "game_event", event: { type: "mail_test_bootstrap" } }` -> `queuedDialogue=[dialogue_test]`, evidence remains undiscovered.
- `src/test/fixtures/mail-content.ts` (test-harness-only) parses the bundle via `contentBundleSchema` and exports `createMailTestSession()` -> `{ content, mailChannelId: "channel_test", initialState }`. The bundle JSON is imported statically (not via `__dirname`/fs) because the Next.js server bundler resolves `__dirname` to `/ROOT` — this was a real e2e bug.
- Harness route `src/app/test/mail/page.tsx` (force-dynamic): wraps the real desktop/Workspace shell/launcher/taskbar in a `h-dvh` container (mirrors `/game` layout — omitted, the launcher menu rendered outside the viewport) inside `CaseSessionProvider`, passing `initialState`; renders `notFound()` unless `PLAYWRIGHT_TEST=1`. Production `/game` never imports test fixtures.
- `playwright.config.ts` webServer command: `env PLAYWRIGHT_TEST=1 sh -c 'pnpm build && pnpm start'`.
- `e2e/mail.spec.ts`: launch harness -> launcher -> Mail -> open queued message -> click evidence attachment -> assert visible "Evidence discovered"; asserts zero page errors. E2E never inspects window-store/data-*/React internals.

## Window integration

`WindowContent` routes `app_mail` -> `MailApp`; window-manager behavior unchanged.

## Tests

- `mail-model.test.ts` (15): queue/inbox/filter/order/sender/time/attachment/evidence 0-1-many/status, plus declaration-order reverse-lookup for >1 evidence sharing one asset.
- `case-session.test.tsx` (5): dispatch, ref-authoritative duplicate suppression (exactly one event), empty plan no-op, no auto-dispatch, sequential fold.
- `mail-app.test.tsx` (12): empty state, rows, read state, detail incl. attachments + replies, single evidence activation, plain-attachment no-op, reply dispatch, accessible labels, duplicate-queued-node regression (no React key warning), and multi-evidence attachment coverage (zero/partial/all-discovered activation through the authoritative `dispatchTransaction` path).
- `mail-content.test.ts` (3): schema parse, fixture structure, bootstrap queue/no-discovery.
- E2E `mail.spec.ts` (1): full browser path incl. evidence discovery.

## Validation evidence (final, after fixes)

- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` 47 files / 501 PASS · `pnpm validate:content` PASS · `pnpm test:e2e` 5/5 PASS · `pnpm build` PASS.

## Post-handoff fixes (E2E hardening)

1. **Context propagation bug (root cause of "Evidence discovered" never appearing).** The provider originally mutated a stable context value object in place; React skips consumer re-renders when the context value identity is unchanged. Fixed with a fresh session object per committed state + closure-held authoritative mirror.
2. **Harness structure.** Missing `h-dvh` wrapper (launcher menu off-viewport) and missing `initialState` (empty inbox) in `/test/mail`.
3. **Fixture loading.** `__dirname` resolved to `/ROOT` in the bundled Next.js server; switched to static JSON import + zod.
4. **Stale test expectations** in `case-session.test.tsx` aligned to deterministic semantics (boot event present in initial state; duplicates record exactly one event).
5. **Duplicate React keys on requeue.** BBX-022 allows the same DialogueNode to occupy `queuedDialogue` more than once; `inbox-list.tsx` keyed `<li>` by `nodeId` alone, producing a duplicate-key console warning via the fixture's reply requeue. Fixed with an occurrence-safe composite key (`${row.nodeId}:${index}`); queued order and queue semantics are unchanged. Regression test added.
6. **Multi-evidence coverage.** The handoff claimed 0/1/many evidence coverage but the "many" path was untested. Added model-level declaration-order tests and component-level multi-evidence activation tests (zero/partial/all-discovered) through the authoritative `dispatchTransaction` path.

## Boundaries / deferred

- Records UI (BBX-041), Messenger (BBX-042), Notification center (BBX-043), Evidence Board + pin affordance (BBX-050), Mail search UI, persistence/hydration, Case 001 authored mail (BBX-100).
- `nextNodeId`, subject/caseLabel/trust remain deferred; no new dependencies.