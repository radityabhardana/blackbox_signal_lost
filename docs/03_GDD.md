# Game Design Document

## 1. Game identity

| Field | Definition |
|---|---|
| Title | BLACKBOX: Signal Lost |
| Genre | Interactive detective, narrative puzzle, diegetic OS simulator |
| Platform | Desktop web |
| Mode | Single-player |
| Perspective | First-person through an investigation workstation |
| Setting | Near-future fictional coastal megacity, Nusakara |
| Core fantasy | Be the analyst who turns fragmented data into an official truth |
| Core tension | The system that provides evidence may also manipulate it |

## 2. Player verbs

The primary player verbs are:

- Open
- Search
- Filter
- Inspect
- Compare
- Tag
- Connect
- Ask
- Verify
- Submit
- Withhold
- Disclose

No core interaction should exist merely for decoration. Each application must support at least one primary verb.

## 3. Core gameplay loop

```text
Receive a case or update
    ↓
Inspect available records
    ↓
Search for people, places, events, or terms
    ↓
Discover evidence and contradictions
    ↓
Cross-reference timeline and relationships
    ↓
Communicate with field contacts
    ↓
Build a hypothesis on the evidence board
    ↓
Unlock new records or tools
    ↓
Submit an evidence-backed conclusion
    ↓
Observe narrative and institutional consequences
```

## 4. Experience pillars

### 4.1 Discovery through curiosity

Players should regularly ask:

- “What happens if I search this name?”
- “Why do these timestamps disagree?”
- “Who benefits if this record is accepted?”
- “Why did the system hide this result?”

### 4.2 Deduction with proof

The game distinguishes:

- **Discovery:** finding information
- **Inference:** interpreting information
- **Proof:** selecting evidence that supports a claim

A correct suspect with unsupported evidence is not a complete solution.

### 4.3 Diegetic usability

The interface should feel like software used by characters in the world, but it must still provide:

- clear navigation,
- readable information hierarchy,
- recoverable mistakes,
- and accessible controls.

### 4.4 Ethical ambiguity

The game does not award “good” or “evil” points. Outcomes emerge from:

- who is exposed,
- who is protected,
- which records are submitted,
- and whether the player follows institutional instructions.

## 5. Core systems

### 5.1 Desktop and window system

Purpose: Allow parallel investigation.

Rules:

- Multiple applications may remain open.
- Active window appears above others.
- Important calls can request focus but cannot steal input unexpectedly.
- Window positions persist in the save.
- A “reset layout” command recovers lost windows.

### 5.2 Case engine

Purpose: Determine progression from authored content and player events.

Inputs:

- discovered evidence,
- read records,
- sent replies,
- linked evidence,
- solved puzzles,
- elapsed narrative stage,
- submitted report fields.

Outputs:

- unlock content,
- trigger messages,
- update objectives,
- enable tools,
- set flags,
- choose outcomes.

The engine must be deterministic.

### 5.3 Search system

Search is an investigative mechanic, not a global developer search.

Each searchable record has:

- indexed terms,
- aliases,
- hidden terms,
- availability conditions,
- source classification,
- confidence label,
- and related entities.

Search behavior:

1. Normalize case and punctuation.
2. Match authored keywords and aliases.
3. Respect progression gates.
4. Return results ranked by authored relevance.
5. Record the query as a game event when it matters.
6. Suggest corrections only for known in-world terms.

The search system must not use an external search engine.

### 5.4 Evidence system

Evidence types:

- document
- image
- audio
- video loop
- database record
- location record
- message
- system log
- physical-object report
- testimony

Evidence states:

```text
unknown → discovered → reviewed → tagged → used_in_report
```

Optional flags:

- contested
- corrupted
- red_herring
- suppressed
- verified

### 5.5 Evidence board

The board helps thinking but does not automatically solve the case.

Features:

- Evidence nodes
- Person and location nodes
- Custom labels
- Connections
- Grouping
- Private notes
- Pinning
- Search and focus
- Save and restore
- Optional auto-arrange

Rules:

- Player-created links are not automatically considered true.
- Authored “verified relationships” may appear only after sufficient evidence.
- The game may recognize a small number of meaningful combinations to trigger observations.

