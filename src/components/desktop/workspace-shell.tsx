"use client";

import { useWindowStore } from "@/stores/window-store";
import { useWorkspaceSize } from "@/hooks/use-workspace-size";
import { WindowLayer } from "@/components/windows/window-layer";
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
  const ref = useWorkspaceSize<HTMLElement>();
  const windowCount = useWindowStore((state) => state.manager.openWindows.length);

  return (
    <section
      ref={ref}
      aria-label="Blackbox analyst workspace"
      data-testid="workspace-shell"
      className="bbx-grid bbx-desktop relative h-full min-h-0 overflow-hidden"
    >
      {windowCount === 0 ? (
        <div className="absolute inset-0 grid place-items-center">
          <p className="px-4 text-center font-mono text-xs uppercase tracking-widest text-bbx-text-2">
            Workspace ready — no applications open
          </p>
        </div>
      ) : null}
      <EvidenceBoardProvider
        {...(initialBoard === undefined ? {} : { initialBoard })}
        {...(onBoardChange === undefined ? {} : { onBoardChange })}
      >
        <WindowLayer />
      </EvidenceBoardProvider>
    </section>
  );
}
