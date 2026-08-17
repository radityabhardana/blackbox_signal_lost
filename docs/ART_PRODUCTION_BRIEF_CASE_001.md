# Art Production Brief — Case 001 Portraits and Environment Stills

**Status:** brief only. This document contains **no generated final artwork**.
Asset statuses for all portraits and environments remain `planned`/`briefed`
(docs/14 §5 lifecycle) until a dedicated art delivery moves them through
`draft → review → approved → optimized → integrated`.

## Purpose

Production brief for the dedicated art delivery that will create Case 001's
character portraits and environment stills (backlog BBX-111, BBX-112). The
current build ships only original in-repo SVG interface assets (see
[`ASSET_SOURCE_REGISTRY.md`](ASSET_SOURCE_REGISTRY.md)); portraits and
environments are intentionally absent, not missing by accident.

Canonical references — do not invent new canon beyond these:

- [`04_NARRATIVE_BIBLE.md`](04_NARRATIVE_BIBLE.md) — characters, organizations, districts
- [`05_CASE_001_MISSING_SIGNAL.md`](05_CASE_001_MISSING_SIGNAL.md) — case roles and required assets
- [`06_ART_DIRECTION.md`](06_ART_DIRECTION.md) — palette, lighting, composition, prohibitions
- [`14_ASSET_MANIFEST.md`](14_ASSET_MANIFEST.md) — asset policy, style prompts, export and provenance requirements

## Character portraits

Six characters. Descriptions below are the only canon; keep them consistent
across every variant.

| Character | Role | Canon notes (docs/04, docs/05) |
|---|---|---|
| Maya Pranata | Missing Pelaga systems engineer, center of Case 001 | Age 29. Methodical, compassionate, anxious under pressure. She appears through messages, records, audio notes, photographs, and traces. Rule: Maya is a person, not merely a mystery object — optional records show ordinary life and relationships. |
| Sera Wibawa | CIAB field investigator | Age 34. Direct, observant, skeptical of automated certainty. Practical language, restrained sarcasm. |
| Reno Adikara | Pelaga security manager | No age recorded in docs — do not invent one. Confrontational corporate-security presence; not a cartoon villain. |
| Nara "Patch" Santoso | Independent repair technician, Open Signal contact | Age 23. Curious, irreverent, technically gifted. |
| Dr. Adrian Vale | Pelaga Systems liaison | Age 46. Polished, calm, highly controlled; speaks in risk language. |
| Director Hana Idris | CIAB operations director | Age 52. Strategic, controlled, exhausted. |

### Per-character deliverables (docs/14 §C)

- neutral portrait,
- one alternate expression,
- organization/background variant,
- transmission/glitch version,
- alt description (accessibility).

### Visual consistency rules (docs/06 §9, docs/14 §3)

- Stylized illustrated busts or photo-collage portraits; realistic but slightly
  graphic editorial illustration.
- Consistent three-quarter bust framing for all six characters.
- Neutral dark slate background tied to the character's organization.
- Cool soft key light from upper left; warm practical rim light.
- Southeast Asian coastal megacity influence; restrained utilitarian clothing.
- Consistent facial proportions across variants; no embedded text; no neon
  hacker clichés.
- A portrait sheet must define face shape, age range, hair, clothing,
  organization marker, expression set, lighting direction, and palette before
  variants are produced.

## Environment stills

Seven locations (docs/14 §D, docs/05 §10):

1. North Barrier exterior — massive coastal flood-control barrier at night in
   monsoon rain; wet concrete, maintenance markings, amber work lights, distant
   elevated transit; civic rather than military design; no people in foreground.
2. Node 7 maintenance corridor — flood-control infrastructure interior;
   service lighting, sensor housings, isolation-door hardware.
3. Meridian ferry gate — transit gate architecture, ferry iconography, civic
   signage, wet surfaces.
4. Pelaga office exterior — corporate residential/research zone; clean,
   monitored, branded with the fictional Pelaga mark only.
