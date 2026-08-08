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
