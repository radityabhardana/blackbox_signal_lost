import { notFound } from "next/navigation";
import { createEvidenceBoardTestSession } from "@/test/fixtures/evidence-board-content";
import { SessionSaveRuntime } from "@/features/session/session-save-runtime";
import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function EvidenceBoardTestPage() {
  if (process.env.PLAYWRIGHT_TEST !== "1") notFound();
  const session = createEvidenceBoardTestSession();
  return (
    <SessionSaveRuntime
      content={session.content}
      mailChannelId="channel_test"
      initialState={session.initialState}
      slotId="slot_evidence_board_test"
      applicationVersion={packageJson.version}
    />
  );
}
