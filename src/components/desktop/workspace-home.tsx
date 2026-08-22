"use client";

import { useOptionalCaseSession } from "@/features/session/case-session";
import { projectWorkspaceHome } from "@/domain/workspace/project-workspace-home";
import { useWindowStore } from "@/stores/window-store";
import { useLocale, useT } from "@/lib/locale/provider";
import { getApp } from "@/lib/apps";
import { BlackboxSymbol } from "@/components/brand";
import { AppIcon, SystemGlyph } from "@/components/icons";
import { focusWindowRegion } from "@/lib/focus-registry";

/**
 * Desktop-replacing home surface, shown only while no windows are open.
 * Renders the pure `projectWorkspaceHome` projection as a civic-intelligence
 * dossier: system rail, case dossier, contextual primary action, attention,
 * and quick access. No objective IDs or case logic are hardcoded here.
 */
export function WorkspaceHome() {
  const t = useT();
  const locale = useLocale();
  const session = useOptionalCaseSession();

  if (session === null) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <p className="px-4 text-center font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          {t("ui.workspace.empty")}
        </p>
      </div>
    );
  }

  const projection = projectWorkspaceHome({
    state: session.state,
    content: session.content,
    locale,
  });

  const activate = (appId: string): void => {
    useWindowStore.getState().open(appId);
    const focused = useWindowStore.getState().manager.focusedWindowId;
    if (focused) {
      focusWindowRegion(focused);
    }
  };

  const phaseLabel = t(`ui.home.phase.${projection.phaseLabel}`);
  const quickActionApp = projection.quickAction.appId !== null ? projection.quickAction.appId : null;
  const quickActionDescriptor = quickActionApp === null ? undefined : getApp(quickActionApp);
  const quickActionLabel =
    quickActionDescriptor?.titleKey !== undefined ? t(quickActionDescriptor.titleKey) : null;

  const hasAttention = projection.attention.hasBriefing || projection.attention.latestNotificationText !== null;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* System rail */}
      <div className="flex items-center gap-4 border-b border-bbx-surface-2 bg-bbx-surface-1 px-6 py-3">
        <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-bbx-accent-civic">
          <BlackboxSymbol size={18} className="shrink-0" />
          <span>{t("ui.home.kicker")}</span>
        </span>
        <span className="ml-auto flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-bbx-text-2">
          <span>{t("ui.home.session")}</span>
          <span aria-label={phaseLabel}>{phaseLabel}</span>
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8">
        {/* Case dossier */}
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
            {t("ui.home.case")} · {projection.caseId}
          </p>
          <h1 className="mt-2 font-sans text-4xl font-semibold leading-tight text-bbx-text-1">
            {projection.caseTitle}
          </h1>
          {projection.caseSubtitle !== null ? (
            <p className="mt-2 font-sans text-lg text-bbx-text-2">{projection.caseSubtitle}</p>
          ) : null}

          {projection.caseCompleted ? (
            <p className="mt-6 inline-flex items-center gap-2 border border-bbx-surface-2 bg-bbx-surface-1 px-3 py-2 font-mono text-xs uppercase tracking-widest text-bbx-success">
              <SystemGlyph id="verified" size={16} className="shrink-0" />
              <span>{t("ui.home.completed")}</span>
            </p>
          ) : projection.activeObjective !== null ? (
            <div className="mt-8">
              <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
                {t("ui.home.objective")}
              </p>
              <h2 className="mt-2 font-sans text-2xl font-semibold text-bbx-text-1">
                {projection.activeObjective.title}
              </h2>
              <p className="mt-2 max-w-2xl font-sans text-base text-bbx-text-2">
                {projection.activeObjective.description}
              </p>

              {quickActionApp !== null && quickActionLabel !== null ? (
                <button
                  type="button"
                  className="bbx-btn bbx-btn-primary mt-6 px-5 py-3 text-sm"
                  onClick={() => activate(quickActionApp)}
                >
                  <span>{t("ui.home.open", { app: quickActionLabel })}</span>
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-6 font-sans text-base text-bbx-text-2">{t("ui.home.noObjective")}</p>
          )}
        </div>

        {/* Attention */}
        {hasAttention ? (
          <div
            role="status"
            className="mt-8 max-w-3xl border border-bbx-accent-signal bg-bbx-surface-1 px-4 py-3"
          >
            <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-bbx-accent-signal">
              <SystemGlyph id="anomaly" size={16} className="shrink-0" />
              <span>{t("ui.home.briefing")}</span>
            </p>
            <p className="mt-1 font-sans text-sm text-bbx-text-1">{t("ui.home.briefingHint")}</p>
          </div>
        ) : null}

        {/* Quick access */}
        {projection.availableApps.length > 0 ? (
          <div className="mt-8">
            <p className="font-mono text-xs uppercase tracking-widest text-bbx-text-2">
              {t("ui.home.quickAccess")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {projection.availableApps.map((appId) => {
                const descriptor = getApp(appId);
                const label = descriptor?.titleKey !== undefined ? t(descriptor.titleKey) : appId;
                const icon = descriptor?.icon;
                return (
                  <button
                    key={appId}
                    type="button"
                    className="bbx-btn px-3 py-2 text-[0.6875rem]"
                    aria-label={t("ui.home.open", { app: label })}
                    onClick={() => activate(appId)}
                  >
                    {icon !== undefined ? (
                      <AppIcon id={icon} size={16} className="shrink-0" />
                    ) : null}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
