"use client";

import type { CaseSession } from "@/features/session/case-session";
import { isEvidenceDiscovered, type AttachmentViewModel } from "@/domain/mail";
import { unknownSenderLabel } from "@/lib/locale/domain-labels";
import { useLocale, useT } from "@/lib/locale/provider";
import { AttachmentRow } from "./attachment-row";

export interface MailDetailProps {
  detail: {
    readonly nodeId: string;
    readonly senderLabel: string | null;
    readonly body: string;
    readonly time: string | null;
    readonly attachments: readonly AttachmentViewModel[];
    readonly choices: readonly { choiceId: string; label: string }[];
  } | null;
  session: CaseSession | null;
}

export function MessageDetail({ detail, session }: MailDetailProps) {
  const locale = useLocale();
  const t = useT();
  if (detail === null || session === null) {
    return (
      <section aria-label={t("ui.mail.messageRegion")} className="border-t border-bbx-surface-2 px-4 py-6">
        <p className="font-mono text-xs text-bbx-text-2">{t("ui.mail.selectPrompt")}</p>
      </section>
    );
  }

  const activateAttachment = (evidenceIds: readonly string[]): void => {
    if (evidenceIds.length === 0) return;
    session.dispatchTransaction((current) => {
      const discovered = new Set(current.discoveredEntityIds);
      return evidenceIds
        .filter((id) => !discovered.has(id))
        .map((id) => ({ kind: "evidence_discovered", evidenceId: id }) as const);
    });
  };

  const choose = (choiceId: string): void => {
    session.dispatch({ kind: "dialogue_choice_selected", choiceId });
  };

  return (
    <section aria-label={t("ui.mail.messageRegion")} className="min-h-0 flex-1 overflow-y-auto border-t border-bbx-surface-2 px-4 py-4">
      <dl className="space-y-3">
        <div>
          <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">{t("ui.mail.from")}</dt>
          <dd className="mt-1 text-sm text-bbx-text-1">{detail.senderLabel ?? unknownSenderLabel(locale)}</dd>
        </div>
        {detail.time ? (
          <div>
            <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">{t("ui.mail.logged")}</dt>
            <dd className="mt-1 font-mono text-xs text-bbx-text-2">{detail.time}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">{t("ui.mail.message")}</dt>
          <dd className="mt-1 text-sm leading-6 text-bbx-text-1">{detail.body}</dd>
        </div>
      </dl>

      {detail.attachments.length > 0 ? (
        <div className="mt-4">
          <h3 className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">{t("ui.mail.attachments")}</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {detail.attachments.map((attachment, index) => (
              <AttachmentRow
                key={attachment.assetId}
                attachment={attachment}
                index={index}
                discovered={isEvidenceDiscovered(attachment.evidenceIds, session.state)}
                isEvidenceBearing={attachment.evidenceIds.length > 0}
                onActivate={() => activateAttachment(attachment.evidenceIds)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {detail.choices.length > 0 ? (
        <div className="mt-4">
          <h3 className="sr-only">{t("ui.mail.replies")}</h3>
          <ul className="flex flex-col gap-2">
            {detail.choices.map((choice) => (
              <li key={choice.choiceId}>
                <button
                  type="button"
                  className="w-full rounded-sm border border-bbx-surface-2 px-3 py-2 text-left text-sm text-bbx-text-1 hover:bg-bbx-surface-2"
                  onClick={() => choose(choice.choiceId)}
                >
                  {choice.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}