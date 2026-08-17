import { z } from "zod";
import { idSchema } from "../schemas/ids";

/**
 * UI Asset categories covering brand marks, application icons, system glyphs,
 * evidence visuals, textures, character portraits, environments, and audio.
 */
export const UI_ASSET_CATEGORIES = [
  "brand",
  "app_icon",
  "system_glyph",
  "evidence",
  "texture",
  "portrait",
  "environment",
  "audio",
] as const;

export const uiAssetCategorySchema = z.enum(UI_ASSET_CATEGORIES);
export type UiAssetCategory = z.infer<typeof uiAssetCategorySchema>;

/**
 * Origin classification for assets in the registry.
 */
export const UI_ASSET_SOURCE_TYPES = ["original", "generated", "third_party"] as const;
export const uiAssetSourceTypeSchema = z.enum(UI_ASSET_SOURCE_TYPES);
export type UiAssetSourceType = z.infer<typeof uiAssetSourceTypeSchema>;

/**
 * Lifecycle status verbatim from docs/14 §5.
 */
export const UI_ASSET_STATUSES = [
  "planned",
  "briefed",
  "draft",
  "review",
  "revision",
  "approved",
  "optimized",
  "integrated",
  "retired",
] as const;

export const uiAssetStatusSchema = z.enum(UI_ASSET_STATUSES);
export type UiAssetStatus = z.infer<typeof uiAssetStatusSchema>;

/**
 * Zod strict schema for a UI asset registry entry.
 * Enforces metadata completeness, provenance, accessibility intent, and
 * exact XOR requirement between componentKey and file path.
 */
export const uiAssetEntrySchema = z
  .object({
    id: idSchema,
    title: z.string().min(1),
    category: uiAssetCategorySchema,
    sourceType: uiAssetSourceTypeSchema,
    creator: z.string().min(1),
    creationMethod: z.string().min(1),
    source: z.string().min(1),
    license: z.string().min(1),
    attribution: z.string().min(1).default("none"),
    componentKey: z.string().min(1).optional(),
    path: z.string().min(1).optional(),
    optimizedPath: z.string().min(1).optional(),
    altText: z.string().optional(),
    accessibilityIntent: z.string().optional(),
    status: uiAssetStatusSchema,
    caseIds: z.array(idSchema).optional(),
  })
  .strict()
  .superRefine((entry, ctx) => {
    const hasComponentKey = typeof entry.componentKey === "string" && entry.componentKey.length > 0;
    const hasPath = typeof entry.path === "string" && entry.path.length > 0;

    if (hasComponentKey === hasPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one of componentKey XOR path must be provided",
        path: hasComponentKey ? ["componentKey", "path"] : ["componentKey"],
      });
    }

    if (entry.path !== undefined && !entry.path.startsWith("public/assets/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'path must start with "public/assets/"',
        path: ["path"],
      });
    }

    if (entry.optimizedPath !== undefined && !entry.optimizedPath.startsWith("public/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'optimizedPath must start with "public/"',
        path: ["optimizedPath"],
      });
    }
  });

export type UiAssetEntry = z.infer<typeof uiAssetEntrySchema>;

const CREATOR_BLACKBOX = "BLACKBOX team";
const CREATION_METHOD_SVG = "authored SVG vector paths in-repo";
const SOURCE_ORIGINAL = "original — authored for BLACKBOX: Signal Lost";
const LICENSE_PROPRIETARY = "proprietary — project original";
const ATTRIBUTION_NONE = "none";
const STATUS_INTEGRATED: UiAssetStatus = "integrated";

/**
 * Canonical UI Asset Registry containing all 33 base interface assets:
 * - 4 brand marks (BlackboxSymbol, BlackboxWordmark, CiabMark, PelagaMark)
 * - 9 application icons (MailIcon, MessengerIcon, RecordsIcon, etc.)
 * - 11 system glyphs (MinimizeGlyph, MaximizeGlyph, etc.)
 * - 8 evidence visuals (FerryDepartureVisual, EmergencyCallVisual, etc.)
 * - 1 background texture (desktop-civic-grid.svg)
 */
