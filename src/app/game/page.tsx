import { SessionSaveRuntime } from "@/features/session/session-save-runtime";
import {
  CASE_001_MAIL_CHANNEL_ID,
  CASE_001_MESSENGER_CHANNEL_ID,
  CASE_001_SLOT_ID,
  loadCase001Session,
} from "@/content/cases/case_001_missing_signal";
import packageJson from "../../../package.json";

export default function GamePage() {
  const session = loadCase001Session();
  return (
    <SessionSaveRuntime
      content={session.content}
      mailChannelId={CASE_001_MAIL_CHANNEL_ID}
      messengerChannelId={CASE_001_MESSENGER_CHANNEL_ID}
      initialState={session.initialState}
      slotId={CASE_001_SLOT_ID}
      applicationVersion={packageJson.version}
    />
  );
}
