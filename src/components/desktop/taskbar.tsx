"use client";

import { useWindowStore } from "@/stores/window-store";
import { useOptionalCaseSession } from "@/features/session/case-session";
import { SystemGlyph } from "@/components/icons";
import { BlackboxSymbol } from "@/components/brand";
import { SystemTime } from "@/components/desktop/system-time";
import { useT } from "@/lib/locale/provider";
import { Launcher } from "./launcher";
import { WindowSwitcher } from "./window-switcher";
import { TaskbarAppItems } from "./taskbar-app-items";
import { NotificationCenter } from "./notification-center";

export function Taskbar() {
  const t = useT();
  const resetWorkspace = useWindowStore((state) => state.resetWorkspace);
  const session = useOptionalCaseSession();
  const caseLabel = session === null ? t("ui.taskbar.caseNone") : session.content.case.title;

  return (
    <footer
      aria-label={t("ui.taskbar.label")}
      className="z-bbx-taskbar flex h-12 shrink-0 items-center gap-3 border-t border-bbx-surface-2 bg-bbx-bg-1 px-3"
    >
      <nav aria-label={t("ui.taskbar.launcherNav")}>
        <Launcher />
      </nav>
      <WindowSwitcher />
      <TaskbarAppItems />
      <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-bbx-text-2">
        <BlackboxSymbol size={16} className="shrink-0" />
        <span>{t("ui.taskbar.casePrefix", { title: caseLabel })}</span>
      </span>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          title={t("ui.taskbar.resetTitle")}
          className="bbx-btn px-2 py-1 text-[0.625rem]"
          onClick={resetWorkspace}
        >
          <SystemGlyph id="reset_layout" size={16} className="shrink-0" />
          <span>{t("ui.taskbar.reset")}</span>
        </button>
        <span className="font-mono text-xs tabular-nums text-bbx-text-2">
          <SystemTime />
        </span>
        <NotificationCenter />
      </div>
    </footer>
  );
}
