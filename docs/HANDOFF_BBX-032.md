# Session Handoff — BBX-032 Save Migration

**Status:** BLOCKED — no real prior SaveGame schema version exists.

**Reason:** `SAVE_SCHEMA_VERSION = 1` is the only real save schema. There is no v0, legacy-v1, or v2 shape anywhere in the repository, docs, fixtures, or tests, so the BBX-032 acceptance criterion "tests across schema versions" cannot be satisfied honestly.

## Current version inventory

- Canonical version field: `SaveGame.saveSchemaVersion` (`z.number().int().min(0)`, `src/content/schemas/save.ts:7`).
- Repository constant: `SAVE_SCHEMA_VERSION = 1` (ADR-017 convention, `src/domain/saves/types.ts:8`).
- Storage record carries no version; version lives only inside the JSON payload of `StoredSnapshot.payloadJson`.
- `contentVersion` / `applicationVersion` are metadata strings — preserved and surfaced, never migration keys.
- BBX-030's `verifyStoredSnapshot` currently parses with the CURRENT schema (`saveGameSchema`) before version-checking, so an old-format payload would fail "corrupt" before any migration point could notice.

## Why no production migration implementation exists

There is no real historical transition (nothing to migrate from), no frozen prior-version contract, no previous-version fixtures (required by docs/13 §6), and no field-level migration specification. Creating a migration step, registry, or v1→v1 identity would fabricate artifacts that the ADR explicitly forbids.

## Future read / migration pipeline (reserved order)

1. Verify stored checksum before any parse.
2. `JSON.parse(payloadJson)` into unknown JSON.
3. Minimally extract and validate `saveSchemaVersion` (finite integer; anything else → `corrupt`).
4. If current version (`=== SAVE_SCHEMA_VERSION`) → no migration.
5. If older with a complete registered real path → validate with that historical version's schema, then apply each real step in ascending sequence.
6. Validate the final payload against the CURRENT `saveGameSchema`.
7. Return the trusted current `SaveGame`.

Old saves are never required to satisfy the current schema before migration.

## Migration-aware previous-known-good behavior

For each candidate in order `current` then `previous`:

- run checksum → parse-unknown → version discovery → migration (if supported) → current-schema validation;
- a candidate becomes usable only if the whole chain succeeds;
- if the current candidate cannot pass its chain, try `previous` (per BBX-030 recovery policy);
- a migratable old snapshot must not be rejected before selection merely because it is not yet the current schema.

This will require restructuring `verifyStoredSnapshot` (version discovery between parse and full validation) and `selectEffectiveSnapshot` (per-candidate pipeline) when a v2 exists. No such change ships today.

## Version / error taxonomy

- CURRENT: `saveSchemaVersion === SAVE_SCHEMA_VERSION` → no migration.
- OLDER + complete registered path → sequential migration.
- OLDER + no path → `unsupported_version`.
- FUTURE: `saveSchemaVersion > SAVE_SCHEMA_VERSION` → `unsupported_version`.
- MISSING/MALFORMED discriminator (absent, non-integer, non-number) → `corrupt`.
- Version 0 → syntactically a valid integer but not a historical format → `unsupported_version` unless a real v0 contract ever exists.

## Exact unblock checklist (all required)

1. A new real SaveGame schema version (e.g., 2) is introduced.
2. `SAVE_SCHEMA_VERSION` is bumped accordingly.
3. The previous supported schema is frozen/documented as a contract.
4. Real previous-version fixtures exist (docs/13 §6).
5. A field-level migration specification exists — added/removed/renamed/reshaped fields, defaults, and preservation rules.

## Likely implementation seams (future)

- `src/domain/saves/save-migration.ts` — sequential `SaveMigrationStep` registry + dispatcher (created only when a real v2 exists).
- `src/infrastructure/persistence/save-codec.ts` — reorder version discovery to sit between parse-unknown and full-schema validation; migrate per candidate; keep checksum before migration and current-schema validation after.

## Boundaries

- BBX-030 storage semantics unchanged; BBX-031 autosave unaffected; BBX-020 schemas unchanged.
- No new dependencies, no production code, no tests, no fixtures created today.
- BBX-032 acceptance criteria are explicitly NOT complete.
