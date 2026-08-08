"use client";

import { getApp } from "@/lib/apps";

export function WindowContent({ appId }: { appId: string }) {
  const app = getApp(appId);

  return (
    <div className="bbx-window-body">
      <div className="p-4">
        <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-bbx-text-2">
          {app?.title ?? appId}
        </p>
        <p className="mt-2 text-sm text-bbx-text-2">
          Placeholder application. Content arrives with the case build.
        </p>
      </div>
    </div>
  );
}