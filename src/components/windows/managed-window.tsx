"use client";

import { useWindowStore } from "@/stores/window-store";
import { WindowFrame } from "./window-frame";

export function ManagedWindowView({ id }: { id: string }) {
  const window = useWindowStore((state) =>
    state.manager.openWindows.find((entry) => entry.id === id),
  );
  const focused = useWindowStore((state) => state.manager.focusedWindowId === id);

  if (!window || window.display === "minimized") {
    return null;
  }

  return <WindowFrame window={window} focused={focused} />;
}