"use client";

import type { AttachmentViewModel } from "@/domain/mail";
import { attachmentLabel, attachmentTypeLabel } from "@/lib/locale/domain-labels";
import { useLocale, useT } from "@/lib/locale/provider";

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
  const locale = useLocale();
  const t = useT();
  const label = attachment.altText ?? attachmentLabel(locale, attachment.assetType, index + 1);
  return (
    <li>
      <button
        type="button"
        aria-label={label}
        onClick={onActivate}
        className="w-full rounded-sm border border-bbx-surface-2 px-3 py-2 text-left text-sm text-bbx-text-1 hover:bg-bbx-surface-2"
      >
        <span className="block">
          <span className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
            {attachmentTypeLabel(locale, attachment.assetType)}
          </span>{" "}
          <span>{label}</span>
        </span>
        {attachment.hasTranscript ? (
          <span className="mt-1 block font-mono text-[0.625rem] text-bbx-text-2">{t("ui.mail.transcript")}</span>
        ) : null}
        {isEvidenceBearing ? (
          <span className="mt-1 inline-block rounded-sm bg-bbx-surface-2 px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-widest text-bbx-accent">
            {discovered ? t("ui.mail.evidenceDiscovered") : t("ui.mail.openToInspect")}
          </span>
        ) : null}
      </button>
    </li>
  );
}