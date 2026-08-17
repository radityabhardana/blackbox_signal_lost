/**
 * BLACKBOX: Signal Lost — Case 001 evidence visuals.
 *
 * Fictional "system record card" graphics for evidence documents. Every mark
 * is decorative geometry only: no embedded <text>, no raster <image>, no
 * puzzle answers. The semantic record text in the app remains the
 * authoritative content; these visuals only communicate system/source,
 * record type, and status tone without bypassing the investigation.
 *
 * Color contract: monochrome `currentColor` structure (the consumer tints the
 * svg through CSS `color`) plus opacity accents. The only colored element is
 * the status chip, which uses existing theme token classes (fill-bbx-*) —
 * never hardcoded hex.
 *
 * Accessibility contract: every svg is `aria-hidden="true"`. Evidence
 * visuals are decorative; they must never carry a role, label, or
 * interaction.
 */

import type { ComponentType, ReactNode } from "react";

export const EVIDENCE_VISUAL_IDS = [
  "ev_001_ferry_departure",
  "ev_001_emergency_call",
  "ev_001_replay_signature",
  "ev_001_node7_summary",
  "ev_001_manual_escalation",
  "ev_001_corridor_access",
  "ev_001_checksum_record",
  "ev_001_isolation_event",
] as const;

export type EvidenceVisualId = (typeof EVIDENCE_VISUAL_IDS)[number];

type EvidenceVisualProps = {
  className?: string;
};

const VIEW_BOX = "0 0 24 24";

/** Shared stroke family, consistent with the 24px icon set. */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

type RecordFrameProps = {
  /** Theme token class for the status chip (e.g. "fill-bbx-danger/70"). */
  chipClass: string;
  children: ReactNode;
};

/**
 * Shared document frame drawn inside the 24x24 grid: border, source tag
 * badge, status chip, and a header rule. Per-visual glyphs render below the
 * rule as children.
 */
function RecordFrame({ chipClass, children }: RecordFrameProps) {
  return (
    <>
      <rect x="3" y="2.5" width="18" height="19" rx="1.5" {...STROKE} />
      <rect x="5.5" y="4.75" width="5" height="2" rx="0.5" fill="currentColor" fillOpacity={0.4} />
      <rect x="15.5" y="4.75" width="3" height="2" rx="0.5" fill="currentColor" className={chipClass} />
      <path d="M5.5 8.75h13" stroke="currentColor" strokeWidth={1} strokeOpacity={0.3} strokeLinecap="round" />
      {children}
    </>
  );
}

/** Transit record — ferry-gate frame with a departure arrow + timestamp ticks. */
export function FerryDepartureVisual({ className }: EvidenceVisualProps) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className}>
      <RecordFrame chipClass="fill-bbx-success/70">
        <path d="M6.75 11.25V17M17.25 11.25V17" {...STROKE} strokeOpacity={0.5} />
        <path d="M8.25 14.25h7m0 0-1.9-1.9m1.9 1.9-1.9 1.9" {...STROKE} />
        <path
          d="M7.25 19.75v-1.25m3 1.25v-1.25m3 1.25v-1.25m3 1.25v-1.25"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.6}
          strokeLinecap="round"
        />
      </RecordFrame>
    </svg>
  );
}

/** Emergency log — alert diamond + dispatch waveform ticks. */
export function EmergencyCallVisual({ className }: EvidenceVisualProps) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className}>
      <RecordFrame chipClass="fill-bbx-danger/70">
        <path d="M12 10.25 14.75 13 12 15.75 9.25 13Z" {...STROKE} />
        <path d="M12 12.15v1.5" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" />
        <path
          d="M6.75 19.5v-1.5m2.5 1.5v-3m2.5 3v-2m2.5 2v-3.75m2.5 3.75v-1.5"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.6}
          strokeLinecap="round"
        />
      </RecordFrame>
    </svg>
  );
}

/** Replay signature — duplicated/ghosted record sheet with an admin-replay stamp block. */
export function ReplaySignatureVisual({ className }: EvidenceVisualProps) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className}>
      <rect x="5.5" y="1" width="17" height="18" rx="1.5" {...STROKE} strokeOpacity={0.35} />
      <RecordFrame chipClass="fill-bbx-accent-signal/70">
        <path
          d="M5.75 12.25h4.5M5.75 14.75h4.5M5.75 17.25h3.25"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.5}
          strokeLinecap="round"
        />
        <rect x="12" y="12.75" width="6" height="4.75" rx="0.5" {...STROKE} />
        <rect x="13.5" y="14.5" width="3" height="1.5" fill="currentColor" fillOpacity={0.5} />
      </RecordFrame>
    </svg>
  );
}

