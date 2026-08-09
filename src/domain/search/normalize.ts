/**
 * Deterministic Unicode-aware term normalization per ADR-016.
 *
 * Order: trim -> Unicode-safe lowercase -> replace runs of any
 * non-letter/non-number characters with a single space -> collapse whitespace
 * -> trim again. No locale-sensitive lowercasing, no diacritic folding, no
 * stemming; applied identically to queries and to every authored term.
 */
export function normalizeTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
