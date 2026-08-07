# BLACKBOX: Signal Lost

> A web-first interactive detective game played through a fictional investigation operating system.

## Project status

**Stage:** Pre-production  
**Primary target:** Desktop web browsers  
**Secondary target:** Installable PWA after the vertical slice  
**Core deliverable:** One complete 30–45 minute investigation case

## High concept

The player is a newly recruited remote analyst inside **BLACKBOX**, a municipal incident-reconstruction system used in the fictional coastal megacity of **Nusakara**. Cases arrive through secure mail, field-agent calls, surveillance archives, citizen records, and damaged data fragments.

The player does not control a traditional action character. The operating system is the game world. Every application is a tool, every notification can alter the investigation, and every conclusion creates consequences.

The first case begins as a missing-person report involving a systems engineer named **Maya Pranata**. It gradually reveals that BLACKBOX may not merely store evidence—it may rank, suppress, and rewrite what investigators are allowed to see.

**Core promise:**

> Investigate a city through its data, decide which version of the truth becomes official, and discover why the system is studying you.

## Why this concept fits the web

- The desktop, mail client, chat, database, evidence board, media viewer, and terminal are naturally expressed as web interfaces.
- Players can begin from a link without installing a large client.
- Narrative content can be delivered as structured data and expanded case by case.
- Heavy visual modules can be lazy-loaded while the investigation shell remains responsive.
- The project is modular enough for AI-assisted development when each task has explicit acceptance criteria.

## Design pillars

1. **The interface is the world.** No separation between menu and fiction.
2. **Deduction over guessing.** Conclusions must be supported by discoverable evidence.
3. **Curiosity drives progression.** Searching, cross-referencing, and noticing contradictions unlock content.
4. **Choices produce consequences, not morality points.**
5. **Atmosphere supports clarity.** Visual effects may create tension but must never obscure essential evidence.
6. **Small complete cases before large systems.**

## Target experience

| Area | Target |
|---|---|
| Genre | Interactive detective, narrative puzzle, diegetic desktop simulator |
| Session length | 20–60 minutes |
| Case length | 30–45 minutes for the vertical slice |
| Input | Mouse and keyboard; keyboard-only path supported |
| Audience | Players who enjoy mystery, deduction, technology fiction, and branching stories |
| Business model | Free demo first; commercial release decision after validation |
| Multiplayer | Out of scope |
| Generative AI in runtime | Out of scope for MVP |

## Repository documentation

Start here:

1. [`docs/00_INDEX.md`](docs/00_INDEX.md)
2. [`docs/01_RESEARCH_AND_POSITIONING.md`](docs/01_RESEARCH_AND_POSITIONING.md)
3. [`docs/02_PRD.md`](docs/02_PRD.md)
4. [`docs/03_GDD.md`](docs/03_GDD.md)
5. [`docs/04_NARRATIVE_BIBLE.md`](docs/04_NARRATIVE_BIBLE.md)
6. [`docs/05_CASE_001_MISSING_SIGNAL.md`](docs/05_CASE_001_MISSING_SIGNAL.md)
7. [`docs/06_ART_DIRECTION.md`](docs/06_ART_DIRECTION.md)
8. [`docs/07_UI_UX_SPEC.md`](docs/07_UI_UX_SPEC.md)
9. [`docs/08_TECHNICAL_DESIGN.md`](docs/08_TECHNICAL_DESIGN.md)
10. [`docs/09_DATA_AND_CONTENT_SCHEMA.md`](docs/09_DATA_AND_CONTENT_SCHEMA.md)
11. [`docs/10_PROJECT_SETUP.md`](docs/10_PROJECT_SETUP.md)
12. [`AGENTS.md`](AGENTS.md)
13. [`docs/11_AI_EXECUTION_PLAYBOOK.md`](docs/11_AI_EXECUTION_PLAYBOOK.md)
14. [`docs/12_ROADMAP_AND_BACKLOG.md`](docs/12_ROADMAP_AND_BACKLOG.md)
15. [`docs/13_TESTING_AND_QA.md`](docs/13_TESTING_AND_QA.md)
16. [`docs/14_ASSET_MANIFEST.md`](docs/14_ASSET_MANIFEST.md)
17. [`docs/15_SECURITY_PRIVACY_ACCESSIBILITY.md`](docs/15_SECURITY_PRIVACY_ACCESSIBILITY.md)
18. [`CONTRIBUTING.md`](CONTRIBUTING.md)
19. [`docs/16_DECISION_LOG.md`](docs/16_DECISION_LOG.md)

## Recommended stack

- Next.js App Router
- TypeScript strict mode
- React
- Tailwind CSS plus CSS custom properties
- Zustand
- Zod
- Dexie / IndexedDB
- React Flow
- Phaser, loaded only for game-like modules
- Howler.js
- Supabase after local-first validation
- Vitest, React Testing Library, and Playwright

See `docs/08_TECHNICAL_DESIGN.md` before changing the stack.

## Development principle

The first success criterion is not “the architecture is complete.” It is:

> A new player can open the website, complete Case 001, understand why their conclusion mattered, and want to investigate the next case.

Do not build features that do not improve that outcome.