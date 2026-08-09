# Session Handoff — BBX-030 IndexedDB Save Repository

**Task:** BBX-030 — local-first game-save persistence behind the documented `SaveRepository` contract, using Dexie + IndexedDB with previous-known-good recovery and corruption detection.

## Public contract (docs/08 §8, preserved)

```
load(slotId)   -> Promise<SaveGame | null>
save(slotId, value) -> Promise<void>
delete(slotId)  -> Promise<void>
list()          -> Promise<SaveSummary[]>
```

Errors are thrown as `SaveRepositoryError` with `code` + `slotId`. Missing slot is `null`, never an error.

**Behavior**: missing → `null`; valid current → current; corrupt/unsupported current + valid previous → previous; unrecoverable → typed error. Wired: `slotId` must equal `value.slotId` on save.

## Storage representation

Two-file infrastructure design, internal-only:

```ts
StoredSnapshot {
  payloadJson: string;   // exact checksummed + persisted JSON
  checksum: string;      // repository-computed
}
SaveRecord { slotId; current; previous? }
```

`SavePayload = Omit<SaveGame, "checksum">`. Checksum input is the exact `payloadJson` string (checksum excluded); FNV-1a 32-bit over UTF-8 bytes, integrity-only. `save(input) → load()` returns the repository-normalized snapshot (checksum may differ); all other fields round-trip unchanged.

## Write pipeline

1. `slotId === value.slotId` (else `invalid_input`).
2. Raw JSON-safety check of the opaque payload — `undefined/function/symbol/bigint/Date/Set/Map/class/NaN/±Infinity`/non-plain objects rejected as `not_serializable` before Zod runs.
3. `saveGameSchema` validation (`invalid_input`).
4. `saveSchemaVersion === SAVE_SCHEMA_VERSION` (1) (`unsupported_version`).
5. Drop caller checksum; stringify payload; re-parse; re-validate (`saveGameSchema`) → normalized `{...payload, checksum}`.
6. One Dexie `rw` transaction: choose `previous` from prior valid current (or existing valid previous, never corrupt), `put` the new row. Any failure aborts and leaves prior row intact.

## Recovery

- Load verifies checksum before parse; current-invalid → verify previous → return it; both invalid/no previous → the **current** failure reason (`checksum_mismatch` > `corrupt` > `unsupported_version`).
- Nothing is repaired or mutated by load.
- Version 1 supported; unsupported current falls back to a valid previous else throws; migration is BBX-032's scope.
- `contentVersion` is preserved metadata only; never semantically compared by the repository.

## `list()`

Summarizes each slot's effective snapshot (current else valid previous) in `slotId`-ascending order, no snapshot bodies, no separate "previous" rows; throws the same typed error if a slot is unrecoverable.

## Files

**Create:** `src/domain/saves/types.ts` (`SaveRepository`, `SaveSummary`, `SaveRepositoryError`, `SAVE_SCHEMA_VERSION = 1`), `index.ts`; `src/infrastructure/persistence/save-codec.ts` (shared pure codec/checksum/verify/select), `save-db.ts` (Dexie `SaveDatabase`), `save-repository.ts` (`createIndexedDbSaveRepository`), `in-memory-save-repository.ts`, `index.ts`, plus tests. **Modify:** `package.json`/lockfile (+`dexie`, +dev `fake-indexeddb`), `docs/16_DECISION_LOG.md` (ADR-017). **Not modified:** `src/content/**`, engine/rules/search/windows, BBX-013 layout persistence, `scripts/validate-content.ts`, UI, `docs/12`/`HANDOFF_BBX-011`.

## Tests

38 added (persistence): shared `runRepositoryContract` against both adapters plus recovery/checksum/json-safety/versioning/list-reconciliation/IDB durability (reopen), no-mutation read path, atomicity of bad writes, slot isolation, deterministic ordering, input immutability. Total suite green.

## Validation

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm validate:content`, `pnpm test:e2e`, `pnpm build` all PASS (see final counts in rebuild notes).

## Deferred

BBX-031 autosave coordinator/debounce, BBX-032 migrations (+ version-table/duplicate-checksum behavior), BBX-033 debug export, BBX-063 hydration/runtime assembly, UI (Continue/indicator/slots), cloud/Supabase/sync, BBX-100 Case 001 content, BBX-105 reachability. Dexie is added per docs; `fake-indexeddb` only for tests.

## Known limitations / remaining issues

- Opaque BBX-020 inner payloads (gameEvents/sessionSnapshot/uiSnapshot/settings) remain opaque; their internal contracts belong to later hydration/integration tasks (documented in ADR-017).
- No UI/session wiring yet — repository is storage, not a save coordinator (BBX-031).
- `save_test.json` fixture continues to exist for BBX-020 structural coverage; real save content arrives when a producer task crates envelope values.
