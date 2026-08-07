/**
 * Content validation entry point.
 *
 * BBX-001 foundation has no content packs yet. Schema validation for case
 * manifests arrives with BBX-020; this script exists so `pnpm validate:content`
 * is runnable from the first milestone and fails loudly when packs exist
 * without validators.
 */
const PACKS = new Set<string>([]);

function main(): void {
  if (PACKS.size === 0) {
    console.log("[validate:content] No content packs registered yet (BBX-001 foundation).");
    return;
  }
  for (const pack of PACKS) {
    void pack;
    console.log(`[validate:content] No validator registered for "${pack}".`);
  }
}

main();
