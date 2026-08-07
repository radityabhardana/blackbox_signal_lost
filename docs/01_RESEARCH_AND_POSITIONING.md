# Research and Positioning

## 1. Research objective

This research asks:

1. Does an investigation game played through a fictional computer interface have proven appeal?
2. Which mechanics create genuine deduction rather than passive reading?
3. Which scope failures should this project avoid?
4. What makes the concept distinct enough to justify development as a web-first game?

This document extracts reusable design principles. It does not authorize copying protected characters, layouts, dialogue, art, music, or code.

## 2. Reference games

### 2.1 Her Story

**Relevant design:** The player searches a police video database using words found in interview clips. The story is discovered nonlinearly through player curiosity.

**Lesson for BLACKBOX:**

- Search terms can become a meaningful player verb.
- Partial access creates curiosity.
- Nonlinear discovery works when every fragment contains multiple semantic hooks.
- The interface should allow players to form their own investigation path.

**Do not copy:**

- Live-action interview presentation
- Exact database layout
- Character premise
- Search-result restrictions

### 2.2 Orwell: Keeping an Eye On You

**Relevant design:** Investigation, surveillance, and selected pieces of personal data affect the story and ending.

**Lesson for BLACKBOX:**

- Choosing which information becomes “official” can be more powerful than simply finding information.
- Contradictory records create ethical tension.
- Consequences should come from what the player submits, withholds, or interprets.
- The game should avoid a visible good-versus-evil meter.

**Do not copy:**

- Political setting
- Branding
- Data-chunk presentation
- Plot structure

### 2.3 The Operator

**Relevant design:** Crimes are investigated through specialized software while the player assists field agents.

**Lesson for BLACKBOX:**

- A complete detective fantasy can be delivered through UI.
- Tools should have distinct investigative purposes.
- Calls and messages can create urgency without an action character.
- Interfaces must remain fast and readable because friction directly affects pacing.

**Risk observed in reviews and discussion:**

- Apparent choices may feel weak when outcomes are too predetermined.
- Tools feel underused when they appear only once.

**Response in BLACKBOX:**

- Every core tool must recur at least three times in the vertical slice.
- The conclusion form requires player-selected claims and evidence.
- At least one major outcome must depend on a prior discretionary choice.

### 2.4 Hypnospace Outlaw

**Relevant design:** A fictional operating system and internet are explored as a coherent cultural world.

**Lesson for BLACKBOX:**

- Fake websites and software can carry worldbuilding more efficiently than exposition.
- Imperfect, personal, and inconsistent pages make a digital world feel inhabited.
- Music, advertisements, local slang, and low-stakes personal content create authenticity.
- The operating system should contain optional discoveries unrelated to the main answer.

**Scope warning:**

A simulated internet can expand without limit. Public discussion around an over-scoped follow-up project illustrates the danger of trying to build an entire fictional platform before proving the core case loop.

**Response in BLACKBOX:**

- Only build pages required by cases or worldbuilding goals.
- No user-generated website editor.
- No complete social network simulation.
- Every optional page must serve character, clue, atmosphere, or foreshadowing.

### 2.5 Papers, Please

**Relevant design:** Repetitive document inspection becomes tense through accumulating rules, time pressure, personal consequences, and moral dilemmas.

**Lesson for BLACKBOX:**

- Routine interface work becomes dramatic when rules and stakes evolve.
- Pressure should come from narrative context, not arbitrary timers everywhere.
- A player can understand systemic harm through ordinary administrative actions.
- Simple inputs can support complex emotional decisions.

**Response in BLACKBOX:**

- Use deadlines only in specific sequences.
- Let “submit report,” “flag person,” and “release evidence” carry consequences.
- Increase procedural complexity across cases, not inside the tutorial.

### 2.6 Telling Lies

**Relevant design:** Players search recorded conversations and reconstruct a linked story.

**Lesson for BLACKBOX:**

- Media fragments need emotional context, not only puzzle utility.
- Searching should reveal human relationships alongside plot facts.
- The player’s perceived truth can remain partly interpretive while objective case facts stay internally consistent.

### 2.7 Do Not Feed the Monkeys

**Relevant design:** Multiple surveillance feeds compete for attention while the player chooses whether to observe or intervene.

