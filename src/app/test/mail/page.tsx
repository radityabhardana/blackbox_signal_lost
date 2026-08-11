import { notFound } from "next/navigation";
import { CaseSessionProvider } from "@/features/session/case-session";
import { createMailTestSession } from "@/test/fixtures/mail-content";
import { WorkspaceShell } from "@/components/desktop/workspace-shell";
import { Taskbar } from "@/components/desktop/taskbar";
import { LayoutPersistence } from "@/components/desktop/layout-persistence";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function MailTestHarnessPage() {
  if (process.env.PLAYWRIGHT_TEST !== "1") {
    notFound();
  }

  const session = createMailTestSession();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bbx-bg-0">
      <CaseSessionProvider
        content={session.content}
        mailChannelId={session.mailChannelId}
        initialState={session.initialState}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 outline-none">
            <WorkspaceShell />
          </main>
          <Taskbar />
          <LayoutPersistence />
        </div>
      </CaseSessionProvider>
    </div>
  );
}
