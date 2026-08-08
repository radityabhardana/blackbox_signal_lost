import { describe, expect, it } from "vitest";
import { createDesktop, openWindow } from "@/domain/windows";
import type { PersistedWindowLayout } from "@/domain/windows";
import { MAIL_APP, TEST_APPS, WORKSPACE, deepFreeze } from "@/test/fixtures/windows";
import {
  LAYOUT_STORAGE_KEY,
  parseLayout,
  serializeLayout,
} from "./layout-schema";
import { createLocalStorageLayoutRepository } from "./layout-repository";

function validLayout(): PersistedWindowLayout {
  const manager = openWindow(createDesktop(TEST_APPS), MAIL_APP.appId, WORKSPACE);
  return {
    openWindows: manager.openWindows,
    focusedWindowId: manager.focusedWindowId,
    nextSequence: manager.nextSequence,
  };
}

function storedJson(): string {
  const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  return raw ?? "";
}

describe("layout-schema", () => {
  it("round-trips a valid layout", () => {
    const layout = validLayout();
    const reparsed = parseLayout(serializeLayout(layout));
    expect(reparsed).toEqual(layout);
  });

  it("rejects malformed JSON", () => {
    expect(parseLayout("{not-json")).toBeNull();
  });

  it("rejects an incompatible version", () => {
    const raw = serializeLayout(validLayout()).replace('"version":1', '"version":2');
    expect(parseLayout(raw)).toBeNull();
  });

  it("rejects non-finite geometry", () => {
    const layout = validLayout();
    const raw = JSON.stringify({
      version: 1,
      openWindows: layout.openWindows.map((window) => ({
        ...window,
        bounds: { ...window.bounds, width: Number.POSITIVE_INFINITY },
      })),
      focusedWindowId: layout.focusedWindowId,
      nextSequence: layout.nextSequence,
    });
    expect(parseLayout(raw)).toBeNull();
  });

  it("rejects a negative nextSequence", () => {
    const layout = validLayout();
    const raw = serializeLayout({ ...layout, nextSequence: -5 });
    expect(parseLayout(raw)).toBeNull();
  });

  it("rejects duplicate window ids", () => {
    const layout = validLayout();
    const window = layout.openWindows[0]!;
    const raw = serializeLayout({
      ...layout,
      openWindows: [window, window],
    });
    expect(parseLayout(raw)).toBeNull();
  });

  it("rejects structurally contradictory window records", () => {
    const layout = validLayout();
    const window = layout.openWindows[0]!;
    const raw = serializeLayout({
      ...layout,
      openWindows: [{ ...window, display: "maximized", restoreBounds: null }],
    });
    expect(parseLayout(raw)).toBeNull();
  });
});

describe("LocalStorageLayoutRepository", () => {
  it("loads what was saved", () => {
    const repository = createLocalStorageLayoutRepository(window.localStorage);
    const layout = deepFreeze(validLayout());
    repository.save(layout);
    expect(repository.load()).toEqual(layout);
  });

  it("returns null when storage is empty", () => {
    const repository = createLocalStorageLayoutRepository(window.localStorage);
    window.localStorage.clear();
    expect(repository.load()).toBeNull();
  });

  it("returns null on storage read failure", () => {
    const failing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    const repository = createLocalStorageLayoutRepository(failing);
    expect(repository.load()).toBeNull();
  });

  it("does not throw when the storage write fails", () => {
    const failing = {
      getItem: () => window.localStorage.getItem(LAYOUT_STORAGE_KEY),
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => window.localStorage.removeItem(LAYOUT_STORAGE_KEY),
    };
    const repository = createLocalStorageLayoutRepository(failing);
    const previous = validLayout();
    repository.save(previous);
    expect(() => repository.save(validLayout())).not.toThrow();
  });

  it("clear removes the stored entry", () => {
    const repository = createLocalStorageLayoutRepository(window.localStorage);
    repository.save(validLayout());
    repository.clear();
    expect(window.localStorage.getItem(LAYOUT_STORAGE_KEY)).toBeNull();
  });

  it("does not write malformed data to storage", () => {
    const repository = createLocalStorageLayoutRepository(window.localStorage);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, "{broken");
    expect(repository.load()).toBeNull();
    expect(storedJson()).toBe("{broken");
  });
});