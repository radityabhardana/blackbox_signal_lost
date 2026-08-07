# Asset Manifest and Production Plan

## 1. Asset policy

Every asset requires:

- stable ID,
- owner or creator,
- source,
- license,
- creation method,
- editable source file,
- optimized export,
- alt text or transcript where applicable,
- and approval status.

No asset enters production merely because it “looks cool.”

## 2. Production categories

### A. Brand and system

| Asset | Quantity | Priority |
|---|---:|---:|
| BLACKBOX wordmark | 1 | P0 |
| BLACKBOX symbol | 1 | P0 |
| CIAB identity | 1 set | P1 |
| Pelaga Systems identity | 1 set | P1 |
| NTA identity | 1 set | P1 |
| Open Signal identity | 1 set | P2 |
| Boot marks and status glyphs | 1 set | P1 |

### B. Application icons

Required:

- Mail
- Messenger
- Records
- Evidence Board
- Signal Analyzer
- Timeline
- Conclusion
- Help
- Settings
- Notification Center

Provide:

- 16 px
- 24 px
- 32 px
- 64 px
- SVG master where possible

### C. Characters

Case 001:

- Maya Pranata
- Sera Wibawa
- Reno Adikara
- Nara Santoso
- Adrian Vale
- Hana Idris

For each:

- neutral portrait
- one alternate expression
- organization/background variant
- transmission/glitch version
- alt description

### D. Locations

Case 001:

- North Barrier exterior
- Node 7 maintenance corridor
- Meridian ferry gate
- Pelaga office exterior
- Repair shelter
- CIAB remote operations room
- Nusakara district map

Recommended style:

- illustrated photo-collage,
- cinematic still,
- layered rain and light animation,
- 16:9 master plus cropped thumbnails.

### E. Evidence

- Ferry departure record
- Emergency call metadata
- Node 7 schematic
- Maintenance escalation
- Corridor access log
- Damaged tablet
- Diagnostic note
- Reno internal message
- BLACKBOX isolation log
- Checksum record
- Shelter photo

Each evidence asset requires a readable text equivalent.

### F. Motion

- Boot sequence
- Window open/close
- Notification arrival
- Evidence discovery
- Verified relationship
- System anomaly
- End-of-case transition
- Two CCTV/environment loops

### G. Audio

| ID family | Description |
|---|---|
| `aud_ui_*` | General interface sounds |
| `aud_mail_*` | Mail actions |
| `aud_msg_*` | Messages and calls |
| `aud_ev_*` | Evidence discovery and linking |
| `aud_sys_*` | BLACKBOX system cues |
| `aud_amb_*` | Rain, transit, machinery |
| `aud_music_*` | Adaptive score layers |
| `aud_voice_*` | Limited recorded lines if produced |

## 3. Asset style prompts

These are internal direction prompts, not final asset acceptance criteria.

### Character portrait direction

```text
Near-future civic investigation character portrait, Southeast Asian coastal
megacity influence, restrained utilitarian clothing, three-quarter bust,
neutral dark slate background, cool soft key light from upper left, warm
practical rim light, realistic but slightly graphic editorial illustration,
consistent facial proportions, no embedded text, no neon hacker clichés.
```

### North Barrier direction

```text
Massive coastal flood-control barrier at night during monsoon rain,
Southeast Asian-inspired near-future infrastructure, wet concrete,
maintenance markings, amber work lights, distant elevated transit,
civic rather than military design, cinematic environmental still,
restrained blue-gray palette, no people in foreground, no embedded text.
```

### Evidence photo direction

```text
Forensic documentation still from a fictional municipal investigation,
neutral framing, practical lighting, believable wear, clear focal object,
space reserved for manually typeset labels, no real logos, no readable
generated text, no graphic injury.
```

## 4. AI-generated asset policy

AI generation may be used for ideation and selected production assets only when:

- the tool’s terms permit the intended use,
- output provenance is recorded,
- no real person is intentionally imitated,
- text and logos are manually recreated,
- visual consistency is checked,
- artifacts and anatomy are corrected,
- and the final result is reviewed by a human.

Do not use one-off prompts without a reference sheet. Create:

- character sheets,
- palette reference,
- lighting reference,
- location architecture reference,
- and composition rules.

## 5. Asset status fields

Recommended status:

```text
planned
briefed
draft
review
revision
approved
optimized
integrated
retired
```

## 6. Naming convention

```text
<type>_<domain>_<name>_<variant>_<size>.<ext>
```

Examples:

```text
img_char_maya_neutral_1024.webp
img_loc_node7_corridor_wide_1920.webp
ico_app_records_default.svg
aud_ui_notification_info.ogg
vid_loc_ferry_gate_rain_loop.webm
```

## 7. Export requirements

### Images

- Source master retained
- WebP or AVIF where supported
- PNG only for transparency when necessary
- Multiple responsive sizes
- No unnecessary metadata
- Thumbnail and full-view variants

### Audio

- OGG and/or browser-compatible fallback
- Normalized loudness
- Seamless loops where required
- Captions or transcripts for voice/evidence
- Avoid clipping

### Video

- WebM preferred with fallback if needed
- Short loops
- No audio unless necessary
- Poster image
- Lazy-loaded
- Reduced-motion alternative still

## 8. Initial asset budget

Vertical slice should target:

- 6 character portraits
- 6 location stills
- 10–14 evidence visuals
- 10 app icons
- 15–25 UI sound effects
- 4 ambience loops
- 4 music layers
- 2 short environment/video loops
- 1 district map
- 1 Node 7 schematic

Do not produce a complete city before playtesting.

## 9. Provenance record template

```text
Asset ID:
Title:
Creator:
Creation date:
Source/tool:
Prompt or brief reference:
License:
Original file:
Optimized file:
Edits performed:
Contains generated elements:
Contains third-party elements:
Alt text/transcript:
Approved by:
Status:
```

## 10. Asset acceptance checklist

- Fits art direction
- Supports the scene or mechanic
- Correct resolution and crop
- Readable in actual UI
- No accidental real branding
- No inconsistent embedded text
- No obvious generation artifacts
- Provenance complete
- Optimized export complete
- Accessibility description complete
- Tested in normal and high-contrast modes