import { z } from "zod";
import { isPersistedLayoutValid } from "@/domain/windows";
import type { PersistedWindowLayout } from "@/domain/windows";

export const LAYOUT_VERSION = 1;
export const LAYOUT_STORAGE_KEY = "bbx.window.layout";

const boundsSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite(),
  height: z.number().finite(),
});

const managedWindowSchema = z.object({
  id: z.string(),
  appId: z.string(),
  display: z.enum(["normal", "minimized", "maximized"]),
  bounds: boundsSchema,
  restoreBounds: boundsSchema.nullable(),
  displayBeforeMinimize: z.enum(["normal", "maximized"]).nullable(),
});

const layoutSchema = z.object({
  version: z.literal(LAYOUT_VERSION),
  openWindows: z.array(managedWindowSchema),
  focusedWindowId: z.string().nullable(),
  nextSequence: z.number().int().min(0).finite(),
});

export function serializeLayout(layout: PersistedWindowLayout): string {
  return JSON.stringify({
    version: LAYOUT_VERSION,
    openWindows: layout.openWindows,
    focusedWindowId: layout.focusedWindowId,
    nextSequence: layout.nextSequence,
  });
}

export function parseLayout(rawJson: string | null): PersistedWindowLayout | null {
  if (rawJson === null) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }
  const checked = layoutSchema.safeParse(parsed);
  if (!checked.success) {
    return null;
  }
  const domainLayout: PersistedWindowLayout = {
    openWindows: checked.data.openWindows as PersistedWindowLayout["openWindows"],
    focusedWindowId: checked.data.focusedWindowId,
    nextSequence: checked.data.nextSequence,
  };
  if (!isPersistedLayoutValid(domainLayout)) {
    return null;
  }
  return domainLayout;
}