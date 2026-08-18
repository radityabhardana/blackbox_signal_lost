import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetWindowStoreForTests, useWindowStore } from "@/stores/window-store";
import { renderWithProviders } from "@/test/helpers/render";
import { WindowLayer } from "./window-layer";

beforeEach(() => {
  resetWindowStoreForTests();
});

describe("WindowLayer", () => {
  it("renders open windows in stacking order", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    renderWithProviders(<WindowLayer />);
    const windows = screen.getAllByTestId(/^window-win_/);
    expect(windows).toHaveLength(2);
    expect(windows[0]).toHaveAttribute("data-testid", "window-win_0");
    expect(windows[1]).toHaveAttribute("data-testid", "window-win_1");
  });

  it("does not render minimized windows", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    store.minimize("win_1");
    renderWithProviders(<WindowLayer />);
    expect(screen.queryByTestId("window-win_1")).not.toBeInTheDocument();
    expect(screen.getByTestId("window-win_0")).toBeInTheDocument();
  });

  it("marks the focused window", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    renderWithProviders(<WindowLayer />);
    expect(screen.getByTestId("window-win_1")).toHaveClass("bbx-window-focused");
    expect(screen.getByTestId("window-win_0")).not.toHaveClass("bbx-window-focused");
  });

  it("brings a clicked window to the front", () => {
    const store = useWindowStore.getState();
    store.open("app_mail");
    store.open("app_records");
    renderWithProviders(<WindowLayer />);
    fireEvent.pointerDown(screen.getByTestId("window-win_0"), { pointerId: 1, button: 0 });
    const state = useWindowStore.getState();
    expect(state.manager.focusedWindowId).toBe("win_0");
    expect(state.manager.openWindows.map((w) => w.id)).toEqual(["win_1", "win_0"]);
  });
});