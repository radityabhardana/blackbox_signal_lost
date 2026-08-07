# Testing and QA Plan

## 1. Quality objective

The game must be solvable, recoverable, accessible, and internally consistent. A visually impressive interface that loses saves or misleads players unfairly is a failed build.

## 2. Test layers

### Unit tests

Target:

- Rule evaluator
- Case engine
- Search ranking
- Objective transitions
- Outcome evaluation
- Save migrations
- Window geometry
- Board operations
- Content validation

### Component tests

Target:

- Window controls
- Mail interactions
- Search input and results
- Evidence cards
- Hint disclosure
- Conclusion form
- Settings controls
- Notification behavior

### Integration tests

Target:

- Content event causes objective update
- Evidence discovery appears on board
- Dialogue choice unlocks record
- Puzzle result unlocks conclusion
- Save and reload restores complete session

### End-to-end tests

Critical paths:

1. Fresh start to first evidence
2. Correct Case 001 outcome
3. Incorrect suspect outcome
4. Alternate disclosure outcome
5. Reload during each case stage
6. Keyboard-only completion
7. Reduced-motion completion
8. Offline refresh after initial load where supported

### Manual narrative QA

- Timeline consistency
- Character voice
- Search-term discoverability
- Red-herring fairness
- Outcome consequence clarity
- Optional clue discoverability
- Hint escalation quality

## 3. Content validation

Automated checks should detect:

- duplicate IDs,
- missing references,
- unreachable required records,
- impossible objectives,
- trigger cycles,
- outcome conflicts,
- unsupported claim IDs,
- missing hints,
- missing transcripts,
- and missing asset provenance.

### Reachability simulation

A development script should traverse possible event paths with bounded branching to verify:

- every required objective can complete,
- every ending is reachable,
- no branch permanently removes all valid evidence,
- and optional choices do not create accidental dead ends.

This does not replace human playtesting.

## 4. Case 001 test matrix

### Core facts

| Test | Expected |
|---|---|
| Review ferry and emergency-call records | Contradiction trigger fires once |
| Solve replay-signature puzzle | Ferry falsification evidence discovered |
| Review manual escalation | Node 7 motive objective advances |
| Discover isolation event | Meta flag becomes available |
| Submit correct facts with valid evidence | Correct outcome family |
| Accuse Nara without support | Misidentified outcome |
| Reload before report | All selected evidence and board positions restored |

### Choice branches

| Choice | Verification |
|---|---|
| Send tablet to CIAB | Redacted path remains solvable |
| Let Sera inspect offline | Diagnostic note unlocks |
| Give tablet to Pelaga | Optional record removed, core path remains |
| Forward masked contact | Compliance flag set |
| Ask masked contact for proof | Checksum record unlocks |
| Leak archive | Public exposure ending |
| Redact Maya location | Protected-truth ending possible |

## 5. Search QA

Create a query corpus containing:

- exact names,
- surnames,
- aliases,
- common misspellings,
- locations,
- timestamps,
- organizations,
- clue concepts,
- irrelevant queries,
- and blocked early-stage terms.

For each query, define expected:

- results,
- order,
- availability,
- and whether a game event should fire.

## 6. Save QA

Test:

- New save
- Repeated autosave
- Tab close during write
- Previous known-good restore
- Corrupted checksum
- Schema migration
- Content version mismatch
- Missing optional asset
- IndexedDB unavailable
- Storage quota exceeded
- Reset current case
- Clear all local data

Never ship a migration without fixtures from the previous supported version.

## 7. Window-system QA

- Open every app
- Rapid focus switching
- Minimize and restore
- Maximize and unmaximize
- Drag to each viewport edge
- Resize to minimum dimensions
- Browser resize
- Zoom 80–200%
- Refresh with windows open
- Reset layout
- Keyboard switcher
- Screen-reader labels
- Reduced-motion behavior

## 8. Accessibility QA

### Automated

- Semantic roles
- Missing labels
- Contrast
- Invalid ARIA
- Focusable hidden elements
- Heading structure

### Manual

- Keyboard-only playthrough
- Screen-reader smoke test
- Text scale 150%
- Browser zoom 200%
- High contrast
- Reduced motion
- Glitch off
- Captions and transcript completeness
- Color-blind review
- Focus visibility on dark surfaces

## 9. Performance QA

Measure on representative hardware:

- Time to usable landing
- Time to usable workspace
- Open latency for each app
- Search response time
- Evidence-board interaction frame rate
- Phaser module frame rate
- Autosave latency
- Memory after 30- and 60-minute sessions
- Memory after repeatedly opening and closing apps
- Media transfer size per case stage

Investigate:

- leaked listeners,
- orphaned audio,
- background render loops,
- excessive store subscriptions,
- oversized assets,
- and repeated content parsing.

## 10. Browser matrix

| Browser | Priority | Test depth |
|---|---:|---|
| Chrome stable | P0 | Full |
| Edge stable | P0 | Full |
| Firefox stable | P0 | Full |
| Safari stable | P1 | Core path |
| Mobile browsers | P2 | Compatibility notice and landing only |

## 11. Playtest protocol

### Session setup

- Fresh browser profile
- No explanation beyond landing page
- Observer does not help unless the player is blocked
- Record where the player hesitates, not only what they say

### Questions after play

1. What do you believe happened?
2. Which evidence convinced you?
3. Which application felt most useful?
4. Where did you feel lost?
5. Did any clue feel unfair?
6. Did the final choice feel meaningful?
7. What do you think BLACKBOX is doing?
8. Would you play another case?

### Signals

Positive:

- Player states a coherent theory.
- Player cites specific evidence.
- Player uses at least three applications naturally.
- Player notices the difference between confidence and truth.
- Player wants to discuss the ending.

Negative:

- Player solves by random submission.
- Player cannot distinguish records from evidence.
- Player believes a glitch is a real bug.
- Player misses objective updates.
- Player cannot recover windows.
- Player reads everything but performs little deduction.

## 12. Severity definitions

- **Blocker:** Cannot start or complete, save loss, severe accessibility failure
- **Critical:** Wrong outcome, unreachable required evidence, repeated crash
- **Major:** Misleading UI, broken branch, serious performance problem
- **Minor:** Visual inconsistency, nonblocking copy issue
- **Polish:** Small animation, spacing, or sound refinement

## 13. Release checklist

- All P0 backlog items complete
- Full checks pass
- All four endings reachable
- Required evidence has at least one verified path
- No known save-loss issue
- Keyboard-only path complete
- Captions and transcripts present
- Credits and asset provenance complete
- Privacy notice present
- Supported-browser smoke tests pass
- No uncaught console errors in normal play
- Debug flags disabled
- Production source maps and logging reviewed
- Public build tested from a clean URL