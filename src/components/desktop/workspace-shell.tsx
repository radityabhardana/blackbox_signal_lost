"use client";

import { useWindowStore } from "@/stores/window-store";
import { useWorkspaceSize } from "@/hooks/use-workspace-size";
import { WindowLayer } from "@/components/windows/window-layer";
import { WorkspaceHome } from "@/components/desktop/workspace-home";
import { useT } from "@/lib/locale/provider";
import { EvidenceBoardProvider } from "@/features/evidence-board/evidence-board-provider";
import type { EvidenceBoardChange } from "@/features/evidence-board/evidence-board-provider";
import type { EvidenceBoardState } from "@/domain/evidence-board";

export function WorkspaceShell({
  initialBoard,
  onBoardChange,
}: {
  readonly initialBoard?: EvidenceBoardState;
  readonly onBoardChange?: (change: EvidenceBoardChange) => void;
}) {
  const t = useT();
  const ref = useWorkspaceSize<HTMLElement>();
  const windowCount = useWindowStore((state) => state.manager.openWindows.length);

  return (
    <section
      ref={ref}
      aria-label={t("ui.workspace.label")}
      data-testid="workspace-shell"
      className="bbx-grid bbx-desktop relative h-full min-h-0 overflow-hidden"
    >
      {windowCount === 0 ? <WorkspaceHome /> : null}
      <EvidenceBoardProvider
        {...(initialBoard === undefined ? {} : { initialBoard })}
        {...(onBoardChange === undefined ? {} : { onBoardChange })}
      >
        <WindowLayer />
      </EvidenceBoardProvider>
    </section>
  );
}
