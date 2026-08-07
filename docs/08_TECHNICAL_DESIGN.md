# Technical Design Document

## 1. Technical goals

- Deliver a responsive desktop-like investigation interface in modern browsers.
- Keep game logic deterministic and content-driven.
- Separate UI, domain logic, content, and persistence.
- Support local play without account creation.
- Allow later cloud synchronization without rewriting the case engine.
- Make modules small enough for reliable AI-assisted implementation.

## 2. Selected stack

### Application framework

**Next.js App Router + React + TypeScript**

Use for:

- public landing pages,
- game shell,
- application UI,
- routing,
- build optimization,
- and future server endpoints.

### Styling

**Tailwind CSS + CSS custom properties**

- Tailwind for composition and spacing
- CSS variables for theme tokens
- Component variants for states
- No arbitrary per-component palette

### State

**Zustand**

Use separate stores or slices for:

- UI state
- session state
- settings
- save coordination

Domain logic should remain in pure functions where practical.

### Validation

**Zod**

Validate:

- case manifests,
- evidence,
- dialogue,
- objectives,
- save data,
- environment configuration,
- and remote payloads.

### Local persistence

**IndexedDB through Dexie**

Reasons:

- Larger and more structured than localStorage
- Supports transactional writes
- Appropriate for save snapshots and board state

localStorage may hold only tiny preferences or migration pointers.

### Evidence board

**React Flow**

Use for:

- draggable nodes,
- edges,
- zoom,
- pan,
- selection,
- and saved layouts.

Wrap it behind project-specific components and domain types.

### Game-like visual modules

**Phaser**

Use only where a continuous rendering loop adds value:

- animated city map,
- CCTV multi-feed effects,
- signal puzzle,
- environmental transitions.

Do not render the entire desktop in Phaser.

### Audio

**Howler.js**

Use for:

- music layers,
- UI sounds,
- ambience,
- volume groups,
- and crossfades.

### Remote services

**Supabase**, deferred until after local vertical-slice validation.

Potential uses:

- optional accounts,
- cloud save,
- anonymous aggregate playtest events,
- remote content manifests,
- and storage.

### Testing

- Vitest
- React Testing Library
- Playwright
- axe integration for accessibility checks
- Storybook optional after core components stabilize

## 3. High-level architecture

```text
Next.js application
├── Public layer
│   ├── Landing
│   ├── Credits
│   └── Legal / privacy
├── Game shell
│   ├── Desktop
│   ├── Window manager
│   ├── Taskbar
│   └── Notification center
├── Applications
│   ├── Mail
│   ├── Messenger
│   ├── Records
│   ├── Evidence Board
│   ├── Signal Analyzer
│   ├── Timeline
│   └── Conclusion
├── Domain
│   ├── Case engine
│   ├── Rule evaluator
│   ├── Search engine
│   ├── Objective engine
│   ├── Outcome evaluator
│   └── Save migration
├── Content
│   ├── Case manifests
│   ├── Entities
│   ├── Dialogue
│   └── Assets
└── Infrastructure
    ├── IndexedDB
    ├── Audio
    ├── Analytics adapter
    └── Supabase adapter
```

## 4. Recommended folder structure

```text
src/
├── app/
│   ├── (public)/
│   ├── game/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── primitives/
│   ├── desktop/
│   ├── windows/
│   ├── feedback/
│   └── accessibility/
├── features/
│   ├── mail/
│   ├── messenger/
│   ├── records/
│   ├── evidence-board/
│   ├── signal-analyzer/
│   ├── timeline/
│   └── conclusion/
├── domain/
│   ├── case/
│   ├── evidence/
│   ├── objectives/
│   ├── search/
│   ├── outcomes/
│   └── saves/
├── stores/
│   ├── ui-store.ts
│   ├── session-store.ts
│   └── settings-store.ts
├── content/
│   ├── schemas/
│   └── cases/
├── infrastructure/
│   ├── db/
│   ├── audio/
│   ├── analytics/
│   └── remote/
├── lib/
│   ├── result.ts
│   ├── ids.ts
│   ├── time.ts
│   └── logging.ts
└── test/
    ├── fixtures/
    └── helpers/
```

## 5. Domain event model

All meaningful player actions should produce typed events.

```ts
type GameEvent =
  | { type: "case_started"; caseId: string; at: string }
  | { type: "record_opened"; recordId: string; at: string }
  | { type: "evidence_discovered"; evidenceId: string; at: string }
  | { type: "search_performed"; query: string; at: string }
  | { type: "dialogue_choice_selected"; nodeId: string; choiceId: string; at: string }
  | { type: "puzzle_completed"; puzzleId: string; resultId: string; at: string }
  | { type: "report_submitted"; reportId: string; at: string };
```

Benefits:

