"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/lib/locale/provider";

/**
 * Focusable skip link. Pressing Tab on first focus reveals it; activating it
 * moves focus to the main landmark rendered by each layout.
 */
export function SkipLink() {
  const t = useT();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = ref.current;
    if (!link) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Tab" && !event.shiftKey) {
        link.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { once: true });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <a ref={ref} href="#main-content" className="bbx-skip-link">
      {t("ui.skipLink")}
    </a>
  );
}
