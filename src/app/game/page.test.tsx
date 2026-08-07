import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/helpers/render";
import GamePage from "./page";

describe("game route", () => {
  it("renders the empty workspace shell", () => {
    renderWithProviders(<GamePage />);
    expect(screen.getByTestId("workspace-shell")).toBeInTheDocument();
    expect(screen.getByText(/workspace ready/i)).toBeInTheDocument();
  });

  it("renders the taskbar with no active case", () => {
    renderWithProviders(<GamePage />);
    expect(screen.getByRole("navigation", { name: /application launcher/i })).toBeInTheDocument();
    expect(screen.getByText(/case: none/i)).toBeInTheDocument();
  });
});
