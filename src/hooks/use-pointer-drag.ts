"use client";

import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

interface PointerDragOptions {
  enabled: boolean;
  onStart?: () => void;
  onMove: (dx: number, dy: number) => void;
}

export function usePointerDrag({ enabled, onStart, onMove }: PointerDragOptions) {
  const session = useRef<DragSession | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    if (!enabled || event.button !== 0) {
      return;
    }
    session.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    onStart?.();
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && dx === 0 && dy === 0) {
      return;
    }
    current.moved = true;
    onMove(dx, dy);
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>): void => {
    const current = session.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }
    session.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}