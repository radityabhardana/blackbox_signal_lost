"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useT } from "@/lib/locale/provider";
import { BlackboxSymbol } from "@/components/brand";

const STORAGE_KEY = "bbx.bootViewed";
const DURATION_MS = 2600;

function hasViewedBoot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function markBootViewed(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // best effort — boot still completes
  }
}

/**
 * Presentation-only boot overlay. The workspace (`children`) is always
 * rendered underneath; on first mount an opaque, text-only overlay covers it
 * for a short beat, then dismisses. Later mounts skip the overlay entirely.
 * Skip link label reused from ui.skipLink — no new keys needed.
 */
export function BootSequence({ children }: { children: ReactNode }) {
  const t = useT();
  const [showOverlay, setShowOverlay] = useState(() => !hasViewedBoot());

  useEffect(() => {
    if (!showOverlay) {
      return;
    }
    const timer = window.setTimeout(() => {
      markBootViewed();
      setShowOverlay(false);
    }, DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [showOverlay]);

  const skip = (): void => {
    markBootViewed();
    setShowOverlay(false);
  };

  return (
    <>
      {showOverlay ? (
        <div
          className="fixed inset-0 z-bbx-notification grid place-items-center bg-bbx-bg-0 p-6"
          data-boot-sequence
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
            <BlackboxSymbol size={44} className="shrink-0 text-bbx-text-1" />
            <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
              {t("ui.boot.status")}
            </p>
            <ul className="flex flex-col items-center gap-1.5">
              <li className="font-mono text-xs uppercase tracking-widest text-bbx-accent-signal">
                {t("ui.boot.anomaly")}
              </li>
              <li className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">
                {t("ui.boot.allocated")}
              </li>
              <li className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">
                {t("ui.boot.verified")}
              </li>
              <li className="font-mono text-xs uppercase tracking-widest text-bbx-text-1">
                {t("ui.boot.ready")}
              </li>
            </ul>
            <button type="button" className="bbx-btn px-4 py-2" onClick={skip}>
              {t("ui.skipLink")}
            </button>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}