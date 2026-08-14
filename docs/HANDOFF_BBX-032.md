# Session Handoff — BBX-032 Save Migration

**Status:** Implemented at the format layer by BBX-050A3a; runtime hydration/reload remains BBX-050A3b.

**Unblocked by:** BBX-050A3a introduced the first real SaveGame transition, frozen historical V1 fixtures, the trusted V2 session contract, and an explicit V1→V2 migration.

## Current version inventory

- Canonical version field: `SaveGame.saveSchemaVersion` (`z.number().int().min(0)`, `src/content/schemas/save.ts:7`).
- Repository constant: `SAVE_SCHEMA_VERSION = 2` (`src/domain/saves/types.ts`). V1 is historical.
- Storage record carries no version; version lives only inside the JSON payload of `StoredSnapshot.payloadJson`.
- `contentVersion` / `applicationVersion` are metadata strings — preserved and surfaced, never migration keys.
- `verifyStoredSnapshot` now verifies checksum, discovers the version from unknown JSON, migrates supported V1 in memory, and validates the trusted V2 result.

## Implemented migration rule

- A V1 save with exactly `{}` as its opaque `sessionSnapshot` migrates to V2 with canonical fresh `CaseEngineState` and empty `EvidenceBoardSnapshotV1`.
- A V1 save with any non-empty opaque session payload fails closed as `unsupported_version`; it is never discarded or reinterpreted.
- Unrelated envelope metadata is preserved, and loading never rewrites the stored V1 payload.

## Read / migration pipeline

1. Verify stored checksum before any parse.
2. `JSON.parse(payloadJson)` into unknown JSON.
3. Minimally extract and validate `saveSchemaVersion` (finite integer; anything else → `corrupt`).
4. If current version (`=== SAVE_SCHEMA_VERSION`) → validate trusted V2 session data.
5. If historical V1 → validate the V1 envelope, migrate only an empty session snapshot, then validate trusted V2.
6. If future or non-migratable → `unsupported_version`.
7. Return the trusted current `SaveGameV2`.

Old saves are never required to satisfy the current schema before migration.

## Migration-aware previous-known-good behavior

For each candidate in order `current` then `previous`:

- run checksum → parse-unknown → version discovery → migration (if supported) → current-schema validation;
- a candidate becomes usable only if the whole chain succeeds;
- if the current candidate cannot pass its chain, try `previous` (per BBX-030 recovery policy);
- a migratable old snapshot must not be rejected before selection merely because it is not yet the current schema.

This pipeline is implemented in `verifyStoredSnapshot` and applies independently to current and previous candidates.

## Version / error taxonomy

- CURRENT: `saveSchemaVersion === SAVE_SCHEMA_VERSION` → no migration.
- OLDER + complete registered path → sequential migration.
- OLDER + no path → `unsupported_version`.
- FUTURE: `saveSchemaVersion > SAVE_SCHEMA_VERSION` → `unsupported_version`.
- MISSING/MALFORMED discriminator (absent, non-integer, non-number) → `corrupt`.
- Version 0 → syntactically a valid integer but not a historical format → `unsupported_version` unless a real v0 contract ever exists.

## Completed unblock checklist

1. SaveGame V2 is introduced and `SAVE_SCHEMA_VERSION` is 2.
2. Historical V1 envelope fixtures are frozen.
3. The empty/non-empty V1 migration rule is documented and tested.
4. Current/previous recovery and no-load-write behavior are tested.

## Implemented seams

- `src/domain/saves/save-migration.ts` — pure V1→V2 migration.
- `src/infrastructure/persistence/save-codec.ts` — checksum-first version discovery, migration, trusted V2 validation, and per-candidate recovery.

## Boundaries

- BBX-030 storage semantics unchanged; BBX-031 autosave unaffected; BBX-020 schemas unchanged.
- No new dependencies; BBX-050A3a added the production save-format migration, regression tests, and frozen historical fixtures. Dexie schema remains unchanged.
- BBX-032 format-layer acceptance is complete. BBX-050A3b separately owns runtime hydration, autosave wiring, and actual browser reload proof.
