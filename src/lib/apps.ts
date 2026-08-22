import type { ApplicationDescriptor } from "@/domain/windows";

/**
 * Application catalog. `title` is the locale-independent fallback (window
 * manager internals, tests); `titleKey` is the locale dictionary key that UI
 * surfaces render through `useT()`.
 */
export const APP_CATALOG: ApplicationDescriptor[] = [
  { appId: "app_mail", title: "Mail", titleKey: "apps.mail", minWidth: 480, minHeight: 360, requiresUnlock: true, icon: "mail" },
  {
    appId: "app_messenger",
    title: "Messenger",
    titleKey: "apps.messenger",
    minWidth: 420,
    minHeight: 360,
    requiresUnlock: true,
    icon: "messenger",
  },
  {
    appId: "app_records",
    title: "Records",
    titleKey: "apps.records",
    minWidth: 560,
    minHeight: 400,
    requiresUnlock: true,
    icon: "records",
  },
  {
    appId: "app_evidence_board",
    title: "Evidence Board",
    titleKey: "apps.evidence_board",
    minWidth: 760,
    minHeight: 520,
    requiresUnlock: true,
    icon: "evidence_board",
  },
  {
    appId: "app_objectives",
    title: "Objectives",
    titleKey: "apps.objectives",
    minWidth: 420,
    minHeight: 360,
    requiresUnlock: true,
    icon: "objectives",
  },
  {
    appId: "app_signal_analyzer",
    title: "Signal Analyzer",
    titleKey: "apps.signal_analyzer",
    minWidth: 640,
    minHeight: 460,
    requiresUnlock: true,
    icon: "signal_analyzer",
  },
  {
    appId: "app_conclusion",
    title: "Conclusion Report",
    titleKey: "apps.conclusion",
    minWidth: 760,
    minHeight: 520,
    requiresUnlock: true,
    icon: "conclusion",
  },
  {
    appId: "app_system_log",
    title: "System Log",
    titleKey: "apps.system_log",
    minWidth: 480,
    minHeight: 320,
    icon: "system_log",
  },
  {
    appId: "app_settings",
    title: "Settings",
    titleKey: "apps.settings",
    minWidth: 420,
    minHeight: 320,
    icon: "settings",
  },
  // Help is always available (no requiresUnlock).
  {
    appId: "app_help",
    title: "Help",
    titleKey: "apps.help",
    minWidth: 420,
    minHeight: 360,
    icon: "help",
  },
];

export function getApp(appId: string): ApplicationDescriptor | undefined {
  return APP_CATALOG.find((app) => app.appId === appId);
}
