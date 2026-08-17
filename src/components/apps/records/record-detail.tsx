"use client";

import { useEffect, useRef } from "react";
import type { RecordDetailViewModel } from "@/domain/records";
import { EvidenceVisual } from "@/components/evidence";
import type { EvidenceVisualId } from "@/components/evidence";

/**
 * Presentation-only mapping from Case 001 record ids to their decorative
 * evidence visuals. Records without an entry render no visual. The svg is
 * aria-hidden; the semantic record text remains the authoritative content.
 */
const RECORD_VISUAL: Record<string, EvidenceVisualId> = {
  rec_001_ferry_departure: "ev_001_ferry_departure",
  rec_001_emergency_call: "ev_001_emergency_call",
  rec_001_node7_summary: "ev_001_node7_summary",
  rec_001_manual_escalation: "ev_001_manual_escalation",
  rec_001_corridor_access: "ev_001_corridor_access",
  rec_001_checksum_record: "ev_001_checksum_record",
};

export function RecordDetail({ detail }: { detail: RecordDetailViewModel | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const openedRecordId = detail?.recordId;

  useEffect(() => {
    if (openedRecordId !== undefined) {
      sectionRef.current?.focus();
    }
  }, [openedRecordId]);

  if (detail === null) {
    return (
      <section aria-label="Record" className="border-t border-bbx-surface-2 px-4 py-6">
        <p className="font-mono text-xs text-bbx-text-2">Select a record to read.</p>
      </section>
    );
  }

  const visualId = RECORD_VISUAL[detail.recordId];

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-label="Record"
      className="min-h-0 flex-1 overflow-y-auto border-t border-bbx-surface-2 px-4 py-4 focus-visible:outline-1 focus-visible:outline-bbx-accent"
    >
      {visualId !== undefined ? (
        <EvidenceVisual
          evidenceId={visualId}
          className="mb-3 h-10 w-10 text-bbx-text-2"
        />
      ) : null}
      <h3 className="text-base font-semibold text-bbx-text-1">{detail.title}</h3>
      <dl className="mt-3 space-y-3">
        <div>
          <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Type</dt>
          <dd className="mt-1 text-sm text-bbx-text-1">{detail.recordType}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Logged</dt>
          <dd className="mt-1 font-mono text-xs text-bbx-text-2">{detail.createdAt}</dd>
        </div>
        {detail.revisedAt ? (
          <div>
            <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Revised</dt>
            <dd className="mt-1 font-mono text-xs text-bbx-text-2">{detail.revisedAt}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Source</dt>
          <dd className="mt-1 font-mono text-xs text-bbx-text-2">{detail.sourceLabel}</dd>
        </div>
        {detail.evidenceLabel ? (
          <div>
            <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Evidence</dt>
            <dd className="mt-1 text-sm text-bbx-text-1">{detail.evidenceLabel}</dd>
          </div>
        ) : null}
      </dl>

      {detail.relatedLabels.length > 0 ? (
        <div className="mt-4">
          <h4 className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Related</h4>
          <ul className="mt-2 flex flex-wrap gap-2">
            {detail.relatedLabels.map((related) => (
              <li
                key={related.entityId}
                className="rounded-sm border border-bbx-surface-2 px-2 py-1 text-xs text-bbx-text-2"
              >
                {related.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {detail.metadata.length > 0 ? (
        <div className="mt-4">
          <h4 className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">Metadata</h4>
          <dl className="mt-2 space-y-2">
            {detail.metadata.map((entry) => (
              <div key={entry.key} className="flex justify-between gap-4">
                <dt className="text-xs text-bbx-text-2">{entry.key}</dt>
                <dd className="font-mono text-xs text-bbx-text-1">
                  {entry.value === null ? "—" : String(entry.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}