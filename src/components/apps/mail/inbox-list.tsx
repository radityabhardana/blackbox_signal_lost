"use client";

import type { MailRowViewModel } from "@/domain/mail";

export function InboxList({
  rows,
  selectedNodeId,
  onSelect,
}: {
  rows: readonly MailRowViewModel[];
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <section aria-label="Inbox" className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
      <ul className="flex flex-col gap-1">
        {rows.map((row, index) => {
          const selected = row.nodeId === selectedNodeId;
          return (
            <li key={`${row.nodeId}:${index}`}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(row.nodeId)}
                className={[
                  "w-full rounded-sm border px-3 py-2 text-left",
                  selected ? "border-bbx-accent bg-bbx-surface-2" : "border-transparent hover:bg-bbx-surface-2",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full" aria-hidden="true"
                    style={{ background: row.isUnread ? "var(--bbx-accent)" : "transparent" }}
                  />
                  <span className="truncate text-[0.6875rem] font-medium uppercase tracking-wider text-bbx-text-2">
                    {row.isUnread ? "Unread · " : ""}
                    {row.senderLabel}
                  </span>
                </span>
                <span className="mt-1 block truncate text-sm text-bbx-text-1">{row.body}</span>
                {row.time ? (
                  <span className="mt-1 block font-mono text-[0.625rem] text-bbx-text-2">{row.time}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}