- deterministic progression,
- easier testing,
- replayable debug sessions,
- safe save reconstruction,
- and useful playtest analytics.

## 6. Case engine

### Responsibilities

- Load validated content.
- Apply events.
- Evaluate unlock rules.
- Update objective state.
- Queue narrative triggers.
- Calculate report outcomes.
- Produce serializable session state.

### Non-responsibilities

- Render React components.
- Play audio directly.
- Write to IndexedDB directly.
- Fetch remote data directly.
- Move windows.

### Rule model

Use a small declarative rule language rather than arbitrary code in content.

```json
{
  "all": [
    { "eventOccurred": "evidence_discovered", "entityId": "ev_ferry_departure" },
    { "eventOccurred": "evidence_discovered", "entityId": "ev_emergency_call" }
  ]
}
```

Supported operators should remain deliberately small:

- all
- any
- not
- flagEquals
- eventOccurred
- entityDiscovered
- objectiveCompleted
- choiceSelected
- countAtLeast

## 7. Search engine

The search engine should be deterministic and authored.

Pipeline:

1. Normalize Unicode, case, punctuation, and whitespace.
2. Resolve aliases.
3. Match indexed terms.
4. Check availability conditions.
5. Rank exact title, exact keyword, alias, and partial keyword.
6. Return typed results.
7. Emit a search event only when configured.

Do not use embeddings in MVP. Authored keywords are easier to test and localize.

## 8. Persistence architecture

```ts
interface SaveRepository {
  load(slotId: string): Promise<SaveGame | null>;
  save(slotId: string, value: SaveGame): Promise<void>;
  delete(slotId: string): Promise<void>;
  list(): Promise<SaveSummary[]>;
}
```

Implementations:

- `IndexedDbSaveRepository`
- future `CloudSaveRepository`
- future `CompositeSaveRepository`

### Save strategy

- Write new snapshot in a transaction.
- Preserve previous known-good snapshot.
- Include checksum for corruption detection.
- Include schema and content versions.
- Run explicit migrations.
- Avoid storing derived indexes that can be rebuilt.

## 9. React and Phaser integration

Phaser is mounted inside an isolated client component.

```text
React command → typed scene adapter → Phaser scene
Phaser event → typed event bus → application service → domain event
```

Rules:

- One owner for each piece of state.
- No shared mutable objects.
- Destroy scene and listeners on unmount.
- Pause rendering when module is minimized.
- Lazy-load Phaser only when a Phaser-based app opens.

## 10. Audio architecture

Audio groups:

- master
- music
- ambience
- interface
- voice
- anomaly

Requirements:

- User interaction unlocks audio context.
- Volume preferences persist.
- Calls lower music temporarily.
- Reduced-anomaly setting changes sound treatment.
- Missing audio never blocks progression.

## 11. Performance budget

Initial targets:

- Landing page should avoid loading Phaser and case media.
- Workspace shell loads only required fonts, icons, and first-stage content.
- Case media loads by stage and priority.
- Images use modern compressed formats.
- Long records are code-split or fetched as content chunks when practical.
- At most one active Phaser render loop.
- Background animation pauses when the tab is hidden.
- Avoid more than eight high-frequency subscriptions on the desktop root.

Measure:

- LCP
- INP
- memory after 30 minutes
- save latency
- application open latency
- dropped frames in Phaser modules

## 12. Error handling

Error categories:

- content validation
- save read/write
- media load
- unsupported browser capability
- remote synchronization
- unexpected domain state

Player-facing behavior:

- Preserve progress where possible.
- Display a diegetic but clear recovery message.
- Offer retry.
- Log a non-sensitive diagnostic code.
- Never disguise a real failure as story corruption.

## 13. Logging

Development logs should be structured.

Never log:

- secrets,
- full cloud tokens,
- private player notes,
- or unnecessary personal data.

Provide a debug export containing:

- app version,
- save schema version,
- content version,
- recent domain event types,
- browser capability summary,
- and error codes.

## 14. Browser support

Primary:

- Current stable Chrome
- Current stable Edge
- Current stable Firefox

Secondary:

- Current stable Safari after targeted testing

Feature detection is required for:

- IndexedDB
- audio context
- WebGL / optional graphics modules
- storage quota
- fullscreen behavior

The core case should not require WebGPU.

## 15. Deployment

Recommended:

- Vercel or equivalent for Next.js
- Static assets on CDN
- Environment-specific configuration
- Preview deployments for each pull request
- Source maps protected appropriately
- Security headers configured

## 16. Deferred architecture

Do not implement until validated:

- remote case marketplace,
- collaborative evidence board,
- multiplayer presence,
- real-time live events,
- procedural dialogue,
- mod sandbox,
- user-authored HTML,
- or native desktop packaging.