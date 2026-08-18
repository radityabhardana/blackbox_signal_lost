import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { renderWithProviders } from "@/test/helpers/render";
import { WindowFrame } from "./window-frame";

function openWindow() {
  useWindowStore.getState().open("app_mail");
  return useWindowStore.getState().manager.openWindows[0]!;
}

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("ResizeHandle", () => {
  it("is rendered on normal windows and resizes by pointer drag", () => {
    const window = openWindow();
    renderWithProviders(<WindowFrame window={window} focused={true} />);
    const handle = screen.getByRole("button", { name: "Resize Mail" });
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: 50 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(useWindowStore.getState().manager.openWindows[0]?.bounds).toEqual({
      x: 0,
      y: 0,
      width: 900,
      height: 650,
    });
  });

  it("resizes by keyboard arrows when focused", () => {
    const window = openWindow();
    renderWithProviders(<WindowFrame window={window} focused={true} />);
    const handle = screen.getByRole("button", { name: "Resize Mail" });
    handle.focus();
    fireEvent.keyDown(handle, { key: "ArrowRight" });
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(useWindowStore.getState().manager.openWindows[0]?.bounds).toEqual({
      x: 0,
      y: 0,
      width: 816,
      height: 616,
    });
  });

  it("is not rendered on maximized windows", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.toggleMaximize("win_0");
    const window = useWindowStore.getState().manager.openWindows[0]!;
    renderWithProviders(<WindowFrame window={window} focused={true} />);
    expect(screen.queryByRole("button", { name: "Resize Mail" })).not.toBeInTheDocument();
  });
});