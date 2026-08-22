# Handoff — Interactive analyst workspace + Case 001 Stage 0 onboarding

## Delivery summary

The `/game` desktop is now an interactive analyst workspace. This delivery ships:

- Case 001 **Stage 0 onboarding** (analyst identity verification) as production content.
- An **empty-workspace landing** (WorkspaceHome dossier) replacing the blank desktop.
- A **boot treatment** (presentation-only overlay).
- A **Help app** (always available, 6 localized sections).
- **App gating** so Stage 0 non-essential apps are unlock-gated.
- **Localization** additions: Case 001 title overlay + new en/id keys.
- **CI** additions: `validate:content` + `validate:assets`.

## Stage 0 flow and content IDs

Stage 0 verifies the analyst's identity before the investigation unlocks.

- Objective: `obj_000_analyst_verification`
- Triggers: `trigger_000_bootstrap`, `trigger_000_credential_inspected`, `trigger_000_confirmation_complete`
- Dialogue: `dialogue_000_*`
- Choice: `choice_000_confirm_identity`
- Evidence: `ev_000_analyst_credential` (with asset + record)
- Notification: `notification_000_briefing`

A fresh bootstrap fires `case_000_bootstrap`. Content version stays `"1.0.0"`.

## Fresh-vs-legacy compat

- `trigger_001_bootstrap` rule changed → `objectiveCompleted obj_000_analyst_verification`; fires once after Stage 0.
- **No** SaveGame V3 and **no** CaseEngineState change.
- Legacy saves are unaffected — the engine deterministically re-derives Stage 0 progress from recorded player events.

## Help decision

`app_help` is added and always available. Six localized sections, no runtime generative AI, no lore additions.

## App gating

- `requiresUnlock` on: `mail`, `messenger`, `records`, `evidence_board`, `objectives`.
- Always available: `app_help`, `app_settings`, `app_system_log`.

## WorkspaceHome projection

- `WorkspaceHome` is a pure `projectWorkspaceHome` projection shown when `openWindows.length === 0`.
- `recommendedAppId` is optional objective metadata.
- No second store.

## Boot policy

- Presentation-only overlay, 2.6s on first view, skippable.
- Skipped after first view via localStorage `bbx.bootViewed`.
- Never stored in engine state.
- Reuses `ui.skipLink` for the skip control.

## Motion + reduced motion

- Motion reuses existing CSS tokens.
- Global `prefers-reduced-motion` override.

## Localization

- Case 001 `case.title` overlay: id locale renders "Sinyal Hilang" (BBX-134).
- New en/id keys delivered (BBX-135 CI wiring: `validate:content` + `validate:assets`).

## CI changes

`.github/workflows/ci.yml` now runs `validate:content` + `validate:assets`. (Already updated; not touched in this delivery.)

## Source gaps

- Minimal neutral prose; no new lore in Stage 0 source or Help sections.
- Boot skip reuses `ui.skipLink`.
- Launcher hides locked apps until their unlock condition is met.
- Portraits, environment stills, audio, and anomaly effects remain future backlog work (BBX-111…BBX-115).
