export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

/**
 * Returns true when the user has requested reduced motion. Client only.
 * The same signal is mirrored onto `document.documentElement.dataset.reducedMotion`
 * by the boot script in the root layout.
 */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(reducedMotionQuery).matches;
}
