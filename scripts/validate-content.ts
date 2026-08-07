/**
 * Content validation entry point.
 *
 * `pnpm validate:content` is part of the documented script contract
 * (docs/10_PROJECT_SETUP.md §5). Content validation itself is deferred to
 * BBX-020, when Zod schemas and valid/invalid fixtures land. Until then this
 * command is an explicit no-op: it performs no checks and must not be
 * mistaken for real validation. TODO(BBX-020): replace with a validator that
 * fails loudly on invalid content packs.
 */
console.log(
  "[validate:content] No checks performed — content validation is deferred to BBX-020.",
);
