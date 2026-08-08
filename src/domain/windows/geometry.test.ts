import { describe, expect, it } from "vitest";
import {
  DEFAULT_MIN_WINDOW_HEIGHT,
  DEFAULT_MIN_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
} from "./types";
import { clampBounds, getDefaultWindowBounds, maximizeBounds } from "./geometry";
import { TINY_WORKSPACE, WORKSPACE, ZERO_WORKSPACE } from "@/test/fixtures/windows";

describe("clampBounds", () => {
  it("returns the input when it already fits the workspace and minimum size", () => {
    const bounds = { x: 40, y: 50, width: 640, height: 480 };
    expect(clampBounds(bounds, WORKSPACE)).toEqual(bounds);
  });

  it("enforces the default minimum size", () => {
    const result = clampBounds({ x: 0, y: 0, width: 100, height: 120 }, WORKSPACE);
    expect(result.width).toBe(DEFAULT_MIN_WINDOW_WIDTH);
    expect(result.height).toBe(DEFAULT_MIN_WINDOW_HEIGHT);
  });

  it("enforces a custom minimum size", () => {
    const result = clampBounds({ x: 0, y: 0, width: 200, height: 200 }, WORKSPACE, 500, 320);
    expect(result.width).toBe(500);
    expect(result.height).toBe(320);
  });

  it("caps the size at the workspace bounds", () => {
    const result = clampBounds({ x: 0, y: 0, width: 5000, height: 5000 }, WORKSPACE);
    expect(result.width).toBe(WORKSPACE.width);
    expect(result.height).toBe(WORKSPACE.height);
  });

  it("clamps positions toward the top-left of the workspace", () => {
    const result = clampBounds({ x: -80, y: -40, width: 640, height: 480 }, WORKSPACE);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("clamps positions toward the bottom-right of the workspace", () => {
    const result = clampBounds({ x: 99999, y: 99999, width: 640, height: 480 }, WORKSPACE);
    expect(result.x).toBe(WORKSPACE.width - 640);
    expect(result.y).toBe(WORKSPACE.height - 480);
  });

  it("fits the window into a workspace smaller than the minimum size", () => {
    const result = clampBounds({ x: 0, y: 0, width: 800, height: 600 }, TINY_WORKSPACE);
    expect(result).toEqual({
      x: 0,
      y: 0,
      width: TINY_WORKSPACE.width,
      height: TINY_WORKSPACE.height,
    });
  });

  it("produces valid zero geometry for an empty workspace", () => {
    expect(clampBounds({ x: 5, y: 5, width: 800, height: 600 }, ZERO_WORKSPACE)).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  });
});

describe("getDefaultWindowBounds", () => {
  it("returns the default window size at the origin for a spacious workspace", () => {
    expect(getDefaultWindowBounds(WORKSPACE)).toEqual({
      x: 0,
      y: 0,
      width: DEFAULT_WINDOW_WIDTH,
      height: DEFAULT_WINDOW_HEIGHT,
    });
  });

  it("applies a custom minimum size", () => {
    expect(getDefaultWindowBounds(WORKSPACE, 1000, 700)).toEqual({ x: 0, y: 0, width: 1000, height: 700 });
  });

  it("fits into a workspace smaller than the default size", () => {
    expect(getDefaultWindowBounds(TINY_WORKSPACE)).toEqual({
      x: 0,
      y: 0,
      width: TINY_WORKSPACE.width,
      height: TINY_WORKSPACE.height,
    });
  });

  it("fits into an empty workspace", () => {
    expect(getDefaultWindowBounds(ZERO_WORKSPACE)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});

describe("maximizeBounds", () => {
  it("covers the whole workspace", () => {
    expect(maximizeBounds(WORKSPACE)).toEqual({ x: 0, y: 0, ...WORKSPACE });
  });

  it("covers an empty workspace with zero geometry", () => {
    expect(maximizeBounds(ZERO_WORKSPACE)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});