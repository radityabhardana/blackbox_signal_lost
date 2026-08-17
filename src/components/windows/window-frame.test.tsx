import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { WindowFrame } from "./window-frame";

function openWindow() {
  useWindowStore.getState().open("app_mail");
  return useWindowStore.getState().manager.openWindows[0]!;
}

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("WindowFrame", () => {
  it("renders the title and controls", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    expect(screen.getByRole("heading", { name: "Mail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minimize Mail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Maximize Mail" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close Mail" })).toBeInTheDocument();
  });

  it("renders the app icon beside the window title", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    const heading = screen.getByRole("heading", { name: "Mail" });
    expect(heading.parentElement?.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });

  it("renders svg glyphs in the window controls without unicode text", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    for (const name of ["Minimize Mail", "Maximize Mail", "Close Mail"]) {
      const button = screen.getByRole("button", { name });
      expect(button.querySelector("svg[aria-hidden='true']")).not.toBeNull();
      expect(button.textContent).toBe("");
    }
  });

  it("minimizes the window from its control", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Minimize Mail" }));
    expect(useWindowStore.getState().manager.openWindows[0]?.display).toBe("minimized");
  });

  it("maximizes and restores from its control", () => {
    const window = openWindow();
    const { rerender } = render(<WindowFrame window={window} focused={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Maximize Mail" }));
    expect(useWindowStore.getState().manager.openWindows[0]?.display).toBe("maximized");
    const maximized = useWindowStore.getState().manager.openWindows[0]!;
    rerender(<WindowFrame window={maximized} focused={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Restore Mail" }));
    expect(useWindowStore.getState().manager.openWindows[0]?.display).toBe("normal");
  });

  it("closes the window from its control", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Close Mail" }));
    expect(useWindowStore.getState().manager.openWindows).toHaveLength(0);
  });

  it("toggles maximize on title bar double click", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    fireEvent.doubleClick(screen.getByRole("heading", { name: "Mail" }));
    expect(useWindowStore.getState().manager.openWindows[0]?.display).toBe("maximized");
  });

  it("moves the window while dragging the title bar", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    const titleBar = screen.getByRole("heading", { name: "Mail" }).closest("header")!;
    fireEvent.pointerDown(titleBar, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 110, clientY: 60 });
    fireEvent.pointerUp(titleBar, { pointerId: 1 });
    const moved = useWindowStore.getState().manager.openWindows[0]!;
    expect(moved.bounds).toEqual({ x: 100, y: 50, width: 800, height: 600 });
  });

  it("does not move an unchanged drag but raises the window", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    const titleBar = screen.getByRole("heading", { name: "Mail" }).closest("header")!;
    const before = useWindowStore.getState().manager;
    fireEvent.pointerDown(titleBar, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(titleBar, { pointerId: 1 });
    expect(useWindowStore.getState().manager).toBe(before);
  });

  it("stops moving the window after pointercancel", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    const titleBar = screen.getByRole("heading", { name: "Mail" }).closest("header")!;
    fireEvent.pointerDown(titleBar, { pointerId: 1, button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 60, clientY: 40 });
    const afterMove = useWindowStore.getState().manager.openWindows[0]!;
    expect(afterMove.bounds).toEqual({ x: 50, y: 30, width: 800, height: 600 });
    fireEvent.pointerCancel(titleBar, { pointerId: 1 });
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 120, clientY: 100 });
    const afterCancel = useWindowStore.getState().manager.openWindows[0]!;
    expect(afterCancel.bounds).toEqual({ x: 50, y: 30, width: 800, height: 600 });
  });

  it("does not start a title-bar drag when a window control is pressed", () => {
    const window = openWindow();
    render(<WindowFrame window={window} focused={true} />);
    const minimize = screen.getByRole("button", { name: "Minimize Mail" });
    fireEvent.pointerDown(minimize, { pointerId: 1, button: 0, clientX: 5, clientY: 5 });
    fireEvent.pointerMove(minimize, { pointerId: 1, clientX: 55, clientY: 55 });
    fireEvent.pointerUp(minimize, { pointerId: 1 });
    const after = useWindowStore.getState().manager.openWindows[0]!;
    expect(after.bounds).toEqual({ x: 0, y: 0, width: 800, height: 600 });
    expect(after.display).toBe("normal");
  });
});