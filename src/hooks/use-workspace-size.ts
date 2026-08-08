"use client";

import { useEffect, useRef } from "react";
import { useWindowStore } from "@/stores/window-store";

export function useWorkspaceSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const update = (): void => {
      const rect = element.getBoundingClientRect();
      useWindowStore.getState().setWorkspace({ width: rect.width, height: rect.height });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}