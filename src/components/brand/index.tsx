/**
 * BLACKBOX: Signal Lost — brand marks.
 *
 * Original fictional brand system (no real-brand resemblance):
 * - Dark civic blue/gray base, amber evidence accent, restrained magenta anomaly.
 * - Every mark is geometric, monochrome-capable (currentColor only), and reads at 16-24px.
 *
 * Accessibility contract (consistent across the set):
 * - Symbols (BlackboxSymbol, CiabMark, PelagaMark): decorative, `aria-hidden="true"`.
 * - Wordmark (BlackboxWordmark): the ONLY informative mark — `role="img"` +
 *   `<title>BLACKBOX</title>` so screen readers get the literal text.
 */

type MarkProps = {
  size?: number | string;
  className?: string;
};

const DEFAULT_SIZE = 24;

/**
 * Civic-intelligence "monitor/box": square aperture, central vertical signal
 * line, offset data dot. Institutional, controlled, slightly unsettling.
 */
export function BlackboxSymbol({ size = DEFAULT_SIZE, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="2.5" y="2.5" width="19" height="19" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="15.5" cy="15.5" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * Vector wordmark for BLACKBOX (no external fonts, no <text>):
 * geometric B L A C K B O X letterforms over an "SIGNAL LOST" kicker.
 * Two-tone via currentColor + kicker opacity — never hardcoded hex.
 */
export function BlackboxWordmark({ size = 160, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={Math.round(Number(size) / 4.2)}
      viewBox="0 0 168 40"
      role="img"
      className={className}
    >
      <title>BLACKBOX</title>
      <g fill="currentColor">
        {/* B */}
        <path d="M2 4.36h7.6c4.68 0 7.9 2.3 7.9 5.78 0 1.98-1.16 3.86-2.94 4.86 2.16.96 3.54 2.94 3.54 5.5 0 3.44-3 5.94-8.2 5.94H2Z" />
        <path d="M7 9h3.1c1.58 0 2.8.88 2.8 2.28S11.68 13.6 10.1 13.6H7Zm0 9.64h3.5c1.78 0 3.08.9 3.08 2.36s-1.3 2.34-3.08 2.34H7Z" />
        {/* L */}
        <path d="M22.2 4.36h4.7v22.64H36V31H22.2Z" />
        {/* A */}
        <path d="M38.3 4.36h5.7l6.66 26.64h-5.28l-1.14-4.92H39.76l-1.14 4.92h-5.06ZM41.8 10l-1.92 8.1h3.82Z" />
        {/* C */}
        <path d="M62.4 22.92c.96 1.88 2.94 3.24 5.5 3.24 1.64 0 3.22-.64 3.9-1.84h5.1c-1.52 3.7-4.7 5.76-9.18 5.76-5.88 0-10-4-10-9.7 0-5.62 4.3-9.7 9.92-9.7 4.58 0 8.12 2.48 9.14 6.86.18.78.12 1.62-.02 2.38Z" />
        {/* K */}
        <path d="M74.6 4.36h6l.5 6.66 5.6-6.66h7l-8.38 9.5 6.16 17.14h-6.06L77.16 18v13h-6.04Z" />
        {/* B */}
        <path d="M93.2 4.36h7.6c4.68 0 7.9 2.3 7.9 5.78 0 1.98-1.16 3.86-2.94 4.86 2.16.96 3.54 2.94 3.54 5.5 0 3.44-3 5.94-8.2 5.94h-7.9ZM98.2 9h3.1c1.58 0 2.8.88 2.8 2.28S102.88 13.6 101.3 13.6h-3.1Zm0 9.64h3.5c1.78 0 3.08.9 3.08 2.36s-1.3 2.34-3.08 2.34h-3.5Z" />
        {/* O */}
        <path d="M116.4 4.16c5.58 0 9.66 4.08 9.66 9.72s-4.08 9.7-9.66 9.7-9.66-4.06-9.66-9.7 4.08-9.72 9.66-9.72Zm0 5.06c-2.72 0-4.54 1.9-4.54 4.66s1.82 4.64 4.54 4.64 4.54-1.88 4.54-4.64-1.82-4.66-4.54-4.66Z" />
        {/* X */}
        <path d="M130.3 4.36h6.72l4.1 6.9 4.1-6.9h6.72l-7.34 11.4 7.36 15.24h-6.78l-4.06-7.7-4.06 7.7h-6.72l7.34-15.24Z" />
      </g>
      {/* "SIGNAL LOST" kicker — secondary tone via opacity, never hex */}
      <g fill="currentColor" fillOpacity={0.55}>
        <path d="M10.36 39.2h2.72l3.9-6h-3.24Zm4.64-9.44h3.1c-.96 2.5-3.24 4.28-6.08 4.28-3.82 0-6.34-2.62-6.34-6.32 0-3.68 2.54-6.34 6.32-6.34 2.68 0 5.88 1.74 6.22 4.7h-3.24c-.68-1.56-1.6-2.2-2.94-2.2-1.96 0-3.36 1.48-3.36 3.84 0 2.4 1.4 3.84 3.36 3.84 1.3 0 2.22-.74 2.96-2Z" />
        <path d="M19.18 36.66v-9.44h3.26v6.94h6.18v2.5Z" />
        <path d="M30.14 29.28l-1.26 3.38h2.52Zm.44-9.06h3.26v9.44h-3.26Zm7.44 0v9.44h3.24v-4.24l2.74 2.26 4.2-7.46h-3.56l-2.28 4.14-1.34-1.08V20.22Z" />
        <path d="M49.9 33.1v-4.76h1.24c1.76 0 2.54.6 2.54 1.68 0 .4-.12.76-.32 1.16h2.84c.16-.62.26-1.2.26-1.74C56.46 27.1 54.34 26 51.9 26h-4v9.44h3.26Zm5.16-1.9c.16-.44.16-.88.16-1.24h-2.84v1.24Z" />
        <path d="M58.06 30.64v-3.42h3.26v3.42Zm-3.26 3v-1.56h9.78v1.56ZM61.32 24.5v-4.28h3.26v4.28Z" />
        <path d="M63.6 33.1h3.18v-9.44H63.6Zm6.82 0 3-4.78 2.98 4.78h3.04l-4.78-7.42 4.58-7.9h-2.88l-2.94 5.06-2.96-5.06h-3.02l4.6 7.9-4.74 7.42Z" />
        <path d="M82.32 36.66v-9.44h3.26v9.44Zm5.06-9.44h3.26v6.94h6.36v2.5h-9.62Z" />
        <path d="M100.9 33.1v-7.42h-2.9v-2.02h9.38v2.02h-3.24v7.42Z" />
        <path d="M111.06 33.1v-4.76h1.24c1.76 0 2.54.6 2.54 1.68 0 .4-.12.76-.32 1.16h2.84c.16-.62.26-1.2.26-1.74 0-2.34-2.12-3.44-4.56-3.44h-4v9.44h3.26Zm5.16-1.9c.16-.44.16-.88.16-1.24h-2.84v1.24Z" />
        <path d="M119.28 36.66v-9.44h4.72c2.6 0 4.32 1.7 4.32 4.04 0 2.26-1.6 3.9-4.5 3.9h-1.28v1.5h3.1v2.62h-2.96v-2.62h-3.4Zm3.26-2.46h.8c.9 0 1.46-.5 1.46-1.42 0-.88-.56-1.16-1.46-1.16h-.8Z" />
        <path d="M129.64 33.1h3.18v-9.44h-3.18Zm6.7-3.82 1.22-3.42h2.52l-2.64 3.42 2.88 5.62h-2.78Z" />
      </g>
    </svg>
  );
}

/**
 * CIAB — Civic Integrity & Audit Bureau. Civil audit authority: interlocking
 * L-shape brackets frame a sealed check. Bureaucratic, trustworthy, civil.
 */
export function CiabMark({ size = DEFAULT_SIZE, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M5.5 3.5h9.6M8 20.5h10.5M3.5 5.5v9.6M20.5 8v10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="m7.5 12 3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

/**
 * Pelaga Systems — infrastructure engineering (flood control, transit):
 * hexagonal node with concentric station ring and a negative-space bar tick.
 * Impersonal corporate reliability.
 */
export function PelagaMark({ size = DEFAULT_SIZE, className }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 2.4 19.6 6v6l-7.6 3.6L4.4 12V6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M12 4.4v1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}