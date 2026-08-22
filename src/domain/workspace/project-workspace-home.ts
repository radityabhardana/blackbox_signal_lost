import type { ContentBundle } from "@/content/validator";
import type { CaseEngineState } from "@/domain/engine";
import { projectObjectives } from "@/domain/objectives/project-objectives";
import type { SupportedLocale } from "@/lib/locale/locales";

/**
 * Generic workspace-home projection (Stage 0 foundation).
 *
 * Pure and deterministic: derives a neutral presentation snapshot of the
 * session for the desktop shell's home surface. No hidden information is
 * exposed — locked objectives/evidence never appear; the "active objective" is
 * the first authored objective with status "active". App availability follows
 * the launcher convention: non-unlock-gated apps are always available and
 * unlock-gated apps require state.unlockedApplications membership.
 */

/** Presentation label; deliberately NOT a progress percentage. */
export type WorkspacePhaseLabel = "completed" | "in_progress" | "no_objective";

export interface ActiveObjectiveProjection {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly recommendedAppId: string | null;
  readonly completed: boolean;
}

export interface AttentionProjection {
  readonly hasBriefing: boolean;
  readonly latestNotificationId: string | null;
  readonly latestNotificationText: string | null;
}

export interface QuickActionProjection {
  readonly appId: string | null;
  readonly labelKey: string | null;
}

export interface WorkspaceHomeProjection {
  readonly caseId: string;
  readonly caseTitle: string;
  readonly caseSubtitle: string | null;
  readonly caseCompleted: boolean;
  readonly activeObjective: ActiveObjectiveProjection | null;
  readonly attention: AttentionProjection;
  readonly quickAction: QuickActionProjection;
  readonly availableApps: readonly string[];
  readonly phaseLabel: WorkspacePhaseLabel;
}

export interface ProjectWorkspaceHomeInput {
  readonly state: CaseEngineState;
  readonly content: ContentBundle;
  readonly locale: SupportedLocale;
}

/**
 * Catalog order for quick access (mirrors APP_CATALOG ordering, kept local so
 * the domain module stays dependency-free of the UI catalog).
 */
const HOME_APP_ORDER: readonly string[] = [
  "app_mail",
  "app_messenger",
  "app_records",
  "app_evidence_board",
  "app_objectives",
  "app_signal_analyzer",
  "app_conclusion",
  "app_help",
  "app_settings",
];

/** Apps that are never unlock-gated and therefore always available. */
const ALWAYS_AVAILABLE_APPS: ReadonlySet<string> = new Set(["app_help", "app_settings"]);

const APP_LABEL_KEYS: Readonly<Record<string, string>> = {
  app_mail: "apps.mail",
  app_messenger: "apps.messenger",
  app_records: "apps.records",
  app_evidence_board: "apps.evidence_board",
  app_objectives: "apps.objectives",
  app_signal_analyzer: "apps.signal_analyzer",
  app_conclusion: "apps.conclusion",
  app_help: "apps.help",
  app_settings: "apps.settings",
};

/** Fallback preference order used when the active objective has no recommendation. */
const QUICK_ACTION_PREFERENCE: readonly string[] = [
  "app_mail",
  "app_records",
  "app_evidence_board",
  "app_objectives",
  "app_signal_analyzer",
  "app_conclusion",
  "app_help",
  "app_settings",
];

function isUnlocked(appId: string, unlockedApplications: ReadonlySet<string>): boolean {
  return ALWAYS_AVAILABLE_APPS.has(appId) || unlockedApplications.has(appId);
}

export function projectWorkspaceHome(input: ProjectWorkspaceHomeInput): WorkspaceHomeProjection {
  const { state, content } = input;
  // `locale` is part of the public contract; the projection returns keys and
  // content that is already overlay-resolved by the provider, so no
  // locale-specific branching is needed here yet.
  void input.locale;

  const unlocked = new Set(state.unlockedApplications);
  const availableApps = HOME_APP_ORDER.filter((appId) => isUnlocked(appId, unlocked));

  const objectives = projectObjectives({
    definitions: content.case.objectives,
    activeObjectiveIds: state.activeObjectives,
    completedObjectiveIds: state.completedObjectives,
  });
  const active = objectives.find((objective) => objective.status === "active") ?? null;

  const activeDefinition =
    active === null ? undefined : content.case.objectives.find((definition) => definition.id === active.id);

  const activeObjective: ActiveObjectiveProjection | null =
    active === null
      ? null
      : Object.freeze({
          id: active.id,
          title: active.title,
          description: active.description,
          recommendedAppId: activeDefinition?.recommendedAppId ?? null,
          completed: state.completedObjectives.includes(active.id),
        });

  const latestNotificationId = state.notifications.length > 0 ? state.notifications[state.notifications.length - 1]! : null;
  const latestNotificationText =
    latestNotificationId === null
      ? null
      : (content.notifications.find((notification) => notification.id === latestNotificationId)?.text ?? null);

  const preferredApp =
    !state.caseCompleted && activeObjective !== null && activeObjective.recommendedAppId !== null
      ? activeObjective.recommendedAppId
      : null;

  const quickAppId = state.caseCompleted
    ? null
    : preferredApp !== null && availableApps.includes(preferredApp)
      ? preferredApp
      : (availableApps.find((appId) => QUICK_ACTION_PREFERENCE.includes(appId)) ?? null);

  const phaseLabel: WorkspacePhaseLabel = state.caseCompleted
    ? "completed"
    : activeObjective !== null
      ? "in_progress"
      : "no_objective";

  return Object.freeze({
    caseId: content.case.id,
    caseTitle: content.case.title,
    caseSubtitle: content.case.subtitle ?? null,
    caseCompleted: state.caseCompleted,
    activeObjective,
    attention: Object.freeze({
      hasBriefing: state.queuedDialogue.length > 0,
      latestNotificationId,
      latestNotificationText,
    }),
    quickAction: Object.freeze({
      appId: quickAppId,
      labelKey: quickAppId === null ? null : (APP_LABEL_KEYS[quickAppId] ?? null),
    }),
    availableApps: Object.freeze(availableApps),
    phaseLabel,
  });
}