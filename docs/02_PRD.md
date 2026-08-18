# Product Requirements Document

## 1. Product overview

### Product name

**BLACKBOX: Signal Lost**

### Product type

Web-first single-player narrative investigation game.

### Product vision

Create an investigation experience in which the browser becomes a fictional civic-analysis operating system. Players solve cases by searching records, inspecting media, cross-referencing timelines, communicating with field personnel, and submitting evidence-backed conclusions.

### Product objective

Validate that a polished, complete case can deliver:

- Strong detective fantasy
- Meaningful player agency
- Clear deduction
- Memorable atmosphere
- A scalable content framework

## 2. Problem statement

Many narrative detective games either:

- reduce interaction to dialogue choices,
- hide solutions behind pixel hunting,
- make the player follow a predetermined sequence,
- or present “hacking” as disconnected mini-games.

BLACKBOX should make information handling itself the gameplay while still providing structured deductions and visible consequences.

## 3. Target users

### Primary persona: The Pattern Seeker

- Enjoys mystery, conspiracy fiction, and connecting clues
- Comfortable with desktop interfaces
- Likes taking notes and exploring optional information
- Values “I figured it out” moments
- Dislikes arbitrary hidden-object logic

### Secondary persona: The Narrative Explorer

- Primarily motivated by characters and atmosphere
- May use hints
- Wants choices that affect relationships and outcomes
- Does not require extremely difficult puzzles

### Excluded initial audience

- Players seeking reflex-heavy action
- Mobile-only users
- Competitive multiplayer players
- Players expecting an open-world city

## 4. Jobs to be done

The product should let players:

1. Feel like a competent remote investigator.
2. Discover a story in a personal order.
3. Build and test hypotheses.
4. Decide what information to trust.
5. Experience consequences for official reports.
6. Explore a convincing fictional digital city.

## 5. Scope

### MVP / vertical slice

- Boot and login fiction
- Desktop shell
- Window manager
- Secure mail
- Messenger / field-agent communication
- Citizen and organization database
- Evidence viewer
- Search
- Evidence board
- Objective tracker
- Notification system
- Audio manager
- Local save
- Conclusion report
- Case 001
- Settings and accessibility basics
- Credits and source acknowledgments

### Post-vertical-slice candidates

- CCTV multi-feed module
- City map
- Cloud save
- Account system
- Achievements
- Additional cases
- Optional PWA installation
- Case-authoring validation tools
- Localization pipeline (delivered — see ADR-034)

### Explicitly out of scope

- Multiplayer
- User-generated cases
- Open-world movement
- 3D exploration
- Realistic hacking simulation
- Runtime AI-generated dialogue
- Voice acting for every line
- Live-service daily cases
- Leaderboards
- Player trading or economy

## 6. Functional requirements

### FR-001: Boot sequence

The product shall present a skippable, accessible boot sequence that establishes the BLACKBOX system and leads to the analyst workspace.

### FR-002: Guest play

The product shall allow the vertical slice to be played without creating an account.

### FR-003: Desktop shell

The product shall support opening, focusing, moving, minimizing, restoring, maximizing, and closing application windows.

### FR-004: Application state

Closing or minimizing an application shall not unintentionally erase player progress inside that application.

### FR-005: Case content loading

The product shall load a case from validated structured content.

### FR-006: Search

The player shall be able to search indexed records. Search results shall be determined by authored metadata and progression rules.

### FR-007: Evidence discovery

The system shall record discovered evidence and display its source and timestamp.

### FR-008: Evidence board

The player shall be able to place evidence nodes, connect them, add private notes, and restore the board after reload.

### FR-009: Objectives

Objectives shall update from deterministic game events and avoid exposing hidden answers.

### FR-010: Communication

Messages and calls shall be triggered by progression conditions and player choices.

### FR-011: Conclusion report

The player shall submit:

- event sequence,
- responsible party,
- motive or cause,
- supporting evidence,
- and one discretionary disclosure decision.

### FR-012: Outcomes

The system shall evaluate the report against authored rules and produce an ending state.

### FR-013: Save system

Progress shall autosave locally and support manual restart of the current case.

### FR-014: Hint system

Hints shall use an escalating ladder and never reveal more than the next needed reasoning step unless the player requests stronger help.

### FR-015: Settings

The product shall expose volume, text scale, contrast, reduced motion, subtitle, and effect-intensity settings.

## 7. Nonfunctional requirements

### Performance

- Desktop shell should become usable quickly on a normal broadband connection.
- Heavy applications and case media must be lazy-loaded.
- The game must remain responsive with at least eight open windows.
- Autosave must not visibly block interaction.
- Media failures must degrade gracefully.

### Accessibility

- Keyboard navigation for all critical actions
- Visible focus states
- Reduced-motion support
- Captions and transcripts for audio evidence
- No clue encoded only through color
- Text scaling without breaking core layouts
- Adjustable glitch intensity

### Reliability

- Save snapshots are versioned.
- Interrupted writes do not destroy the previous valid save.
- Content validation fails with actionable development errors.
- A player can recover off-screen windows.

### Privacy

- Guest mode collects no identity information.
- Analytics are optional and aggregate.
- Cloud features require explicit consent.
- No service credentials are exposed client-side beyond public keys designed for browser use.

## 8. User journey

```text
Landing page
  → Start investigation
  → BLACKBOX boot
  → Analyst onboarding
  → Receive Case 001
  → Inspect initial records
  → Discover contradiction
  → Unlock additional application
  → Communicate with field agent
  → Build evidence board
  → Submit conclusion
  → Receive case outcome
  → Discover BLACKBOX anomaly
  → End-of-demo screen
```

## 9. Success metrics

### Vertical-slice validation metrics

- At least 70% of playtesters complete the case without external help.
- At least 60% correctly identify the primary factual cause.
- At least 80% understand how to open and manage applications.
- Fewer than 15% become blocked by interface confusion.
- At least 50% inspect optional worldbuilding content.
- At least 60% express interest in another case.
- Median hint use does not exceed the first two hint tiers.
- No critical save-loss bug in milestone testing.

These are validation targets, not promises.

## 10. Product constraints

- Solo or very small team
- AI-assisted implementation
- Limited custom animation
- Browser memory and loading constraints
- Content production is likely the long-term bottleneck
- Art consistency must be maintained across generated and manually edited assets

## 11. Release strategy

### Stage A: Internal prototype

Prove desktop, search, evidence discovery, and save.

### Stage B: Closed vertical-slice test

Test the complete Case 001 with invited players.

### Stage C: Public web demo

Release a polished case with no account requirement.

### Stage D: Production decision

Continue only if completion, comprehension, interest, and development-cost signals are positive.

## 12. Acceptance criteria for the vertical slice

The vertical slice is approved when:

- A new player completes the full case from a fresh browser profile.
- Every required conclusion is supported by accessible evidence.
- At least two outcomes are visibly different.
- The player can reload after each major progression stage.
- All critical actions are keyboard accessible.
- There are no uncaught errors in the supported browsers.
- The interface maintains the selected visual direction.
- The final reveal creates interest in the larger BLACKBOX mystery.