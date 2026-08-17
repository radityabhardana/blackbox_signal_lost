import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AppIcon,
  AppIconId,
  SystemGlyph,
  SystemGlyphId,
  BellGlyph,
  CloseGlyph,
  MailIcon,
  MaximizeGlyph,
  MinimizeGlyph,
  NotificationsIcon,
  RestoreGlyph,
  SignalAnalyzerIcon,
  VerifiedGlyph,
} from "./index";

const APP_ICON_IDS: AppIconId[] = [
  "mail",
  "messenger",
  "records",
  "evidence_board",
  "objectives",
  "signal_analyzer",
  "conclusion",
  "system_log",
  "notifications",
];

const SYSTEM_GLYPH_IDS: SystemGlyphId[] = [
  "minimize",
  "maximize",
  "restore",
  "close",
  "bell",
  "window_switcher",
  "reset_layout",
  "anomaly",
  "discovery",
  "warning",
  "verified",
];

describe("AppIcon", () => {
  it.each(APP_ICON_IDS)("renders an aria-hidden svg for %s", (id) => {
    const { container } = render(<AppIcon id={id} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it.each(APP_ICON_IDS)("resolves the %s id without throwing", (id) => {
    expect(() => render(<AppIcon id={id} />)).not.toThrow();
  });

  it("applies size and className", () => {
    const { container } = render(<AppIcon id="mail" size={32} className="bbx-icon" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
    expect(svg).toHaveClass("bbx-icon");
  });

  it("accepts a string size", () => {
    const { container } = render(<AppIcon id="objectives" size="1.25rem" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "1.25rem");
    expect(svg).toHaveAttribute("height", "1.25rem");
  });
});

describe("SystemGlyph", () => {
  it.each(SYSTEM_GLYPH_IDS)("renders an aria-hidden svg for %s", (id) => {
    const { container } = render(<SystemGlyph id={id} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it.each(SYSTEM_GLYPH_IDS)("resolves the %s id without throwing", (id) => {
    expect(() => render(<SystemGlyph id={id} />)).not.toThrow();
  });

  it("applies size and className", () => {
    const { container } = render(<SystemGlyph id="warning" size={20} className="bbx-glyph" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
    expect(svg).toHaveClass("bbx-glyph");
  });
});

describe("export contract", () => {
  it("exposes every named app-icon component and it renders aria-hidden", () => {
    const icons = [
      MailIcon,
      SignalAnalyzerIcon,
      NotificationsIcon,
    ];
    expect(icons.length).toBeGreaterThan(0);
    for (const Icon of icons) {
      const { container } = render(<Icon />);
      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("exposes every named system-glyph component and it renders aria-hidden", () => {
    const glyphs = [
      MinimizeGlyph,
      MaximizeGlyph,
      RestoreGlyph,
      CloseGlyph,
      BellGlyph,
      VerifiedGlyph,
    ];
    expect(glyphs.length).toBeGreaterThan(0);
    for (const Glyph of glyphs) {
      const { container } = render(<Glyph />);
      expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
  });
});