export const UI_ASSET_REGISTRY: readonly UiAssetEntry[] = [
  // --- Brand (4) ---
  {
    id: "brand_blackbox_symbol",
    title: "BLACKBOX Symbol",
    category: "brand",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "BlackboxSymbol",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "brand mark — decorative on taskbar",
  },
  {
    id: "brand_blackbox_wordmark",
    title: "BLACKBOX Wordmark",
    category: "brand",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "BlackboxWordmark",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "informative brand wordmark with embedded accessible title",
  },
  {
    id: "brand_ciab_mark",
    title: "CIAB Mark",
    category: "brand",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "CiabMark",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "brand mark — decorative on taskbar",
  },
  {
    id: "brand_pelaga_mark",
    title: "Pelaga Systems Mark",
    category: "brand",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "PelagaMark",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "brand mark — decorative on taskbar",
  },

  // --- App Icons (9) ---
  {
    id: "icon_mail",
    title: "Mail App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "MailIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },
  {
    id: "icon_messenger",
    title: "Messenger App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "MessengerIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },
  {
    id: "icon_records",
    title: "Records App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "RecordsIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },
  {
    id: "icon_evidence_board",
    title: "Evidence Board App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "EvidenceBoardIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },
  {
    id: "icon_objectives",
    title: "Objectives App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "ObjectivesIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },
  {
    id: "icon_signal_analyzer",
    title: "Signal Analyzer App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "SignalAnalyzerIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },
  {
    id: "icon_conclusion",
    title: "Conclusion App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "ConclusionIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },
  {
    id: "icon_system_log",
    title: "System Log App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "SystemLogIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },
  {
    id: "icon_notifications",
    title: "Notifications App Icon",
    category: "app_icon",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "NotificationsIcon",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative icon beside text label",
  },

  // --- System Glyphs (11) ---
  {
    id: "glyph_minimize",
    title: "Minimize Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "MinimizeGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative window control glyph",
  },
  {
    id: "glyph_maximize",
    title: "Maximize Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "MaximizeGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative window control glyph",
  },
  {
    id: "glyph_restore",
    title: "Restore Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "RestoreGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative window control glyph",
  },
  {
    id: "glyph_close",
    title: "Close Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "CloseGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative window control glyph",
  },
  {
    id: "glyph_bell",
    title: "Bell Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "BellGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative notification indicator glyph",
  },
  {
    id: "glyph_window_switcher",
    title: "Window Switcher Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "WindowSwitcherGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative taskbar control glyph",
  },
  {
    id: "glyph_reset_layout",
    title: "Reset Layout Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "ResetLayoutGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative taskbar control glyph",
  },
  {
    id: "glyph_anomaly",
    title: "Anomaly Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "AnomalyGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative system anomaly indicator",
  },
  {
    id: "glyph_discovery",
    title: "Discovery Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "DiscoveryGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative evidence discovery indicator",
  },
  {
    id: "glyph_warning",
    title: "Warning Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "WarningGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative warning indicator",
  },
  {
    id: "glyph_verified",
    title: "Verified Glyph",
    category: "system_glyph",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "VerifiedGlyph",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "decorative verification indicator",
  },

  // --- Evidence Visuals (8) ---
  {
    id: "ev_visual_ferry_departure",
    title: "Ferry Departure Visual",
    category: "evidence",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "FerryDepartureVisual",
    status: STATUS_INTEGRATED,
    accessibilityIntent:
      "decorative evidence document visual; semantic record text is the accessible content",
  },
  {
    id: "ev_visual_emergency_call",
    title: "Emergency Call Visual",
    category: "evidence",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "EmergencyCallVisual",
    status: STATUS_INTEGRATED,
    accessibilityIntent:
      "decorative evidence document visual; semantic record text is the accessible content",
  },
  {
    id: "ev_visual_replay_signature",
    title: "Replay Signature Visual",
    category: "evidence",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "ReplaySignatureVisual",
    status: STATUS_INTEGRATED,
    accessibilityIntent:
      "decorative evidence document visual; semantic record text is the accessible content",
  },
  {
    id: "ev_visual_node7_summary",
    title: "Node 7 Summary Visual",
    category: "evidence",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "Node7SummaryVisual",
    status: STATUS_INTEGRATED,
    accessibilityIntent:
      "decorative evidence document visual; semantic record text is the accessible content",
  },
  {
    id: "ev_visual_manual_escalation",
    title: "Manual Escalation Visual",
    category: "evidence",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "ManualEscalationVisual",
    status: STATUS_INTEGRATED,
    accessibilityIntent:
      "decorative evidence document visual; semantic record text is the accessible content",
  },
  {
    id: "ev_visual_corridor_access",
    title: "Corridor Access Visual",
    category: "evidence",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "CorridorAccessVisual",
    status: STATUS_INTEGRATED,
    accessibilityIntent:
      "decorative evidence document visual; semantic record text is the accessible content",
  },
  {
    id: "ev_visual_checksum_record",
    title: "Checksum Record Visual",
    category: "evidence",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "ChecksumRecordVisual",
    status: STATUS_INTEGRATED,
    accessibilityIntent:
      "decorative evidence document visual; semantic record text is the accessible content",
  },
  {
    id: "ev_visual_isolation_event",
    title: "Isolation Event Visual",
    category: "evidence",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    componentKey: "IsolationEventVisual",
    status: STATUS_INTEGRATED,
    accessibilityIntent:
      "decorative evidence document visual; semantic record text is the accessible content",
  },

  // --- Texture (1) ---
  {
    id: "texture_desktop_civic_grid",
    title: "Desktop Civic Grid Texture",
    category: "texture",
    sourceType: "original",
    creator: CREATOR_BLACKBOX,
    creationMethod: CREATION_METHOD_SVG,
    source: SOURCE_ORIGINAL,
    license: LICENSE_PROPRIETARY,
    attribution: ATTRIBUTION_NONE,
    path: "public/assets/textures/desktop-civic-grid.svg",
    status: STATUS_INTEGRATED,
    accessibilityIntent: "ambient background grid texture — decorative",
  },
];

/**
 * Retrieve a UI asset entry by its unique identifier.
 */
export function getUiAssetEntry(id: string): UiAssetEntry | undefined {
  return UI_ASSET_REGISTRY.find((entry) => entry.id === id);
}
