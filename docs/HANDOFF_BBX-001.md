# Session Handoff — BBX-001 Project Foundation

**Task:** BBX-001 — Project Foundation (Session 1).

**Completed:**

- Documented source-folder structure (`docs/08_TECHNICAL_DESIGN.md` §4 and `docs/10` §7).
- Centralized design-token foundation (CSS custom properties in `globals.css` + Tailwind v4 `@theme` aliases + JS access in `src/lib/theme.ts`).
- Public landing route `/` under `(public)` segment.
- `/game` route with an empty workspace shell and a baseline taskbar.
- Baseline application layout with root layout, public layout, and game layout.
- TypeScript strict mode plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals/Parameters`.
- Reduced-motion foundations: platform-level `prefers-reduced-motion` override in CSS plus a `data-reduced-motion` boot attribute and `src/lib/reduced-motion.ts`.
- ESLint flat config (Next core-web-vitals + typescript, Prettier).
- Vitest + React Testing Library unit tests; Playwright E2E smoke test.
- Build scripts (`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`, `validate:content`).
- Skip link, focus-visible styling, disabled/button states, 8-point spacing grid, centralized z-index scale.
- Git repo initialized on branch `feat/BBX-001-project-foundation`; initial commit created.

**Files (key):**

- Config: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `.gitignore`
- Tokens/layout: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`, `src/app/game/layout.tsx`, `src/app/game/page.tsx`
- Components: `src/components/accessibility/skip-link.tsx`, `src/components/desktop/{workspace-shell,taskbar,system-time}.tsx`
- Lib: `src/lib/theme.ts`, `src/lib/reduced-motion.ts`
- Tests: `src/app/(public)/page.test.tsx`, `src/app/game/page.test.tsx`, `src/lib/theme.test.ts`, `e2e/smoke.spec.ts`
- Scripts: `scripts/validate-content.ts`

**Tests:** `pnpm lint`, `pnpm typecheck`, `pnpm test` (8 unit), `pnpm build`, `pnpm test:e2e` (chromium smoke), `pnpm validate:content`, `pnpm dev` (smoked `/` and `/game` → 200). All pass.

**Decisions:**

- Tailwind v4 with `@theme`; token source of truth is the `:root` block in `globals.css`; Tailwind aliases map `--bbx-*` → `--color-bbx-*` utilities.
- 8px spacing enforced by overriding `--spacing`.
- Vitest configured without a React plugin; ESBuild `jsx: "automatic"` avoids a Vite version conflict (`@vitejs/plugin-react@6` needs Vite 8, Vitest 3 uses Vite 7). Revisit if Vitest is upgraded to v4.
- `eslint-config-next` v16 consumed via its `.flat()` export (FlatCompat path is broken for it).
- pnpm is installed at `~/.local/bin/pnpm` (was absent); command still works via package scripts.
- Fonts (IBM Plex Sans/Mono) referenced in the theme stacks but not bundled yet; loading is deferred to the polish milestone to avoid build-time network fetch.

**Known issues:**

- No global git identity configured; the initial commit uses inline `-c user.name/-c user.email`. Set the committer's real identity before future commits.
- `pnpm` was not on PATH by default in this environment; installed to `~/.local/bin`.

**Save / schema impact:** None (no persistence or content schemas added yet).

**Next recommended task:** BBX-002 design-token refinements or BBX-010 window-manager domain model.