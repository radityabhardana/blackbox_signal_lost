"use client";

import type { AttachmentViewModel } from "@/domain/mail";

export function AttachmentRow({
  attachment,
  index,
  discovered,
  isEvidenceBearing,
  onActivate,
}: {
  attachment: AttachmentViewModel;
  index: number;
  discovered: boolean;
  isEvidenceBearing: boolean;
  onActivate: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-label={attachment.label || `Attachment ${index + 1}`}
        onClick={onActivate}
        className="w-full rounded-sm border border-bbx-surface-2 px-3 py-2 text-left text-sm text-bbx-text-1 hover:bg-bbx-surface-2"
      >
        <span className="block">
          <span className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
            {attachment.assetType}
          </span>{" "}
          <span>{attachment.label || `Attachment ${index + 1}`}</span>
        </span>
        {attachment.hasTranscript ? (
          <span className="mt-1 block font-mono text-[0.625rem] text-bbx-text-2">Transcript available</span>
        ) : null}
        {isEvidenceBearing ? (
          <span className="mt-1 inline-block rounded-sm bg-bbx-surface-2 px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-accent">
            {discovered ? "Evidence discovered" : "Open to inspect"}
          </span>
        ) : null}
      </button>
    </li>
  );
}