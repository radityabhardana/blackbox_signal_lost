import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Baseline render helper. Future providers (stores, settings) will wrap `ui`
 * here so tests do not need to change.
 */
export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(ui);
}
