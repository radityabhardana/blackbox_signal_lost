# BBX-043 Notification Center UI Handoff

## Delivered

- Notification Center is a shell-owned taskbar panel, not an application window.
- `CaseEngineState.notifications` remains the authoritative append-only history.
- The UI resolves notification ids against parsed `ContentBundle.notifications`.
- Engine order and duplicate occurrences are preserved with deterministic occurrence keys.
- Authored priority is shown as text: Informational, Discovery, Message, Urgent, or System anomaly.
- Panel visibility is local UI state and is not persisted.
- Opening, closing, or reviewing history emits no engine input.
- Opening does not move focus from the trigger; Escape closes from the local wrapper and restores trigger focus.
- Outside pointer handling is scoped to the open panel and does not force focus back to the trigger.

## Explicit boundaries

- No read/unread, dismiss, clear, acknowledge, badge, or count state.
- No actions, deep links, or sibling-app routing.
- No toast stack, live announcement, pulse, sound, browser notification, or OS notification implementation.
- No reload-persistence claim; current `/game` wiring does not prove session restoration.
- The canonical `bundle_basic_valid.json` remains untouched; notification UI tests use cloned test content.

## Validation

BBX-043 uses the guarded `/test/notifications` harness for authored history and `/game` for the no-session empty state. Playwright tests capture and assert both page errors and console errors.