### 5.6 Communication system

Channels:

- Secure text
- Voice call with captions
- Automated system message
- Field-agent report
- Anonymous contact

Choices may affect:

- trust,
- urgency,
- available evidence,
- and ending context.

Dialogue should not become a conventional relationship meter.

### 5.7 Objective system

Objectives are written as investigative intentions:

Good:

- Verify Maya’s final known location.
- Identify who accessed Node 7 after curfew.
- Determine why the transit log was altered.

Bad:

- Click the third email.
- Search “node seven.”
- Choose Reno as the suspect.

### 5.8 Puzzle system

Puzzle categories:

- Timeline reconstruction
- Signal-path routing
- Metadata comparison
- Pattern restoration
- Authentication-sequence inference
- Audio-layer isolation
- Document discrepancy
- Map triangulation

All puzzles are fictional abstractions. The game must not teach realistic intrusion or credential theft.

### 5.9 Hint system

Four levels:

1. **Refocus:** restates the current question.
2. **Direction:** identifies the relevant application or evidence category.
3. **Connection:** names two records that should be compared.
4. **Answer path:** explains the next concrete step.

Hint use does not reduce score because there is no public score in the MVP.

### 5.10 Conclusion system

The final report contains structured slots:

- What happened?
- Who caused it?
- What was the motive or system cause?
- Which three pieces of evidence support this?
- Which information should be disclosed?
- Who should receive the unredacted report?

Evaluation uses authored rules:

- factual accuracy,
- evidence validity,
- contradiction penalties,
- discretionary choice flags.

### 5.11 Save system

Save contents:

- content version
- save schema version
- current case
- player events
- discovered evidence
- objective state
- application states
- board nodes and edges
- settings
- outcome flags

Autosave triggers:

- evidence discovery
- objective completion
- message choice
- puzzle completion
- report submission
- periodic idle debounce

## 6. Difficulty model

Difficulty comes from:

- number of records,
- ambiguity,
- cross-application dependencies,
- timing contradictions,
- and plausible alternative explanations.

Difficulty must not come from:

- unreadably small text,
- arbitrary code guessing,
- obscure external trivia,
- fake UI latency,
- hidden click targets,
- or one-chance irreversible actions without warning.

## 7. Pacing

### Phase 1: Orientation

- Learn the desktop
- Receive a simple task
- Find the first obvious contradiction

### Phase 2: Expansion

- Unlock database search
- Meet field contact
- Discover multiple plausible explanations

### Phase 3: Pressure

- Receive institutional instruction
- Decide whether to disclose or suppress a record
- Solve one time-sensitive sequence

### Phase 4: Synthesis

- Organize evidence
- Submit conclusion
- Observe outcome

### Phase 5: Hook

- A hidden system log implies BLACKBOX influenced the case
- Demo ends with an unresolved signal

## 8. Failure and recovery

There is no conventional game over in Case 001.

Possible failure-like states:

- Incorrect conclusion
- Correct conclusion with weak evidence
- Institutional compliance ending
- Unauthorized disclosure ending
- Case unresolved

The player may review the outcome and restart from the pre-report checkpoint.

## 9. Replayability

Replay value comes from:

- alternate disclosure decisions,
- optional records,
- different dialogue responses,
- outcome variations,
- and hidden system anomalies.

Do not pad replayability with random evidence placement.

## 10. Scoring

No public numerical score in MVP.

Internal playtest telemetry may track:

- completion time,
- hints,
- wrong submissions,
- missed optional evidence,
- search queries,
- and abandoned objectives.

## 11. Tutorial philosophy

Teach through a low-stakes assignment inside the fiction:

1. Open a message.
2. Search one record.
3. Inspect one attachment.
4. Pin evidence.
5. Submit a harmless verification.

Avoid large tutorial overlays. Tooltips should be dismissible and recallable from Help.

## 12. Content quality rules

- Every required clue has at least two discovery paths when practical.
- Every major deduction uses at least two records.
- Every suspect has motive, opportunity, or misleading evidence—but not all three without explanation.
- Every red herring has a fair disconfirmation.
- Every case includes one human consequence beyond “catch the culprit.”
- Every case advances the BLACKBOX meta-mystery.