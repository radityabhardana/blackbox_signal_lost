# Asset Source Registry

Human-readable companion to the machine-readable registry at
[`src/content/assets/registry.ts`](../src/content/assets/registry.ts), which is the
**source of truth** for asset metadata and is enforced by `pnpm validate:assets`
(`scripts/validate-assets.ts`). Policy, lifecycle statuses, and the provenance
template live in [`docs/14_ASSET_MANIFEST.md`](14_ASSET_MANIFEST.md).

## Source status of this build

> **This build uses ONLY original project-created SVG assets.**
>
> - `sourceType`: `original`
> - `creator`: BLACKBOX team
> - `license`: `proprietary — project original` (proprietary-project-original)
> - **Zero third-party assets** are used in this build. **No attribution is required.**
> - Nothing is copied from reference games or other software.

## Used in this build

All 33 entries below are `sourceType: original`, creator **BLACKBOX team**,
method **authored SVG vector paths in-repo**, license **proprietary — project
original**, status **integrated** (docs/14 §5 lifecycle). Full per-asset IDs,
titles, and accessibility intent are in the machine registry.

| Family | Count | ID prefix | Consumed by |
|---|---|---|---|
| Brand marks — BLACKBOX symbol, BLACKBOX wordmark, CIAB mark, Pelaga mark | 4 | `brand_` | Taskbar and launcher (`BlackboxSymbol`), public landing page (`BlackboxWordmark`, `CiabMark`); `PelagaMark` defined, exported, and tested, available for future in-game use |
| Application icons — Mail, Messenger, Records, Evidence Board, Objectives, Signal Analyzer, Conclusion, System Log, Notifications | 9 | `icon_` | Taskbar, launcher, window switcher, taskbar app items, notification center via the `AppIcon` dispatch component (`src/components/icons`) |
| System glyphs — Minimize, Maximize, Restore, Close, Bell, Window Switcher, Reset Layout, Anomaly, Discovery, Warning, Verified | 11 | `glyph_` | Window chrome and desktop controls via the `SystemGlyph` dispatch component |
| Evidence document visuals — ferry departure, emergency call, replay signature, Node 7 summary, manual escalation, corridor access, checksum record, isolation event | 8 | `ev_visual_` | Record detail pane (`record-detail.tsx`) and evidence-board nodes (`evidence-board-canvas.tsx`). Decorative only: `aria-hidden`, semantic record text stays authoritative |
| Desktop civic-grid texture | 1 | `texture_` | `src/app/globals.css` `.bbx-desktop` background (`public/assets/textures/desktop-civic-grid.svg`) |

The registry schema (`uiAssetEntrySchema`) enforces: stable lowercase snake_case IDs,
exactly one of `componentKey`/`path`, `path` under `public/assets/`, lifecycle
status from docs/14 §5, and `accessibilityIntent` or `altText` on every entry.
`scripts/validate-assets.ts` additionally verifies duplicate IDs, third-party
attribution requirements, file existence, and SVG safety (no `<script>`,
event handlers, `foreignObject`, or external `href`/`src`).

## Approved / candidate future sources

**None of these are used in this commit.** They are research notes for future
deliveries (icons, textures, audio). Any future asset must still be added to the
machine registry with `sourceType: third_party`, a recorded license, attribution,
and source URL, and pass `pnpm validate:assets`.

### Icon libraries

| Library | License | Attribution | Modification | Redistribution |
|---|---|---|---|---|
| Lucide | ISC | Yes (license + copyright notice in distributions) | Allowed | Allowed |
| Tabler Icons | MIT | Yes (license text) | Allowed | Allowed |
| Material Symbols | Apache-2.0 | Yes (notice in distributions) | Allowed | Allowed |
| Feather | MIT | Yes (license text) | Allowed | Allowed |
| Phosphor | MIT | Yes (license text) | Allowed | Allowed |
| Heroicons | MIT | Yes (license text) | Allowed | Allowed |

Caveats: these libraries are BSD-style permissive, so they are usable with
attribution, but the project currently prefers original in-repo vector assets;
adopt a library only when a needed glyph is not worth authoring in-house.

### Textures (CC0)

- **ambientCG** — CC0, no attribution required; verify each texture's individual
  CC0 statement before use.
- **Poly Haven** — CC0, no attribution required.

### Audio candidates

- **Freesound** — CC0 or CC-BY. CC-BY requires attribution with a link to the
  original page and the author's name; **avoid CC-BY-NC** (non-commercial
  conflicts with the project's distribution). Verify upload legitimacy — anyone
  can upload to Freesound, and some uploads mislicense ripped or synthetic
  content.
- **Pixabay Audio** — usable under the Pixabay Content License, but the raw
  files may not be resold or used for Content ID / monetized re-upload; the
  license changed historically, so record the license as of the download date.

## AI-generated art provenance requirements

If AI generation is used for production assets (per docs/14 §4), every output
requires a provenance record containing at minimum:

- generator/model used (name + version),
- prompt summary (not necessarily the full prompt),
- seed value,
- date of generation,
- operator (who generated and reviewed),
- rights statement / evidence of commercial entitlement (the tool's terms must
  permit the intended use),
- post-processing notes (corrections, manual text/typesetting, compositing,
  upscaling).

Records are kept per asset in the machine registry's provenance fields and per
delivery in `docs/14` §9 template. Human review and consistency checks against
the art direction (docs/06) are required before any generated asset is approved.

## Reject list

- **Pinterest / Google Images scrapes** — no license, no provenance, no
  redistribution rights; the "source" cannot be verified.
- **Unverified free-download aggregators** — claims of "free" without a license
  grant are not a license.
- **Real company logos** — the game uses fictional brands (BLACKBOX, CIAB,
  Pelaga, NTA, Open Signal); real logos would break fiction and risk trademark
  issues.
- **Movie / game screenshots or rips** — unlicensed derivative use of other
  creative works.
- **CC-NC or CC-ND assets** — non-commercial (NC) conflicts with distribution of
  the game; no-derivatives (ND) conflicts with the required adaptation into the
  game's visual style.
