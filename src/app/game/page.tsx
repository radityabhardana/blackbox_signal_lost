import { WorkspaceShell } from "@/components/desktop/workspace-shell";
import { Taskbar } from "@/components/desktop/taskbar";
import { LayoutPersistence } from "@/components/desktop/layout-persistence";

export default function GamePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 outline-none">
        <WorkspaceShell />
      </main>
      <Taskbar />
      <LayoutPersistence />
    </div>
  );
}
