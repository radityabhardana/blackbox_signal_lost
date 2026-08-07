import type { ReactNode } from "react";

export default function GameLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-dvh flex-col overflow-hidden bg-bbx-bg-0">{children}</div>;
}
