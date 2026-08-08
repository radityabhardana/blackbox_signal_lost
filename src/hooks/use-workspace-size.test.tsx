import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWindowStore } from "@/stores/window-store";
import { useWorkspaceSize } from "./use-workspace-size";

const OriginalResizeObserver = globalThis.ResizeObserver;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (OriginalResizeObserver === undefined) {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  } else {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = OriginalResizeObserver;
  }
});

describe("useWorkspaceSize", () => {
  it("records the measured workspace size", () => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 1280,
      height: 720,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1280,
      bottom: 720,
      toJSON: () => ({}),
    } as DOMRect);

    function Probe() {
      const ref = useWorkspaceSize<HTMLDivElement>();
      return <div ref={ref} data-testid="probe" />;
    }
    render(<Probe />);
    expect(useWindowStore.getState().workspace).toEqual({ width: 1280, height: 720 });
  });
});