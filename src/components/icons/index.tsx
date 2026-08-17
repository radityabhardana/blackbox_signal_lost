import type { SVGProps } from "react";
import type { AppIconId } from "@/domain/windows/types";

export type { AppIconId };

export type SystemGlyphId =
  | "minimize"
  | "maximize"
  | "restore"
  | "close"
  | "bell"
  | "window_switcher"
  | "reset_layout"
  | "anomaly"
  | "discovery"
  | "warning"
  | "verified";

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const sharedSvgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

// --- Application Icons (24x24, civic-industrial geometry) ---

export function MailIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 7l9 6 9-6" />
      <path d="M7 15h4" />
    </svg>
  );
}

export function MessengerIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M4 5h16v10H8l-4 4V5z" />
      <path d="M8 10h4" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function RecordsIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M8 3h11a1 1 0 0 1 1 1v12" />
      <path d="M4 6h10l4 4v11H4z" />
      <path d="M14 6v4h4" />
      <path d="M7 14h6" />
      <path d="M7 17h4" />
    </svg>
  );
}

export function EvidenceBoardIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M8 8l8 8" />
      <path d="M16 8l-3 3" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ObjectivesIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function SignalAnalyzerIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M4 14V10M8 17V7M12 19V5M16 16V8M20 13V11" />
      <path d="M11 3v18" />
      <path d="M9.5 3h3M9.5 21h3" />
    </svg>
  );
}

export function ConclusionIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M5 3h10l5 5v13H5z" />
      <path d="M15 3v5h5" />
      <path d="M8 10h4M8 13h3M8 16h2" />
      <path d="M14 15l2 2 4-4" />
    </svg>
  );
}

export function SystemLogIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
      <path d="M12 4v1M20 12h-1M12 20v-1M4 12h1" />
    </svg>
  );
}

export function NotificationsIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
      <circle cx="18" cy="5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// --- System Glyphs (24x24, simple civic-industrial utility shapes) ---

export function MinimizeGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M4 12h16" />
    </svg>
  );
}

export function MaximizeGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <rect x="4" y="4" width="16" height="16" rx="1" />
    </svg>
  );
}

export function RestoreGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <rect x="4" y="8" width="12" height="12" rx="1" />
      <path d="M8 8V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3" />
    </svg>
  );
}

export function CloseGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BellGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function WindowSwitcherGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <rect x="3" y="6" width="13" height="11" rx="1" />
      <path d="M8 6V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-2" />
    </svg>
  );
}

export function ResetLayoutGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <rect x="4" y="4" width="6" height="6" rx="0.5" />
      <rect x="14" y="4" width="6" height="6" rx="0.5" />
      <rect x="4" y="14" width="6" height="6" rx="0.5" />
      <path d="M14 16.5A3.5 3.5 0 1 0 17.5 13" />
      <path d="M14 13v3.5h3.5" />
    </svg>
  );
}

export function AnomalyGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M3 12h4l2-5 2 10 2-7" />
      <path d="M15 15l2-8 2 6h2" />
      <path d="M12 4l-1 16" strokeDasharray="2 2" />
    </svg>
  );
}

export function DiscoveryGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M12 3l9 9-9 9-9-9z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WarningGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M12 3.5L21.5 20H2.5L12 3.5z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function VerifiedGlyph({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...sharedSvgProps} {...props}>
      <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2z" />
      <path d="M8 12l2.5 2.5 5.5-5.5" />
    </svg>
  );
}

// --- Dispatch components ---

const APP_ICON_MAP: Record<AppIconId, (props: IconProps) => React.JSX.Element> = {
  mail: MailIcon,
  messenger: MessengerIcon,
  records: RecordsIcon,
  evidence_board: EvidenceBoardIcon,
  objectives: ObjectivesIcon,
  signal_analyzer: SignalAnalyzerIcon,
  conclusion: ConclusionIcon,
  system_log: SystemLogIcon,
  notifications: NotificationsIcon,
};

const SYSTEM_GLYPH_MAP: Record<SystemGlyphId, (props: IconProps) => React.JSX.Element> = {
  minimize: MinimizeGlyph,
  maximize: MaximizeGlyph,
  restore: RestoreGlyph,
  close: CloseGlyph,
  bell: BellGlyph,
  window_switcher: WindowSwitcherGlyph,
  reset_layout: ResetLayoutGlyph,
  anomaly: AnomalyGlyph,
  discovery: DiscoveryGlyph,
  warning: WarningGlyph,
  verified: VerifiedGlyph,
};

export function AppIcon({
  id,
  size = 24,
  className,
  ...props
}: {
  id: AppIconId;
  size?: number | string;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  const Component = APP_ICON_MAP[id];
  if (!Component) {
    return null;
  }
  return <Component size={size} className={className} {...props} />;
}

export function SystemGlyph({
  id,
  size = 24,
  className,
  ...props
}: {
  id: SystemGlyphId;
  size?: number | string;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  const Component = SYSTEM_GLYPH_MAP[id];
  if (!Component) {
    return null;
  }
  return <Component size={size} className={className} {...props} />;
}
