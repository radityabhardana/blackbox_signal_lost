import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/helpers/render";
import LandingPage from "./page";

describe("landing page", () => {
  it("renders the game title and premise", () => {
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /blackbox: signal lost/i }),
    ).toBeInTheDocument();
  });

  it("links start investigation to the game route", () => {
    renderWithProviders(<LandingPage />);
    const start = screen.getByRole("link", { name: /start investigation/i });
    expect(start).toHaveAttribute("href", "/game");
  });

  it("shows the content notice", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText(/themes of surveillance/i)).toBeInTheDocument();
  });
});
