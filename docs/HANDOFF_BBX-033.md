# Session Handoff — BBX-033 Debug Export

**Task:** BBX-033 — pure, non-sensitive debug report domain. Export-shaped data only; no UI, no download, no persistence, no analytics.

## Scope

`src/domain/diagnostics/` produces exactly the six documented diagnostic categories from docs/08 §13:

1. `applicationVersion`
2. `saveSchemaVersion`
3. `contentVersion`
4. recent domain event-type codes
5. browser capability summary
6. error codes

Everything else is excluded (timestamps, autosave state, slot IDs, checksums, save payloads, UI state, player text, search history, evidence/record IDs, migration state, browser fingerprint data).

## Public API

```ts
buildDebugReport(input: DebugExportInput): DebugReport
serializeDebugReport(report: DebugReport): string
```

```ts
interface DebugExportInput {
  readonly applicationVersion: string;
  readonly contentVersion?: string;                        // absent -> null
  readonly recentEventTypes?: readonly string[];           // type codes only
  readonly browserCapabilities: BrowserCapabilitySummary;  // required
  readonly recentErrorCodes?: readonly SaveRepositoryErrorCode[];
}

interface BrowserCapabilitySummary {
  readonly indexedDB: boolean;
  readonly serviceWorker: boolean;
}

interface DebugReport {
  readonly applicationVersion: string;
  readonly saveSchemaVersion: number;              // imported SAVE_SCHEMA_VERSION
  readonly contentVersion: string | null;
  readonly recentEventTypes: readonly string[];
  readonly browserCapabilities: BrowserCapabilitySummary;
  readonly errorCodes: readonly SaveRepositoryErrorCode[];
}
```

- `saveSchemaVersion` comes from `SAVE_SCHEMA_VERSION`, not the caller.
- Typed `SaveRepositoryErrorCode` is reused from `src/domain/saves/types.ts`; there is no runtime allow-list and no raw-error sanitizer, and no `unknown`/`Error` ingestion.
- `DebugReport` type exports use the union (not widened string[]).

## Event-code boundary

- Input is caller-supplied **type-code strings only**. No event objects, RuleEvents, SaveGame, sessionSnapshot, uiSnapshot, payload inspection, store refs.
- Filter: `^[a-z0-9_-]{1,64}$`; first filter, then preserve chronological order and duplicates; retain the **last 16** valid entries. The 16/64 numbers are BBX-033 export-safety conventions (ADR-020, docs-silent), not engine semantics.
- Capabilities are emitted via explicit field copy (`indexedDB`, `serviceWorker` only) — never `...input.browserCapabilities`.

## Serialization

- `serializeDebugReport(report)` explicitly re-projects the six approved fields into a fresh plain object before `JSON.stringify` — including rebuilding `{indexedDB, serviceWorker}` explicitly — so the serializer itself is a privacy choke point and runtime extras on an externally cast/forged report are discarded. Field ordering is fixed by construction. No pretty printing; no Blob/File/clipboard/browser APIs. Download/share UI is a later task.

## Privacy

- Allowed: opaque caller-supplied `applicationVersion`/`contentVersion` metadata (passed through exactly; `contentVersion ?? null`).
- Forbidden: player/narrative/content payload data, raw error messages/stacks, save internals, browser fingerprinting (no UA/platform/screen/hardware/storage/network), analytics/consent, slot IDs, checksums, IndexedDB internals.
- Leak tests assert only forbidden input paths are sanitized (filtered event codes / extra capability keys never surface in serialized output); metadata passthrough is separately asserted.

## Tests

25 tests in `build-debug-report.test.ts`: six-field shape, SAVE_SCHEMA_VERSION ownership, JSON.stringify round-trip plus serialize equality, version passthrough, capability fixed fields + extra-key leak prevention, event-code filtering (shape/length/spaces/uppercase exactly 64 valid), last-16 retention, duplicate preservation, chronological order, error-code typed boundary, allowed metadata vs forbidden sentinel separation, determinism (10×), immutability (inputs untouched, fresh report object).

## Validation evidence

- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm exec vitest run src/domain/diagnostics` 25/25 PASS · full `pnpm test` PASS · `pnpm validate:content` PASS · `pnpm test:e2e` (4/4) PASS · `pnpm build` PASS.
- No new dependencies.

## Deferred

- Download/share/copy/preview debug-report UI.
- Analytics, crash reporting, telemetry upload, migration diagnostics (BBX-032 is blocked), and any UI integration.
- Raw save/event/payload export (never in scope).

## Known limitations / remaining BBX-033 issues

None within scope; the only untested-but-safe expectation is that callers sanitize at their own boundary before supplying `recentEventTypes`/`recentErrorCodes` (BBX-033's filter is defensive, not a canonical taxonomy).
