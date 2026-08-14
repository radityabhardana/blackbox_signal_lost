import type { GameEvent, PlayerSettings, UiSnapshot } from "@/content/schemas";
import type { CaseEngineState } from "@/domain/engine";
import {
  serializeEvidenceBoardSnapshot,
} from "@/domain/evidence-board";
import type { EvidenceBoardState } from "@/domain/evidence-board";
import { parseTrustedSaveGameV2 } from "@/domain/saves";
import type { SaveGameV2 } from "@/domain/saves";

export interface ComposeSaveGameV2Input {
  readonly slotId: string;
  readonly contentVersion: string;
  readonly applicationVersion: string;
  readonly updatedAt: string;
  readonly currentCaseId: string;
  readonly gameEvents: readonly GameEvent[];
  readonly caseEngineState: CaseEngineState;
  readonly evidenceBoard: EvidenceBoardState;
  readonly uiSnapshot: UiSnapshot;
  readonly settings: PlayerSettings;
}

/** Purely composes the trusted session portion of a SaveGame V2 envelope. */
export function composeSaveGameV2(input: ComposeSaveGameV2Input): SaveGameV2 {
  return parseTrustedSaveGameV2({
    saveSchemaVersion: 2,
    contentVersion: input.contentVersion,
    applicationVersion: input.applicationVersion,
    slotId: input.slotId,
    updatedAt: input.updatedAt,
    currentCaseId: input.currentCaseId,
    gameEvents: input.gameEvents,
    sessionSnapshot: {
      version: 1,
      caseEngineState: input.caseEngineState,
      evidenceBoard: serializeEvidenceBoardSnapshot(input.evidenceBoard),
    },
    uiSnapshot: input.uiSnapshot,
    settings: input.settings,
    checksum: "",
  });
}
