"use client";

import { useMemo } from "react";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { buildMessengerView, type MessengerMessageViewModel } from "@/domain/messenger";

export function MessengerApp() {
  const session = useOptionalCaseSession();

  const view = useMemo(() => {
    if (session === null) return { kind: "no-session" as const };
    return buildMessengerView({
      content: session.content,
      state: session.state,
      messengerChannelId: session.messengerChannelId,
    });
  }, [session]);

  if (view.kind === "no-session" || view.kind === "empty") {
    return (
      <div className="p-6" role="region" aria-label="Messenger">
        <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">No messages</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="px-4 pt-3 pb-2">
        <h2 className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">Messenger</h2>
      </header>
      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
        {view.messages.map((message, occurrence) => (
          <MessengerMessage key={`${message.nodeId}-${occurrence}`} message={message} />
        ))}
      </ul>
    </div>
  );
}

interface MessengerMessageProps {
  message: MessengerMessageViewModel;
}

function MessengerMessage({ message }: MessengerMessageProps) {
  const session = useOptionalCaseSession();

  return (
    <li className="rounded-sm border border-bbx-surface-2 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
          {message.senderLabel}
        </span>
        {message.time ? (
          <time className="font-mono text-[0.625rem] text-bbx-text-2">{message.time}</time>
        ) : null}
      </div>
      <p className="mt-1 text-sm leading-6 text-bbx-text-1">{message.body}</p>
      {message.choices.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-2">
          {message.choices.map((choice) => {
            const selected = session?.state.selectedChoices.includes(choice.choiceId) ?? false;
            const disabled = selected || message.choicesResolved;
            return (
              <li key={choice.choiceId}>
                <button
                  type="button"
                  disabled={disabled}
                  className="w-full rounded-sm border border-bbx-surface-2 px-3 py-2 text-left text-sm text-bbx-text-1 hover:bg-bbx-surface-2 disabled:cursor-not-allowed disabled:text-bbx-text-2 disabled:hover:bg-transparent"
                  onClick={() => {
                    if (!disabled) {
                      session?.dispatch({ kind: "dialogue_choice_selected", choiceId: choice.choiceId });
                    }
                  }}
                >
                  {choice.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}