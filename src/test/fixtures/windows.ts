import type { ApplicationDescriptor, WorkspaceSize } from "@/domain/windows";

export const MAIL_APP: ApplicationDescriptor = { appId: "app_mail", title: "Secure Mail" };

export const RECORDS_APP: ApplicationDescriptor = { appId: "app_records", title: "Records" };

export const MIN_SIZE_APP: ApplicationDescriptor = {
  appId: "app_min",
  title: "Min Size",
  minWidth: 1000,
  minHeight: 700,
};

export const TEST_APPS: ApplicationDescriptor[] = [MAIL_APP, RECORDS_APP, MIN_SIZE_APP];

export const WORKSPACE: WorkspaceSize = { width: 1920, height: 1080 };

export const TINY_WORKSPACE: WorkspaceSize = { width: 200, height: 150 };

export const ZERO_WORKSPACE: WorkspaceSize = { width: 0, height: 0 };

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
}