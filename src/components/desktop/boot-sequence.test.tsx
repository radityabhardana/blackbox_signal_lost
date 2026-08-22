import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/helpers/render";
import { BootSequence } from "./boot-sequence";

function clearBootMarkers(): void {
  window.localStorage.clear();
}

beforeEach(() => {
  clearBootMarkers();
});

describe("BootSequence", () => {
  it("renders children immediately and overlays the boot text on first view", () => {
    renderWithProviders(
      <BootSequence>
        <p>workspace</p>
      </BootSequence>,
    );
    expect(screen.getByText("workspace")).toBeInTheDocument();
    expect(screen.getByText("BLACKBOX SECURE TERMINAL")).toBeInTheDocument();
  });

  it("skips the overlay when the boot marker is already set", () => {
    window.localStorage.setItem("bbx.bootViewed", "1");
    renderWithProviders(
      <BootSequence>
        <p>workspace</p>
      </BootSequence>,
    );
    expect(screen.getByText("workspace")).toBeInTheDocument();
    expect(screen.queryByText("BLACKBOX SECURE TERMINAL")).not.toBeInTheDocument();
  });

  it("dismisses the overlay and sets the marker when the skip button is activated", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BootSequence>
        <p>workspace</p>
      </BootSequence>,
    );
    await user.click(screen.getByRole("button", { name: "Skip to main content" }));
    expect(screen.queryByText("BLACKBOX SECURE TERMINAL")).not.toBeInTheDocument();
    expect(window.localStorage.getItem("bbx.bootViewed")).toBe("1");
  });
});