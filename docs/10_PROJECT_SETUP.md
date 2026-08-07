# Project Setup

## 1. Prerequisites

Install:

- Node.js current LTS
- pnpm
- Git
- A modern Chromium or Firefox browser

Recommended:

- VS Code, OpenCode, or another agent-capable editor
- GitHub repository
- Playwright browser dependencies

## 2. Create the project

```bash
pnpm create next-app@latest blackbox-signal-lost
cd blackbox-signal-lost
```

Recommended setup answers:

```text
TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
src directory: Yes
App Router: Yes
Turbopack: Use the stable default offered by the CLI
Import alias: @/*
```

## 3. Install core dependencies

```bash
pnpm add zustand zod dexie @xyflow/react howler phaser
```

Install Supabase only when beginning the remote-services milestone:

```bash
pnpm add @supabase/supabase-js
```

## 4. Install development dependencies

```bash
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D @playwright/test
pnpm add -D @types/howler
```

Optional accessibility tooling:

```bash
pnpm add -D axe-core @axe-core/playwright
```

## 5. Add scripts

Update `package.json` scripts to include equivalents of:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "validate:content": "tsx scripts/validate-content.ts"
  }
}
```

If `tsx` is used for validation scripts:

```bash
pnpm add -D tsx
```

## 6. Copy documentation

Place files as:

```text
blackbox-signal-lost/
├── README.md
├── AGENTS.md
├── CONTRIBUTING.md
└── docs/
    ├── 00_INDEX.md
    ├── 01_RESEARCH_AND_POSITIONING.md
    ├── 02_PRD.md
    ├── 03_GDD.md
    ├── 04_NARRATIVE_BIBLE.md
    ├── 05_CASE_001_MISSING_SIGNAL.md
    ├── 06_ART_DIRECTION.md
    ├── 07_UI_UX_SPEC.md
    ├── 08_TECHNICAL_DESIGN.md
    ├── 09_DATA_AND_CONTENT_SCHEMA.md
    ├── 10_PROJECT_SETUP.md
    ├── 11_AI_EXECUTION_PLAYBOOK.md
    ├── 12_ROADMAP_AND_BACKLOG.md
    ├── 13_TESTING_AND_QA.md
    ├── 14_ASSET_MANIFEST.md
    ├── 15_SECURITY_PRIVACY_ACCESSIBILITY.md
    └── 16_DECISION_LOG.md
```

## 7. Create initial source structure

```bash
mkdir -p \
  src/components/primitives \
  src/components/desktop \
  src/components/windows \
  src/components/feedback \
  src/components/accessibility \
  src/features/mail \
  src/features/messenger \
  src/features/records \
  src/features/evidence-board \
  src/features/signal-analyzer \
  src/features/timeline \
  src/features/conclusion \
  src/domain/case \
  src/domain/evidence \
  src/domain/objectives \
  src/domain/search \
  src/domain/outcomes \
  src/domain/saves \
  src/stores \
  src/content/schemas \
  src/content/cases/case_001_missing_signal \
  src/infrastructure/db \
  src/infrastructure/audio \
  src/infrastructure/analytics \
  src/infrastructure/remote \
  src/lib \
  src/test/fixtures \
  src/test/helpers \
  scripts
```

## 8. Environment configuration

Create `.env.local` only when needed.

```bash
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG_PANEL=true
NEXT_PUBLIC_ENABLE_CLOUD_SAVE=false
```

Future Supabase variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never expose a Supabase service-role key in browser environment variables.

## 9. Initial technical checkpoints

### Checkpoint A — Static shell

- Landing page
- Game route
- Empty desktop
- Theme tokens
- Settings modal
- Basic accessibility

### Checkpoint B — Window manager

- Open
- Focus
- Move
- Minimize
- Restore
- Maximize
- Close
- Reset layout
- Persistence

### Checkpoint C — Domain foundation

- Zod schemas
- Case loader
- Typed game events
- Rule evaluator
- Unit tests

### Checkpoint D — First playable loop

- Open mail
- Discover record
- Search database
- Pin evidence
- Complete objective
- Save and reload

Do not add Phaser before Checkpoint D works.

## 10. Quality configuration

Recommended TypeScript settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true
  }
}
```

Adjust only when a library requires a documented compatibility change.

## 11. Git initialization

```bash
git init
git add .
git commit -m "chore: initialize BLACKBOX project"
```

Recommended first branches:

```text
feat/BBX-001-project-foundation
feat/BBX-010-window-manager
feat/BBX-020-case-engine
```

## 12. First run

```bash
pnpm dev
```

Then run baseline checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

After test configuration:

```bash
pnpm test
pnpm test:e2e
```

## 13. AI-agent startup instruction

Give the agent this initial instruction:

```text
Read README.md, AGENTS.md, docs/00_INDEX.md, docs/02_PRD.md,
docs/08_TECHNICAL_DESIGN.md, docs/10_PROJECT_SETUP.md, and
docs/16_DECISION_LOG.md. Do not write code yet. Inspect the repository,
summarize the intended architecture, identify missing setup, and propose
a file-level implementation plan for backlog item BBX-001.
```

Only authorize implementation after the plan matches the documents.

## 14. Dependency policy

- Prefer stable releases.
- Commit the lockfile.
- Update one dependency group at a time.
- Run tests and build after updates.
- Do not let an AI agent perform a full dependency upgrade during feature work.
- Verify breaking changes against official documentation.