/** Maintenance summary — node schematic (circle-node + pipes) + noise-burst ticks. */
export function Node7SummaryVisual({ className }: EvidenceVisualProps) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className}>
      <RecordFrame chipClass="fill-bbx-accent-signal/70">
        <circle cx="9.5" cy="14.75" r="2.5" {...STROKE} />
        <path d="M9.5 12.25v-1.75h7.5M12 14.75h5M9.5 17.25v1.75" {...STROKE} strokeOpacity={0.55} />
        <path
          d="M18 13.25l1.25-1.25M18.75 14.75H20M18 16.25l1.25 1.25"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.7}
          strokeLinecap="round"
        />
      </RecordFrame>
    </svg>
  );
}

/** Escalation ticket — ticket with an up-arrow chain and a priority flag. */
export function ManualEscalationVisual({ className }: EvidenceVisualProps) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className}>
      <RecordFrame chipClass="fill-bbx-danger/70">
        <path d="M7.4 10.65 9.75 8.25l2.35 2.4" {...STROKE} strokeOpacity={0.55} />
        <path d="M9.75 19.5v-8m0 0-2.35 2.35M9.75 11.5l2.35 2.35" {...STROKE} />
        <path d="M15.5 19.5V11" {...STROKE} />
        <rect x="15.5" y="11" width="3.75" height="2.75" fill="currentColor" fillOpacity={0.5} />
      </RecordFrame>
    </svg>
  );
}

/** Access log — door/corridor frame + badge scan ticks + corridor line. */
export function CorridorAccessVisual({ className }: EvidenceVisualProps) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className}>
      <RecordFrame chipClass="fill-bbx-success/70">
        <path d="M5.5 19.25h13" stroke="currentColor" strokeWidth={1} strokeOpacity={0.4} strokeLinecap="round" />
        <path d="M7.25 19.25V11h5.5v8.25" {...STROKE} />
        <rect x="14.75" y="11.25" width="3.5" height="2.5" rx="0.5" {...STROKE} />
        <path
          d="M14.75 16.25h3.5M14.75 18h2.25"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.55}
          strokeLinecap="round"
        />
      </RecordFrame>
    </svg>
  );
}

/** Verification record — hash-key block (geometric, unreadable) + verify badge. */
export function ChecksumRecordVisual({ className }: EvidenceVisualProps) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className}>
      <RecordFrame chipClass="fill-bbx-success/70">
        <circle cx="8.75" cy="13.25" r="2.25" {...STROKE} />
        <path d="M11 13.25h6.5M15.25 13.25v1.75M17.5 13.25v2.75" {...STROKE} />
        <circle cx="9" cy="18.5" r="1.9" {...STROKE} />
        <path
          d="m8.2 18.5.65.65 1.15-1.3"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </RecordFrame>
    </svg>
  );
}

/** System isolation log — broken signal line + isolation shutter bars (anomaly tone). */
export function IsolationEventVisual({ className }: EvidenceVisualProps) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" className={className}>
      <RecordFrame chipClass="fill-bbx-suppressed/70">
        <path
          d="M8.25 10.75v8.5M12 10.75v8.5M15.75 10.75v8.5"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.35}
          strokeLinecap="round"
        />
        <path d="M5.5 14.25h3.25M14.75 14.25h3.75" {...STROKE} />
        <path d="m10.5 12.75 2.5 2.5m0-2.5-2.5 2.5" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" />
      </RecordFrame>
    </svg>
  );
}

const EVIDENCE_VISUALS: Record<EvidenceVisualId, ComponentType<EvidenceVisualProps>> = {
  ev_001_ferry_departure: FerryDepartureVisual,
  ev_001_emergency_call: EmergencyCallVisual,
  ev_001_replay_signature: ReplaySignatureVisual,
  ev_001_node7_summary: Node7SummaryVisual,
  ev_001_manual_escalation: ManualEscalationVisual,
  ev_001_corridor_access: CorridorAccessVisual,
  ev_001_checksum_record: ChecksumRecordVisual,
  ev_001_isolation_event: IsolationEventVisual,
};

/**
 * Dispatches to the Case 001 visual registered for `evidenceId`.
 * Decorative only — the rendered svg is `aria-hidden` and the record text in
 * the app is the authoritative content.
 */
export function EvidenceVisual({
  evidenceId,
  className,
}: {
  evidenceId: EvidenceVisualId;
  className?: string;
}) {
  const Visual = EVIDENCE_VISUALS[evidenceId];
  return <Visual {...(className !== undefined ? { className } : {})} />;
}
