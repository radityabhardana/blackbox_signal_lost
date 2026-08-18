# BLACKBOX: Signal Lost

A browser-based detective game set inside a fictional civic-analysis operating system. In the coastal megacity of Nusakara, a systems engineer vanishes and the official records do not agree with each other. As a newly contracted remote analyst, you work through the BLACKBOX incident-reconstruction environment — searching records, pinning evidence, comparing signal data, and deciding which version of the truth becomes official.

## Current status

**Playable vertical slice — not a finished game.**

- Case 001 "Missing Signal" is playable end to end through stages 1–6: records search, evidence board, objectives, hint ladder, the Signal Analyzer puzzle, mid-case decisions, and a Conclusion Report with deterministic outcome evaluation (multiple endings, plus a pre-report checkpoint with retry).
- Saves are local-first (IndexedDB, versioned SaveGame V2 schema). No account or cloud sync.
- The UI is bilingual (English / Bahasa Indonesia) with an in-game language switcher; switching applies live without a reload and never affects progression or saves.
- The presentation foundation is in production: original in-repo vector brand marks, app icons, system glyphs, evidence document visuals, and a desktop texture.
- Character portraits, environment stills, and audio are planned and briefed but **not shipped** (see `docs/ART_PRODUCTION_BRIEF_CASE_001.md`).

## Tech stack

- **Next.js 16 (App Router)** — app shell and routing
- **React 19** — UI components
- **TypeScript (strict)** — all application code
- **Zod** — runtime validation of content, saves, and the asset registry
- **Tailwind CSS v4** — styling on semantic design tokens
- **Zustand** — UI state (window manager, focus)
- **Dexie / IndexedDB** — local-first persistence
- **Vitest** — unit and component tests
- **Playwright** — end-to-end tests

## Run locally

Requires Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 and start the investigation from the landing page (`/game` is the analyst desktop).

## Validation commands

```bash
pnpm lint              # ESLint over the whole repo
pnpm typecheck         # tsc --noEmit (strict)
pnpm test              # Vitest unit/component tests
pnpm validate:content  # Zod-validate all case content files
pnpm validate:assets   # Zod-validate the UI asset registry, SVG safety, and file existence
pnpm validate:i18n     # check localization overlay completeness against the English bundle
pnpm test:e2e          # Playwright end-to-end suite (builds and serves the app)
pnpm build             # production build
```

## Architecture principles

- **Local-first.** Progress lives in the browser; no backend is required to play.
- **Deterministic progression.** Case advancement is computed from validated content plus recorded player events — never from hidden randomness.
- **Content is data, not code.** Dialogue, records, evidence, objectives, and outcomes live in structured content files validated with Zod; content files contain no executable code.
- **Pure domain engines.** Case logic lives in React-free domain modules; UI components never hardcode case logic.
- **Diegetic UI, usability first.** The interface is a fictional analyst terminal, but essential information never relies on color alone, and keyboard access, reduced-motion support, and readable contrast are mandatory.
- **Provenance-first assets.** Every asset has a recorded source, license, and lifecycle status (see below).
- **No runtime generative AI and no multiplayer.** All story content is authored, reviewed, and deterministic.

## Assets and provenance

Asset policy is defined in [`docs/14_ASSET_MANIFEST.md`](docs/14_ASSET_MANIFEST.md) (lifecycle statuses, provenance template, acceptance checklist). The human-readable source registry for this build is [`docs/ASSET_SOURCE_REGISTRY.md`](docs/ASSET_SOURCE_REGISTRY.md); the machine-readable registry validated by `pnpm validate:assets` is `src/content/assets/registry.ts`.

Source policy:

- Original in-repo assets first (this build uses only original SVG assets).
- Third-party assets only with a recorded license and attribution.
- No unverified sources (image-search scrapes, unlicensed rips).
- AI-generated art only with a full provenance record per docs/14 §4.

## Documentation

Design, narrative, technical, and QA documentation lives in `docs/`. Start with `AGENTS.md` for operating rules and `docs/16_DECISION_LOG.md` for recorded decisions.
