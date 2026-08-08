import type { WindowBounds, WorkspaceSize } from "./types";
import {
  DEFAULT_MIN_WINDOW_HEIGHT,
  DEFAULT_MIN_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
} from "./types";

export function clampBounds(
  bounds: WindowBounds,
  workspace: WorkspaceSize,
  minWidth = DEFAULT_MIN_WINDOW_WIDTH,
  minHeight = DEFAULT_MIN_WINDOW_HEIGHT,
): WindowBounds {
  const effectiveMinWidth = Math.min(minWidth, workspace.width);
  const effectiveMinHeight = Math.min(minHeight, workspace.height);
  const width = Math.min(Math.max(bounds.width, effectiveMinWidth), workspace.width);
  const height = Math.min(Math.max(bounds.height, effectiveMinHeight), workspace.height);
  const maxX = Math.max(0, workspace.width - width);
  const maxY = Math.max(0, workspace.height - height);
  return {
    x: Math.min(Math.max(0, bounds.x), maxX),
    y: Math.min(Math.max(0, bounds.y), maxY),
    width,
    height,
  };
}

export function getDefaultWindowBounds(
  workspace: WorkspaceSize,
  minWidth = DEFAULT_MIN_WINDOW_WIDTH,
  minHeight = DEFAULT_MIN_WINDOW_HEIGHT,
): WindowBounds {
  return clampBounds(
    { x: 0, y: 0, width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT },
    workspace,
    minWidth,
    minHeight,
  );
}

export function maximizeBounds(workspace: WorkspaceSize): WindowBounds {
  return clampBounds({ x: 0, y: 0, width: workspace.width, height: workspace.height }, workspace);
}
