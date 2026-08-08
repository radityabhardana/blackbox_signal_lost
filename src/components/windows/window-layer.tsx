"use client";

import { useWindowStore } from "@/stores/window-store";
import { ManagedWindowView } from "./managed-window";

export function WindowLayer() {
  const windows = useWindowStore((state) => state.manager.openWindows);

  return (
    <div className="absolute inset-0">
      {windows.map((window) => (
        <ManagedWindowView key={window.id} id={window.id} />
      ))}
    </div>
  );
}