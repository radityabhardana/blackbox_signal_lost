import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  BlackboxSymbol,
  BlackboxWordmark,
  CiabMark,
  PelagaMark,
} from "./index";

describe("Brand marks", () => {
  describe("BlackboxSymbol", () => {
    it("renders an svg marked aria-hidden", () => {
      const { container } = render(<BlackboxSymbol />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("passes size and className props", () => {
      const { container } = render(<BlackboxSymbol size={32} className="text-civic-accent" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "32");
      expect(svg).toHaveAttribute("height", "32");
      expect(svg).toHaveClass("text-civic-accent");
    });
  });

  describe("BlackboxWordmark", () => {
    it("renders an accessible img with BLACKBOX text via title", () => {
      render(<BlackboxWordmark />);
      const img = screen.getByRole("img", { name: "BLACKBOX" });
      expect(img).toBeInTheDocument();
      expect(img.tagName.toLowerCase()).toBe("svg");
    });

    it("passes size and className props", () => {
      render(<BlackboxWordmark size={200} className="custom-wordmark" />);
      const img = screen.getByRole("img", { name: "BLACKBOX" });
      expect(img).toHaveAttribute("width", "200");
      expect(img).toHaveClass("custom-wordmark");
    });
  });

  describe("CiabMark", () => {
    it("renders an svg marked aria-hidden", () => {
      const { container } = render(<CiabMark />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("passes size and className props", () => {
      const { container } = render(<CiabMark size={40} className="stroke-current" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "40");
      expect(svg).toHaveAttribute("height", "40");
      expect(svg).toHaveClass("stroke-current");
    });
  });

  describe("PelagaMark", () => {
    it("renders an svg marked aria-hidden", () => {
      const { container } = render(<PelagaMark />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("passes size and className props", () => {
      const { container } = render(<PelagaMark size={16} className="opacity-80" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "16");
      expect(svg).toHaveAttribute("height", "16");
      expect(svg).toHaveClass("opacity-80");
    });
  });
});
