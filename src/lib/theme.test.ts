import { describe, expect, it } from "vitest";
import { theme } from "./theme";

describe("design tokens", () => {
  it("mirrors the documented color tokens", () => {
    expect(theme.colors.bg0).toBe("var(--bbx-bg-0)");
    expect(theme.colors.bg1).toBe("var(--bbx-bg-1)");
    expect(theme.colors.surface1).toBe("var(--bbx-surface-1)");
    expect(theme.colors.surface2).toBe("var(--bbx-surface-2)");
    expect(theme.colors.text1).toBe("var(--bbx-text-1)");
    expect(theme.colors.text2).toBe("var(--bbx-text-2)");
    expect(theme.colors.accentCivic).toBe("var(--bbx-accent-civic)");
    expect(theme.colors.accentSignal).toBe("var(--bbx-accent-signal)");
    expect(theme.colors.danger).toBe("var(--bbx-danger)");
    expect(theme.colors.suppressed).toBe("var(--bbx-suppressed)");
    expect(theme.colors.success).toBe("var(--bbx-success)");
  });

  it("exposes a centralized z-index scale", () => {
    expect(theme.zIndex.window).toBe("var(--z-bbx-window)");
    expect(theme.zIndex.taskbar).toBe("var(--z-bbx-taskbar)");
    expect(theme.zIndex.modal).toBe("var(--z-bbx-modal)");
  });

  it("exposes motion durations used by the art direction", () => {
    expect(theme.motion.durationWindow).toBe("160ms");
  });
});
