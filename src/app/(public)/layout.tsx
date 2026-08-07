import type { ReactNode } from "react";
import { SkipLink } from "@/components/accessibility/skip-link";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bbx-bg-0">
      <SkipLink />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </div>
  );
}
