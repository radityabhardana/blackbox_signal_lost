import { saveGameSchema } from "@/content/schemas";
import { createInitialEngineState } from "@/domain/engine";
import { createInitialEvidenceBoardState, serializeEvidenceBoardSnapshot } from "@/domain/evidence-board";
import { parseTrustedSaveGameV2 } from "./session-save-schema";
import type { SaveGameV2 } from "./session-save-schema";
import { SaveRepositoryError } from "./types";

/**
 * Migrates only the historical V1 shape that contains no session payload.
 * Non-empty opaque V1 data is rejected rather than guessed at or discarded.
 */
export function migrateSaveGameV1ToV2(value: unknown): SaveGameV2 {
  const parsed = saveGameSchema.safeParse(value);
  if (!parsed.success) {
    throw new SaveRepositoryError("corrupt", "historical V1 save failed envelope validation");
  }
  if (parsed.data.saveSchemaVersion !== 1) {
    throw new SaveRepositoryError(
      "unsupported_version",
      `saveSchemaVersion ${parsed.data.saveSchemaVersion} is not a historical V1 save`,
      parsed.data.slotId,
    );
  }
  if (Object.keys(parsed.data.sessionSnapshot).length !== 0) {
    throw new SaveRepositoryError(
      "unsupported_version",
      "historical V1 sessionSnapshot is opaque and cannot be migrated safely",
      parsed.data.slotId,
    );
  }

  return parseTrustedSaveGameV2({
    ...parsed.data,
    saveSchemaVersion: 2,
    sessionSnapshot: {
      version: 1,
      caseEngineState: createInitialEngineState(),
      evidenceBoard: serializeEvidenceBoardSnapshot(createInitialEvidenceBoardState()),
    },
  });
}
