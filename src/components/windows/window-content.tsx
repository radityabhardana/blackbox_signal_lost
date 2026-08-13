"use client";

import { getApp } from "@/lib/apps";
import { MailApp } from "@/components/apps/mail/mail-app";
import { RecordsApp } from "@/components/apps/records/records-app";
import { MessengerApp } from "@/components/apps/messenger/messenger-app";
import { EvidenceBoardApp } from "@/components/apps/evidence-board/evidence-board-app";

export function WindowContent({ appId }: { appId: string }) {
  if (appId === "app_mail") {
    return (
      <div className="bbx-window-body">
        <MailApp />
      </div>
    );
  }

  if (appId === "app_records") {
    return (
      <div className="bbx-window-body">
        <RecordsApp />
      </div>
    );
  }

  if (appId === "app_messenger") {
    return (
      <div className="bbx-window-body">
        <MessengerApp />
      </div>
    );
  }

  if (appId === "app_evidence_board") {
    return <div className="bbx-window-body"><EvidenceBoardApp /></div>;
  }

  const app = getApp(appId);

  return (
    <div className="bbx-window-body">
      <div className="p-4">
        <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-bbx-text-2">
          {app?.title ?? appId}
        </p>
        <p className="mt-2 text-sm text-bbx-text-2">
          Placeholder application. Content arrives with the case build.
        </p>
      </div>
    </div>
  );
}
