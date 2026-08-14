# Session Handoff — BBX-050A3a SaveGame V2 Format Layer

**Status:** Implemented format layer; runtime hydration and autosave remain BBX-050A3b.

## Delivered

- `SAVE_SCHEMA_VERSION = 2`.
- Strict typed `SessionSaveSnapshotV1` containing validated `CaseEngineState` and `EvidenceBoardSnapshotV1`.
- Trusted `SaveGameV2` parsing after checksum/version processing.
- Pure V1→V2 migration for empty historical session snapshots.
- Fail-closed `unsupported_version` handling for non-empty opaque V1 session snapshots.
- Existing current/previous-known-good repository recovery preserved.
- Pure `composeSaveGameV2` without React Flow or viewport state.

## Boundaries

- No hydration gate, provider restore path, runtime autosave bridge, or browser reload E2E was added.
- The Dexie database schema remains version 1.
- `/game` remains without production session bootstrap.
