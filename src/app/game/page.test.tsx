import "fake-indexeddb/auto";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/helpers/render";
import GamePage from "./page";

describe("game route", () => {
  it("hydrates a real Case 001 session and renders the workspace shell", async () => {
    renderWithProviders(<GamePage />);
    expect(await screen.findByTestId("workspace-shell")).toBeInTheDocument();
  });

  it("shows the active Case 001 title in the taskbar case status", async () => {
    renderWithProviders(<GamePage />);
    expect(await screen.findByText(/case: missing signal/i)).toBeInTheDocument();
  });
});
