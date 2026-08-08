import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined" && typeof window.PointerEvent === "undefined") {
  class PointerEventMock extends MouseEvent {
    pointerId: number;
    isPrimary: boolean;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.isPrimary = init.isPrimary ?? true;
    }
  }

  Object.defineProperty(window, "PointerEvent", { value: PointerEventMock, writable: true });
}

if (typeof window !== "undefined" && typeof window.localStorage === "undefined") {
  const entries = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, String(value)),
  };
  Object.defineProperty(window, "localStorage", { value: memoryStorage, configurable: true });
}
