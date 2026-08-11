"use client";

import { useMemo, useState } from "react";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { buildMailInbox } from "@/domain/mail";
import { InboxList } from "./inbox-list";
import { MessageDetail } from "./message-detail";

export function MailApp() {
  const session = useOptionalCaseSession();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [readMessageIds, setReadMessageIds] = useState<ReadonlySet<string>>(() => new Set());

  const inbox = useMemo(() => {
    if (session === null) return { kind: "no-session" as const };

    return buildMailInbox({
      content: session.content,
      state: session.state,
      mailChannelId: session.mailChannelId,
      readMessageIds,
      selectedNodeId,
    });
  }, [session, readMessageIds, selectedNodeId]);

  const selectMessage = (nodeId: string): void => {
    setSelectedNodeId(nodeId);
    setReadMessageIds((previous) => {
      if (previous.has(nodeId)) return previous;
      const next = new Set(previous);
      next.add(nodeId);
      return next;
    });
  };

  if (inbox.kind === "no-session" || inbox.kind === "empty") {
    return (
      <div className="p-6" role="region" aria-label="Secure Mail">
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">No messages</p>
      </div>
    );
  }

  const detail =
    inbox.detail ??
    (selectedNodeId !== null && inbox.rows.some((row) => row.nodeId === selectedNodeId)
      ? (() => {
          const row = inbox.rows.find((candidate) => candidate.nodeId === selectedNodeId)!;
          return {
            nodeId: row.nodeId,
            senderLabel: row.senderLabel,
            body: row.body,
            time: row.time,
            attachments: [],
            choices: [],
          };
        })()
      : null) ??
    null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="px-4 pt-3 pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Secure Mail</h2>
      </header>
      <InboxList rows={inbox.rows} selectedNodeId={selectedNodeId} onSelect={selectMessage} />
      <MessageDetail detail={detail} session={session} />
    </div>
  );
}