**Lesson for BLACKBOX:**

- Parallel information channels create tension.
- Observation should create temptation to interfere.
- Limited attention can be more interesting than a generic countdown.
- Optional intervention paths make surveillance morally uncomfortable.

## 3. Synthesis

BLACKBOX should combine five proven strengths:

| Strength | Implementation |
|---|---|
| Player-driven discovery | Search, filters, cross-references, optional records |
| Diegetic interface | Desktop OS, apps, notifications, calls |
| Verifiable deduction | Evidence graph and structured conclusion report |
| Ethical consequence | Submit, withhold, disclose, or protect information |
| Distinct digital culture | Fictional Nusakara civic network, local brands, transit, weather, slang |

## 4. Product positioning

### Category

**Web-first diegetic investigation game**

### Positioning statement

For players who enjoy detective games but want more agency than a visual novel, BLACKBOX is an interactive investigation operating system in which searching, organizing, and submitting data directly shapes the story. Unlike a generic hacker-themed puzzle game, it focuses on institutional truth, human consequences, and a specific fictional coastal city.

### Distinguishing elements

1. Southeast Asian-inspired near-future coastal setting without directly recreating a real government.
2. A clean civic interface that visibly degrades as suppressed data emerges.
3. A conclusion system based on claim-evidence pairs.
4. Local-first browser play with no mandatory account.
5. Cases designed as reusable content packages.
6. Ethical ambiguity without a morality score.

## 5. Theme validation

The theme fits the mechanics because:

- The story concerns control of information.
- The player interacts almost entirely through information systems.
- Visual corruption represents the system losing control of its own narrative.
- Audio interruptions simulate institutional pressure.
- Asset limitations become an aesthetic advantage: documents, portraits, maps, and short loops are sufficient.
- The player’s final report literally determines which truth enters the archive.

## 6. Risks and countermeasures

| Risk | Countermeasure |
|---|---|
| Too much reading | Alternate text with search, linking, media inspection, calls, and deduction |
| Fake complexity | Every app must support a repeated player decision |
| Puzzle frustration | Hint ladder, objective clarity, no external knowledge |
| Scope explosion | One city district and one complete case first |
| Interface feels like work | Strong feedback, discovery rewards, short tasks, emotional interruptions |
| Story feels predetermined | Branch at report choices and discretionary disclosures |
| Cyberpunk cliché | Civic-infrastructure aesthetic, monsoon city, public-service language, restrained neon |
| AI-generated asset inconsistency | Art bible, reference sheets, fixed palettes, manual review |
| Browser performance | Route splitting, lazy media, optimized images, bounded window count |

## 7. Research sources

Access dates should be recorded when implementation begins.

- Her Story official site: https://www.herstorygame.com/
- Her Story publisher page: https://playism.com/en/game/her-story/
- Orwell Steam page: https://store.steampowered.com/app/491950/Orwell_Keeping_an_Eye_On_You/
- The Operator Steam page: https://store.steampowered.com/app/1771980/The_Operator/
- GameDeveloper article on The Operator’s UI-based design: https://www.gamedeveloper.com/design/the-operator-is-a-crime-solving-game-delivered-entirely-with-ui
- Hypnospace Outlaw store description: https://www.xbox.com/en-us/play/games/hypnospace-outlaw/9pm3nvb3pxg0
- Papers, Please official site: https://papersplea.se/
- Telling Lies publisher page: https://annapurnainteractive.com/en/games/telling-lies
- Do Not Feed the Monkeys Steam page: https://store.steampowered.com/app/658850/Do_Not_Feed_the_Monkeys/
- Phaser official documentation: https://docs.phaser.io/
- Next.js App Router documentation: https://nextjs.org/docs/app
- React Flow documentation: https://reactflow.dev/
- Supabase documentation: https://supabase.com/docs

## 8. Research conclusion

The concept is viable, but only if the project treats **deduction as a system** rather than decorating a linear story with computer windows. The vertical slice must prove:

1. Searching feels rewarding.
2. Evidence linking helps reasoning.
3. The conclusion form reflects the player’s interpretation.
4. The interface creates atmosphere without causing confusion.
5. The first case leaves one larger mystery unresolved.