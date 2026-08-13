import type { ApplicationDescriptor } from "@/domain/windows";

export const APP_CATALOG: ApplicationDescriptor[] = [
  { appId: "app_mail", title: "Mail", minWidth: 480, minHeight: 360 },
  { appId: "app_messenger", title: "Messenger", minWidth: 420, minHeight: 360 },
  { appId: "app_records", title: "Records", minWidth: 560, minHeight: 400 },
  { appId: "app_evidence_board", title: "Evidence Board", minWidth: 760, minHeight: 520 },
  { appId: "app_system_log", title: "System Log", minWidth: 480, minHeight: 320 },
];

export function getApp(appId: string): ApplicationDescriptor | undefined {
  return APP_CATALOG.find((app) => app.appId === appId);
}
