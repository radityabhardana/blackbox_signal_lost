/**
 * E2E helper for seeding a legacy pre-Stage-0 CaseEngineState-shaped save.
 *
 * "Legacy" means the game is in the state right before Stage 0 completion:
 * core applications unlocked, Stage 0 run-up present, but not yet finished.
 * Tests use this to verify the player cannot skip past Stage 0 gates.
 */

import type { Page } from "@playwright/test";

/**
 * A CaseEngineState snapshot before Stage 0 completes.
 */
export function legacyStageOneState(): Record<string, unknown> {
  return {
    flags: {},
    eventHistory: [{ type: "case_001_bootstrap" }],
    discoveredEntityIds: [],
    unlockedRecords: [],
    unlockedApplications: [
      "app_mail",
      "app_messenger",
      "app_records",
      "app_evidence_board",
      "app_objectives",
    ],
    activeObjectives: ["obj_001_verify_location"],
    completedObjectives: [],
    selectedChoices: [],
    firedTriggerIds: ["trigger_001_bootstrap"],
    queuedDialogue: ["dialogue_001_sera_intro"],
    audioCues: [],
    notifications: [],
    revealedHintIds: [],
    submittedReport: null,
    selectedOutcomeId: null,
    caseCompleted: false,
  };
}

/**
 * FNV-1a 32-bit non-cryptographic checksum over UTF-8 bytes.
 * Stable lowercase 8-hex-char digest.
 */
export function fnv1aChecksum(payloadJson: string): string {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(payloadJson)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Builds a SaveGame V2 envelope, computes its checksum, and writes it to
 * the IndexedDB store `blackbox-saves` under `slot_case_001`.
 *
 * Uses page.evaluate so the IndexedDB write happens inside the page context.
 */
export async function seedLegacySave(
  page: Page,
  state?: Record<string, unknown>,
): Promise<void> {
  const envelope: Record<string, unknown> = {
    saveSchemaVersion: 2,
    contentVersion: "1.0.0",
    applicationVersion: "1.0.0",
    slotId: "slot_case_001",
    updatedAt: "2041-11-18T22:00:00Z",
    currentCaseId: "case_001_missing_signal",
    gameEvents: [],
    sessionSnapshot: {
      version: 1,
      caseEngineState: state ?? legacyStageOneState(),
      evidenceBoard: {
        version: 1,
        evidenceNodes: [],
        noteNodes: [],
        edges: [],
        nextNoteSequence: 0,
        nextEdgeSequence: 0,
      },
    },
    uiSnapshot: {},
    settings: {},
  };
  const payloadJson = JSON.stringify(envelope);
  const checksum = fnv1aChecksum(payloadJson);

  await page.evaluate(
    async ({ payloadJson, checksum }) => {
      const openDb = (): Promise<IDBDatabase> =>
        new Promise((resolve, reject) => {
          const request = indexedDB.open("blackbox-saves");
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("saves")) {
              db.createObjectStore("saves", { keyPath: "slotId" });
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("saves", "readwrite");
        const store = tx.objectStore("saves");
        store.put({
          slotId: "slot_case_001",
          current: { payloadJson, checksum },
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    },
    { payloadJson, checksum },
  );
}

/**
 * Sets localStorage `bbx.bootViewed=1` before any page script runs so the
 * boot overlay is dismissed automatically.
 */
export async function bypassBoot(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem("bbx.bootViewed", "1");
  });
}

/**
 * Drives the Stage 0 UI to completion, opening the Launcher and Mail
 * applications in sequence and clicking through the onboarding briefing,
 * activating the credential attachment, opening the identity confirmation
 * mail, and finally confirming the analyst identity.
 */
export async function completeStage0(page: Page): Promise<void> {
  // Boot overlay (presentation-only) — dismiss if present.
  const skip = page.getByRole("button", { name: "Skip to main content" });
  if (await skip.count() > 0) {
    await skip.click();
  }

  // Open Mail through the launcher.
  await page.getByRole("button", { name: "Launcher" }).click();
  await page.getByRole("menuitem", { name: "Mail" }).click();

  // Open the onboarding briefing row (button contains body text).
  await page
    .getByRole("button", { name: /Welcome to BLACKBOX/i })
    .first()
    .click();

  // Activate the credential attachment. Its accessible name is "Document
  // attachment 1" (attachmentLabel en: "Document attachment 1").
  await page
    .getByRole("button", { name: /Document attachment 1/i })
    .click();

  // Open the identity confirmation mail that appears after attachment activation.
  await page.getByRole("button", { name: /Analyst identity confirmation/i }).click();
  await page.getByRole("button", { name: "Confirm analyst identity" }).click();
}
