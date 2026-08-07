# UI/UX Specification

## 1. UX goals

The interface must make players feel capable, curious, and slightly monitored.

Priority order:

1. Comprehension
2. Control
3. Deduction
4. Atmosphere
5. Spectacle

## 2. Information architecture

```text
Public landing
├── Start investigation
├── Continue
├── Settings
├── Accessibility
└── Credits

BLACKBOX workspace
├── Desktop
├── Taskbar
├── Notification center
├── Case status
└── Applications
    ├── Secure Mail
    ├── Messenger
    ├── Records
    ├── Transit Archive
    ├── Evidence Board
    ├── Signal Analyzer
    ├── Timeline
    ├── Conclusion Report
    ├── Help
    └── Settings
```

## 3. Responsive policy

### Primary support

- Desktop and laptop widths: 1280 px and above
- Functional minimum: 1024 × 640

### Limited support

- Tablets may display a single-window layout.
- Mobile phones receive a clear notice that the full game requires a larger display.
- Do not spend vertical-slice scope on a full mobile redesign.

## 4. Landing page

Required elements:

- Game title
- One-sentence premise
- Start / Continue
- Settings
- Headphone recommendation, not requirement
- Browser-support message
- Content notice
- Credits

The landing page should load before heavy game assets.

## 5. Boot sequence

Sequence:

1. BLACKBOX mark
2. Secure environment check
3. Analyst session allocation
4. Brief system anomaly
5. Workspace

Requirements:

- Skippable after first view
- Reduced-motion alternative
- Maximum perceived delay kept short
- No fake loading longer than real initialization

## 6. Desktop shell

### Taskbar

Contains:

- Application launcher
- Open application indicators
- Case status
- System time
- Notification center
- Settings shortcut

### Window behavior

- Click brings to front.
- Drag by title bar.
- Resize through visible handles.
- Double-click title bar toggles maximize.
- `Esc` closes modal, not application.
- `Alt+Tab` or custom accessible switcher cycles applications.
- Window positions are clamped to the viewport.
- “Reset workspace” restores a safe layout.
- Application state survives minimize.

### Window states

- closed
- opening
- normal
- focused
- unfocused
- minimized
- maximized
- error
- loading

## 7. Secure Mail

### Inbox columns

- Unread
- Sender
- Subject
- Case label
- Time
- Trust classification

### Message view

- Sender identity
- Timestamp
- Source channel
- Body
- Attachments
- Related entities
- Pin-to-board action
- Mark / tag
- Reply choices when available

### Empty and error states

- No messages
- Attachment unavailable
- Record withheld
- Connection interrupted

## 8. Records application

### Search bar

Supports:

- Names
- Aliases
- Locations
- Dates and times
- Organizations
- Authored concepts

### Results

Each result shows:

- title,
- record type,
- date,
- source,
- revision status,
- confidence label,
- and short excerpt.

Confidence labels indicate system confidence, not objective truth.

### Record detail

- Full content
- Metadata
- Revision history
- Related records
- Evidence discovery action
- Source warning
- Print/export is fictional only

## 9. Messenger

Features:

- Channel list
- Message thread
- Connection status
- Typing state
- Choice responses
- Transcript for calls
- Attachment sharing
- Trust conveyed through writing and behavior, not a numeric bar

Choices should be concise and materially different.

## 10. Evidence Board

### Canvas behavior

- Pan
- Zoom
- Drag nodes
- Multi-select
- Connect
- Delete player-created edge
- Add note
- Group
- Search
- Focus selected
- Auto-arrange
- Undo/redo for board edits

### Node types

- Evidence
- Person
- Location
- Event
- Organization
- Player note

### Edge types

- related
- contradicts
- supports
- occurred_at
- communicated_with
- player_custom

The first five may be player labels; only verified authored relationships receive a system verification marker.

## 11. Timeline

- Horizontal or vertical chronological view
- Authored event timestamps
- Player-added inferred events
- Contradictions visibly marked
- Timezone always explicit
- Unknown ranges represented honestly

## 12. Signal Analyzer

For Case 001, it compares event signatures.

Interaction flow:

1. Choose reference event.
2. Choose disputed event.
3. Inspect four metadata layers.
4. Mark mismatches.
5. Submit authenticity assessment.

Accessibility:

- Every visual waveform has a textual or tabular equivalent.
- Audio differences have captions and descriptors.
- No conclusion depends only on pitch perception.

## 13. Objective tracker

Shows:

- active objective,
- optional objective,
- completed objective,
- available hint,
- and current case phase.

It should not reveal exact search terms or answers unless a high-tier hint is requested.

## 14. Notifications

Priority:

- Informational
- Discovery
- Message
- Urgent
- System anomaly

Rules:

- Stack safely.
- Do not cover conclusion controls.
- Remain available in history.
- Urgent notifications may pulse but not flash repeatedly.
- Screen-reader announcement priority must match severity.

## 15. Conclusion report

### Layout

- Left: claims
- Center: selected answer or timeline
- Right: evidence slots
- Bottom: disclosure and recipient
- Final review modal

### Submission safeguards

- Warn if evidence slots are empty.
- Explain that submission changes the case.
- Create a pre-submission checkpoint.
- Allow review before final confirmation.
- Do not reveal correctness immediately through green/red form controls.

## 16. Hint UX

- Hint button near objective, not hidden in settings.
- First hint available without penalty.
- Show hint strength before revealing it.
- Allow reviewing previous hints.
- Do not auto-display hints based solely on elapsed time.

## 17. Accessibility behaviors

- Full keyboard path
- Semantic controls
- Focus trap only inside true modals
- Screen-reader labels for icons
- Text scaling presets: 100%, 115%, 130%, 150%
- High-contrast mode
- Reduced-motion mode
- Glitch intensity: full, reduced, off
- Captions on by default for evidence audio
- Board list view as an alternative to the spatial canvas

## 18. Onboarding checklist

A player should learn the following without leaving the fiction:

- Open an app
- Move or switch windows
- Read a message
- Open an attachment
- Search a record
- Pin evidence
- Connect two nodes
- Use a hint
- Save is automatic
- Submit a conclusion

## 19. UX anti-patterns to avoid

- Long unskippable boot sequences
- Fake command-line typing
- Tiny text for “authenticity”
- Hover-only essential controls
- Hidden objective updates
- Windows opening off screen
- Unclear distinction between player notes and verified facts
- Punishing experimentation
- Notifications that steal keyboard focus
- Mandatory account creation before play