"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { buildNotificationHistory } from "@/domain/notifications";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { SystemGlyph } from "@/components/icons";
import { useLocale, useT } from "@/lib/locale/provider";
import { notificationPriorityLabel } from "@/lib/locale/domain-labels";

const PANEL_ID = "notification-center-panel";
const HEADING_ID = "notification-center-heading";

export function NotificationCenter() {
  const t = useT();
  const locale = useLocale();
  const session = useOptionalCaseSession();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  const view = useMemo(() => {
    if (session === null) return { kind: "empty" as const };
    return buildNotificationHistory({ content: session.content, state: session.state });
  }, [session]);

  useEffect(() => {
    if (!open) return;

    const handleOutsidePointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [open]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (!open || event.key !== "Escape") return;
    event.preventDefault();
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        className={`bbx-btn px-2 py-1 text-[0.625rem]${open ? " bbx-btn-primary" : ""}`}
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((value) => !value)}
      >
        <SystemGlyph id="bell" size={16} className="shrink-0" />
        <span>{t("ui.notifications.button")}</span>
      </button>
      {open ? (
        <section
          ref={panelRef}
          id={PANEL_ID}
          aria-labelledby={HEADING_ID}
          className="absolute right-0 bottom-12 z-bbx-modal w-80 border border-bbx-surface-2 bg-bbx-bg-1 p-3 shadow-lg"
        >
          <h2 id={HEADING_ID} className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">
            {t("ui.notifications.heading")}
          </h2>
          {view.kind === "empty" ? (
            <p className="mt-3 font-mono text-xs uppercase tracking-widest text-bbx-text-2">
              {t("ui.notifications.empty")}
            </p>
          ) : (
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {view.notifications.map((notification) => (
                <li
                  key={notification.occurrenceKey}
                  className="border-l-2 border-bbx-surface-2 bg-bbx-surface-1 px-3 py-2"
                >
                  <p className="font-mono text-[0.625rem] uppercase tracking-widest text-bbx-text-2">
                    {notificationPriorityLabel(locale, notification.priority)}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-bbx-text-1">{notification.text}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
