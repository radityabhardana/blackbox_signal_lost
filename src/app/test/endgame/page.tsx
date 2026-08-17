import { notFound } from "next/navigation";
import { createEndgameHarnessSession } from "@/test/fixtures/endgame-content";
import { SessionSaveRuntime } from "@/features/session/session-save-runtime";
import {
  CASE_001_MAIL_CHANNEL_ID,
  CASE_001_MESSENGER_CHANNEL_ID,
} from "@/content/cases/case_001_missing_signal";
import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function EndgameTestPage() {
  if (process.env.PLAYWRIGHT_TEST !== "1") notFound();
  const session = createEndgameHarnessSession();
  return (
    <SessionSaveRuntime
      content={session.content}
      mailChannelId={CASE_001_MAIL_CHANNEL_ID}
      messengerChannelId={CASE_001_MESSENGER_CHANNEL_ID}
      initialState={session.initialState}
      slotId="slot_endgame_harness"
      applicationVersion={packageJson.version}
    />
  );
}