import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { LocaleProvider } from "@/lib/locale/provider";

/**
 * Baseline render helper. Wraps `ui` in the providers every chrome/app
 * component expects (locale today; stores, settings later) so tests do not
 * need to change when providers are added. Both the initial render and any
 * `rerender()` keep the provider wrapper (RTL's rerender otherwise replaces
 * the whole tree and would drop it).
 */
export function renderWithProviders(ui: ReactElement): RenderResult {
  const result = render(<LocaleProvider>{ui}</LocaleProvider>);
  const { rerender } = result;
  return {
    ...result,
    rerender: (next: ReactNode) => rerender(<LocaleProvider>{next}</LocaleProvider>),
  };
}
