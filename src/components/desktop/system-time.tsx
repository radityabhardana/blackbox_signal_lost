"use client";

import { useEffect, useState } from "react";

const TICK_MS = 60_000;

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function SystemTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = (): void => {
      if (!cancelled) {
        setNow(new Date());
      }
    };
    const timeout = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, TICK_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  if (now === null) {
    return null;
  }

  return <time dateTime={now.toISOString()}>{formatTime(now)}</time>;
}