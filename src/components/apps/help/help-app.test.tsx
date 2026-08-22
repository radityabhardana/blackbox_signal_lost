import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/helpers/render";
import { HelpApp } from "./help-app";

const SECTION_HEADINGS = [
  "Workspace",
  "Windows",
  "Launcher",
  "Records & Search",
  "Evidence Board",
  "Accessibility & Keyboard",
] as const;

describe("HelpApp", () => {
  it("renders the help region with an h1 title and intro", () => {
    renderWithProviders(<HelpApp />);

    expect(screen.getByRole("region", { name: "Help" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Help");
    expect(screen.getByText("How to work the BLACKBOX analyst workspace.")).toBeInTheDocument();
  });

  it("renders all six section headings", () => {
    renderWithProviders(<HelpApp />);

    for (const heading of SECTION_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(SECTION_HEADINGS.length);
  });

  it("renders each section as a labelled region", () => {
    renderWithProviders(<HelpApp />);

    for (const heading of SECTION_HEADINGS) {
      expect(screen.getByRole("region", { name: heading })).toBeInTheDocument();
    }
  });

  it("contains no case-solution or story content", () => {
    renderWithProviders(<HelpApp />);

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toContain("Maya");
    expect(bodyText).not.toContain("ferry");
  });
});