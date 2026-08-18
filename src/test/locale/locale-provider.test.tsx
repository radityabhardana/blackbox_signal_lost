import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { LOCALE_STORAGE_KEY, writeStoredLocale } from "@/lib/locale/locales";
import { LocaleContext, LocaleProvider, useLocale, useT } from "@/lib/locale/provider";

function LocaleProbe() {
  const locale = useLocale();
  const t = useT();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="translated">{t("ui.mail.inbox")}</span>
    </div>
  );
}

function LocaleSwitcher() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleSwitcher requires a LocaleProvider");
  const { setLocale } = context;
  return (
    <button type="button" onClick={() => setLocale("id")}>
      switch
    </button>
  );
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("lang");
    delete document.documentElement.dataset.locale;
  });

  it("renders en by default and updates documentElement.lang", () => {
    render(
      <LocaleProvider>
        <LocaleProbe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("locale").textContent).toBe("en");
    expect(screen.getByTestId("translated").textContent).toBe("Inbox");
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dataset.locale).toBe("en");
  });

  it("honors an explicit initialLocale", () => {
    render(
      <LocaleProvider initialLocale="id">
        <LocaleProbe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("locale").textContent).toBe("id");
    expect(document.documentElement.lang).toBe("id");
  });

  it("setLocale switches the dictionary and persists the choice", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <LocaleProbe />
        <LocaleSwitcher />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("translated").textContent).toBe("Inbox");
    await user.click(screen.getByRole("button", { name: "switch" }));
    expect(screen.getByTestId("locale").textContent).toBe("id");
    expect(screen.getByTestId("translated").textContent).toBe("Kotak Masuk");
    expect(document.documentElement.lang).toBe("id");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("id");
  });

  it("applies a stored locale post-mount (no synchronous storage read)", async () => {
    writeStoredLocale("id");
    render(
      <LocaleProvider initialLocale="en">
        <LocaleProbe />
      </LocaleProvider>,
    );
    // The stored preference is applied by a one-time post-mount effect
    // (hydration-safe), not read synchronously during the first render.
    await waitFor(() => {
      expect(screen.getByTestId("locale").textContent).toBe("id");
    });
    expect(screen.getByTestId("translated").textContent).toBe("Kotak Masuk");
    expect(document.documentElement.lang).toBe("id");
  });
});
