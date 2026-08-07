# Art and Audio Direction

## 1. Creative direction

BLACKBOX should look like a civic system built to appear trustworthy, not a generic neon hacker terminal.

The aesthetic begins as:

- clean,
- institutional,
- efficient,
- pale,
- grid-aligned,
- and reassuring.

As the player uncovers suppressed information, the system reveals:

- analog noise,
- ghosted timestamps,
- incorrect alignment,
- warm warning tones,
- duplicate records,
- and subtle visual instability.

The corruption is narrative evidence, not constant decoration.

## 2. Visual thesis

> A public-service interface designed to inspire trust, slowly exposing the scars of the city and the bias of the system beneath it.

## 3. Setting influence

Nusakara’s visual identity should appear through:

- monsoon rain,
- flood-depth markers,
- sea-wall diagrams,
- ferry and elevated-transit iconography,
- dense mixed-age infrastructure,
- civic signage,
- repair labels,
- public weather alerts,
- tropical night reflections,
- and locally flavored fictional brands.

Avoid an undifferentiated Western cyberpunk city.

## 4. Color system

Use semantic design tokens rather than arbitrary colors.

### Foundation palette

| Token | Purpose | Suggested character |
|---|---|---|
| `--bbx-bg-0` | Deep workspace background | near-black blue-gray |
| `--bbx-bg-1` | Window background | cool charcoal |
| `--bbx-surface-1` | Primary panel | desaturated slate |
| `--bbx-surface-2` | Elevated panel | slightly lighter slate |
| `--bbx-text-1` | Primary text | soft white |
| `--bbx-text-2` | Secondary text | cool gray |
| `--bbx-accent-civic` | Normal actions | restrained cyan |
| `--bbx-accent-signal` | Discovery and links | amber |
| `--bbx-danger` | Critical state | warm red |
| `--bbx-suppressed` | Hidden/system anomaly | muted magenta |
| `--bbx-success` | Verified evidence | desaturated green |

Do not use saturated neon everywhere. Bright color should signal interaction or narrative change.

## 5. Typography

### UI sans

Requirements:

- Highly readable
- Broad character support
- Clear numerals and timestamps
- Distinct `I`, `l`, and `1`

Suggested open-source families:

- Inter
- IBM Plex Sans
- Atkinson Hyperlegible for accessibility option

### Monospace

Use for:

- system logs,
- metadata,
- checksums,
- timestamps,
- and fictional protocols.

Suggested:

- IBM Plex Mono
- JetBrains Mono

### Rules

- Body text should not imitate tiny retro terminals.
- Long narrative text uses comfortable line height.
- All-caps reserved for compact labels and warnings.
- Do not encode importance using font size alone.

## 6. Layout language

- 8-point spacing grid
- Thin separators
- Rounded corners used sparingly
- Clear alignment
- Moderate information density
- Persistent timestamps and source labels
- Status bars that feel procedural
- Windows should look related but not identical

## 7. Application identities

### Secure Mail

- Clean list hierarchy
- Institutional blue-gray
- Attachment cards
- Clear sender trust labels

### Messenger

- More human
- Softer spacing
- Distinct channel identity
- Typing and connection state
- Optional waveform during calls

### Records

- Structured
- Search-first
- Dense metadata
- Source confidence and revision history

### Evidence Board

- Dark canvas
- Amber connections
- Evidence thumbnails
- Handwritten-feeling private notes without sacrificing readability

### Signal Analyzer

- Technical but fictional
- Layered waveforms
- Comparison panels
- No realistic exploit commands

### System Log

- Monospace
- Minimal color
- Anomalies indicated by spacing, duplication, and hidden source tags

## 8. Visual progression

### Stage 1

- Stable grid
- Clean transitions
- Minimal noise
- Civic cyan accent

### Stage 2

- Amber evidence pulses
- Occasional duplicated timestamp
- Subtle scan artifact on suppressed records

### Stage 3

- Misaligned redaction bars
- Short magenta ghost frames
- BLACKBOX messages appear before notification sounds

### Ending

Visual treatment reflects outcome:

- Compliance: interface becomes exceptionally clean
- Protected truth: warm amber remains
- Public exposure: windows desynchronize briefly
- Misidentification: evidence board links fade except contradictions

## 9. Character portraits

Recommended production method:

- Stylized illustrated busts or photo-collage portraits
- Consistent three-quarter framing
- Neutral background tied to organization
- Limited animation: blink, subtle parallax, transmission artifact
- No need for full lip sync

Portrait sheet must define:

- face shape,
- age range,
- hair,
- clothing,
- organization marker,
- expression set,
- lighting direction,
- and palette.

## 10. Environmental assets

Use still images with layered motion:

- rain overlay,
- light flicker,
- moving transit line,
- distant maintenance drone,
- screen reflection,
- subtle camera sway.

This creates atmosphere without the cost of full animated scenes.

## 11. Iconography

- Use a unified stroke width.
- Prefer functional civic symbols.
- Avoid skulls, anonymous masks, and cliché hacker imagery.
- Every icon must have a label or accessible name.
- App icons should remain recognizable at 24 px.

## 12. Motion design

### Normal motion

- 120–220 ms for window interactions
- Decelerating open
- Fast focus transition
- Subtle notification slide
- Evidence discovery uses one controlled pulse

### Narrative anomaly motion

- Brief frame duplication
- Timestamp jump
- 1–2 px displacement
- Masked text reveal
- Audio-visual desynchronization

Rules:

- Reduced-motion mode removes displacement and uses fades.
- No essential clue appears only for a fraction of a second.
- No sustained screen shaking.
- Avoid constant scanlines.

## 13. Audio direction

### Sound world

- rain against glass,
- distant transit,
- cooling systems,
- network relay clicks,
- restrained notification tones,
- low electrical hum,
- and brief emergency announcements.

### Music

Use adaptive layers:

1. Neutral investigation bed
2. Discovery layer
3. Pressure pulse
4. BLACKBOX anomaly texture
5. Ending variation

Music must support concentration and never overpower speech or evidence audio.

### UI sounds

Each application family should have related but distinct sounds.

- Mail: soft two-tone chime
- Messenger: short tactile ping
- Evidence: dry magnetic click
- Verified connection: subtle harmonic confirmation
- Error: low, non-punitive tone
- BLACKBOX anomaly: reversed fragment of the normal system chime

## 14. Asset consistency rules

For every generated or commissioned asset:

- Match the palette.
- Match the lighting direction.
- Match the camera and crop rules.
- Avoid embedded text unless manually typeset.
- Remove inconsistent logos.
- Record provenance.
- Review for accidental resemblance to real brands or public figures.
- Export optimized web versions and retain a source master.

## 15. Prohibited visual shortcuts

- Matrix-style falling code
- Excessive green terminal text
- Random hex strings as decoration
- Unreadable glitch overlays
- Stock cyberpunk city art without Nusakara context
- Unlicensed real CCTV footage
- Real corporate or government branding
- AI image outputs used without consistency review