"use client";

import type { RecordRowViewModel } from "@/domain/records";

export function RecordsList({
  rows,
  selectedRecordId,
  onSelect,
}: {
  rows: readonly RecordRowViewModel[];
  selectedRecordId: string | null;
  onSelect: (recordId: string) => void;
}) {
  return (
    <section aria-label="Records list" className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
      <ul className="flex flex-col gap-1">
        {rows.map((row, index) =>
          row.available ? (
            <li key={`${row.recordId}:${index}`}>
              <button
                type="button"
                aria-current={selectedRecordId === row.recordId ? "true" : undefined}
                onClick={() => onSelect(row.recordId)}
                className={[
                  "w-full rounded-sm border px-3 py-2 text-left",
                  selectedRecordId === row.recordId
                    ? "border-bbx-accent bg-bbx-surface-2"
                    : "border-transparent hover:bg-bbx-surface-2",
                  "focus-visible:outline-1 focus-visible:outline-bbx-accent",
                ].join(" ")}
              >
                <span className="block truncate text-sm text-bbx-text-1">
                  {row.title ?? "Unavailable record"}
                </span>
                <span className="mt-1 block font-mono text-[0.625rem] uppercase tracking-wider text-bbx-text-2">
                  {row.recordType} · {row.createdAt}
                </span>
              </button>
            </li>
          ) : (
            <li
              key={`${row.recordId}:${index}`}
              className="rounded-sm border border-dashed border-bbx-surface-2 px-3 py-2"
            >
              <span className="block truncate text-sm text-bbx-text-2">Unavailable record</span>
              <span className="mt-1 block font-mono text-[0.625rem] uppercase tracking-wider text-bbx-text-2">
                classified
              </span>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}