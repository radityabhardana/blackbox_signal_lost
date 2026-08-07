# Documentation Index

## How to use this package

This documentation is ordered from product intent to implementation.

### For the project owner

Read:

1. `01_RESEARCH_AND_POSITIONING.md`
2. `02_PRD.md`
3. `03_GDD.md`
4. `04_NARRATIVE_BIBLE.md`
5. `05_CASE_001_MISSING_SIGNAL.md`
6. `12_ROADMAP_AND_BACKLOG.md`

### For an AI coding agent

Read:

1. `/AGENTS.md`
2. `08_TECHNICAL_DESIGN.md`
3. `09_DATA_AND_CONTENT_SCHEMA.md`
4. `10_PROJECT_SETUP.md`
5. The relevant feature specification
6. `16_DECISION_LOG.md`

### For UI and asset work

Read:

1. `06_ART_DIRECTION.md`
2. `07_UI_UX_SPEC.md`
3. `14_ASSET_MANIFEST.md`
4. `04_NARRATIVE_BIBLE.md`

### For testing

Read:

1. `03_GDD.md`
2. `05_CASE_001_MISSING_SIGNAL.md`
3. `09_DATA_AND_CONTENT_SCHEMA.md`
4. `13_TESTING_AND_QA.md`
5. `15_SECURITY_PRIVACY_ACCESSIBILITY.md`

## Document ownership

| File | Purpose | Update trigger |
|---|---|---|
| `01_RESEARCH_AND_POSITIONING.md` | Reference analysis and market positioning | New major reference or positioning change |
| `02_PRD.md` | Product requirements | Scope, audience, or success criteria change |
| `03_GDD.md` | Game rules and player experience | Gameplay mechanic change |
| `04_NARRATIVE_BIBLE.md` | Canon, world, characters, tone | Canonical story change |
| `05_CASE_001_MISSING_SIGNAL.md` | Vertical-slice case specification | Case content or logic change |
| `06_ART_DIRECTION.md` | Visual and audio identity | Art-direction change |
| `07_UI_UX_SPEC.md` | Interaction behavior and screens | UX behavior change |
| `08_TECHNICAL_DESIGN.md` | Architecture and engineering choices | System design change |
| `09_DATA_AND_CONTENT_SCHEMA.md` | Content contracts | Schema change |
| `10_PROJECT_SETUP.md` | Local setup and commands | Tooling change |
| `11_AI_EXECUTION_PLAYBOOK.md` | AI-assisted implementation sequence | Workflow change |
| `12_ROADMAP_AND_BACKLOG.md` | Milestones and prioritized tasks | Planning change |
| `13_TESTING_AND_QA.md` | Test strategy | Quality requirement change |
| `14_ASSET_MANIFEST.md` | Asset plan and provenance | Asset addition or replacement |
| `15_SECURITY_PRIVACY_ACCESSIBILITY.md` | Nonfunctional safeguards | Policy or architecture change |
| `16_DECISION_LOG.md` | Durable architectural decisions | New major decision |

## Source of truth hierarchy

When documents conflict, apply this order:

1. `16_DECISION_LOG.md`
2. `02_PRD.md`
3. `03_GDD.md`
4. `08_TECHNICAL_DESIGN.md`
5. Feature-specific documents
6. Backlog descriptions
7. Existing implementation

If implementation conflicts with an approved document, either update the implementation or record a new decision. Do not silently let documentation rot.

## Current locked decisions

- Web-first, desktop-first
- Single-player
- Local-first save
- One vertical-slice case before cloud features
- Diegetic investigation OS
- Fictional, abstract security puzzles
- Deterministic authored narrative
- No runtime generative AI
- No multiplayer
- No open-world field exploration in the first release