import type { ReactNode } from "react";
import { SkipLink } from "@/components/accessibility/skip-link";

export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bbx-bg-0">
      <SkipLink />
      {children}
    </div>
  );
}
