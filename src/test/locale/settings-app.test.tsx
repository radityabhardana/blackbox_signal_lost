import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SettingsApp } from "@/components/apps/settings/settings-app";
import { LOCALE_STORAGE_KEY } from "@/lib/locale/locales";
import { LocaleProvider, useLocale } from "@/lib/locale/provider";

function LocaleProbe() {
  return <span data-testid="locale">{useLocale()}</span>;
}

describe("SettingsApp locale switcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("lang");
    delete document.documentElement.dataset.locale;
  });

  it("renders both language options", () => {
    render(
      <LocaleProvider>
        <SettingsApp />
      </LocaleProvider>,
    );
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Bahasa Indonesia" })).not.toBeChecked();
  });

  it("selecting id updates context locale, documentElement.lang, and persists", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <SettingsApp />
        <LocaleProbe />
      </LocaleProvider>,
    );
    await user.click(screen.getByRole("radio", { name: "Bahasa Indonesia" }));
    expect(screen.getByTestId("locale").textContent).toBe("id");
    expect(document.documentElement.lang).toBe("id");
    expect(document.documentElement.dataset.locale).toBe("id");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("id");
    expect(screen.getByRole("radio", { name: "Bahasa Indonesia" })).toBeChecked();
  });

  it("is keyboard operable", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <SettingsApp />
        <LocaleProbe />
      </LocaleProvider>,
    );
    screen.getByRole("radio", { name: "English" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Bahasa Indonesia" })).toHaveFocus();
    expect(screen.getByTestId("locale").textContent).toBe("id");
  });
});