5. Repair shelter — unregistered, improvised, lived-in; repair labels, dense
   mixed-age hardware, salt damage on older equipment.
6. CIAB remote operations room — underfunded public agency: functional,
   procedural, worn but orderly.
7. Nusakara district map — stylized civic map of the districts (Meridian Core,
   Tanjung Lama, Pelaga Arcology, North Barrier, Lumen Ward).

### Architectural language (docs/06 §3)

Near-future **civic infrastructure**, not a cyberpunk nightclub. Nusakara's
identity appears through monsoon rain, flood-depth markers, sea-wall diagrams,
ferry and elevated-transit iconography, dense mixed-age infrastructure, civic
signage, repair labels, public weather alerts, tropical night reflections, and
locally flavored fictional brands. Avoid an undifferentiated Western cyberpunk
city.

### Lighting, palette, composition

- Use the semantic token palette from docs/06 §4 / `src/app/globals.css`:
  deep blue-gray workspace (`--bbx-bg-0`/`--bbx-bg-1`), desaturated slate
  surfaces, soft white text tones, restrained cyan (`--bbx-accent-civic`),
  amber for evidence/discovery (`--bbx-accent-signal`), warm red only for
  critical states (`--bbx-danger`), muted magenta reserved for suppressed/system
  anomaly (`--bbx-suppressed`). Bright color signals interaction or narrative
  change — never decoration.
- Still images with layered motion potential (docs/06 §10): rain overlay, light
  flicker, moving transit line, distant maintenance drone, screen reflection,
  subtle camera sway.
- Composition leaves clear negative space for UI windows and text; no embedded
  readable text in artwork (labels are manually typeset later).

### Forbidden clichés (docs/06 §11, §15)

- Neon green / excessive green terminal text, Matrix-style falling code.
- Skulls, anonymous masks, cliché hacker imagery.
- Terminal wallpaper, random hex strings as decoration, unreadable glitch
  overlays, constant scanlines.
- Generic AI dashboard art, stock cyberpunk city art without Nusakara context.
- Real corporate or government branding, unlicensed real CCTV footage.
- AI image outputs used without consistency review.

## Required crops and ratios

### Portraits

- Consistent head framing across all six characters so crops remain legible at
  **24 px, 48 px, and 128 px** (taskbar, message list, detail view).
- Master bust crop plus a head-only crop; same eye line and head size across
  the whole cast.

### Environments

- **16:9 master**, desktop background-safe: key subjects outside the central
  window-safe area so desktop windows never cover narrative focal points.
- Cropped thumbnails per docs/14 §D for lists and evidence-board use.

## Output formats and provenance

- **Source:** editable master retained per asset (docs/14 §7).
- **Optimized:** WebP (AVIF where supported; PNG only for transparency),
  multiple responsive sizes, thumbnail and full-view variants, no unnecessary
  metadata.
- **Naming:** `<type>_<domain>_<name>_<variant>_<size>.<ext>` (docs/14 §6),
  e.g. `img_char_maya_neutral_1024.webp`, `img_loc_node7_corridor_wide_1920.webp`.
- **Provenance:** every asset gets a docs/14 §9 provenance record and a machine
  registry entry (`src/content/assets/registry.ts`) with correct `sourceType`
  (`original` / `generated` / `third_party`), license, and attribution.
  AI-generated assets additionally require the provenance fields listed in
  [`ASSET_SOURCE_REGISTRY.md`](ASSET_SOURCE_REGISTRY.md) (generator/model,
  prompt summary, seed, date, operator, rights statement, post-processing
  notes) and must pass the docs/14 §10 acceptance checklist, including review
  for accidental resemblance to real brands or public figures.

## Acceptance gate

An asset is only `integrated` when it fits the art direction, supports the
scene or mechanic, is readable in the actual UI at target sizes, has complete
provenance and alt description, and has been tested in normal and high-contrast
modes (docs/14 §10).
