import { describe, expect, it } from "vitest";
import { loadCase001Session } from "@/content/cases/case_001_missing_signal";
import { stepCaseEngine } from "@/domain/engine";
import { projectWorkspaceHome } from "./project-workspace-home";

describe("projectWorkspaceHome", () => {
  it("projects a fresh Stage 0 session with the onboarding active objective", () => {
    const { content, initialState } = loadCase001Session();
    const projection = projectWorkspaceHome({ state: initialState, content, locale: "en" });

    expect(projection.caseId).toBe("case_001_missing_signal");
    expect(projection.caseTitle).toBe("Missing Signal");
    expect(projection.caseSubtitle).toBe("A Pelaga Systems engineer has vanished.");
    expect(projection.caseCompleted).toBe(false);
    expect(projection.phaseLabel).toBe("in_progress");

    expect(projection.activeObjective).not.toBeNull();
    expect(projection.activeObjective!.id).toBe("obj_000_analyst_verification");
    expect(projection.activeObjective!.recommendedAppId).toBe("app_mail");
    expect(projection.activeObjective!.completed).toBe(false);

    expect(projection.attention.hasBriefing).toBe(true);
    expect(projection.attention.latestNotificationId).toBe("notification_000_briefing");
    expect(projection.attention.latestNotificationText).toBe("New briefing received. Review your analyst credential.");

    // Only app_mail is unlocked at Stage 0 (help/settings are always available).
    expect(projection.availableApps).toEqual(["app_mail", "app_help", "app_settings"]);
    expect(projection.quickAction).toEqual({ appId: "app_mail", labelKey: "apps.mail" });
  });

  it("does not recommend a locked app for the quick action", () => {
    const { content, initialState } = loadCase001Session();
    // Simulate a session where only records is unlocked but the active
    // objective recommends mail (locked) for the given state: the quick action
    // must fall back to the first unlocked available app.
    const state = {
      ...initialState,
      unlockedApplications: ["app_records"],
    };
    const projection = projectWorkspaceHome({ state, content, locale: "en" });

    // The recommended app_mail is not available, so the fallback preference
    // order picks app_records.
    expect(projection.quickAction).toEqual({ appId: "app_records", labelKey: "apps.records" });
  });

  it("projects a completed case without an active objective", () => {
    const { content, initialState } = loadCase001Session();
    const afterCredential = stepCaseEngine(
      initialState,
      { kind: "evidence_discovered", evidenceId: "ev_000_analyst_credential" },
      content,
    ).state;
    const afterConfirm = stepCaseEngine(
      afterCredential,
      { kind: "dialogue_choice_selected", choiceId: "choice_000_confirm_identity" },
      content,
    ).state;
    const completedState = {
      ...afterConfirm,
      activeObjectives: [],
      caseCompleted: true,
      selectedOutcomeId: "outcome_001_protected_truth",
    };

    const projection = projectWorkspaceHome({ state: completedState, content, locale: "en" });

    expect(projection.caseCompleted).toBe(true);
    expect(projection.phaseLabel).toBe("completed");
    expect(projection.activeObjective).toBeNull();
    expect(projection.quickAction.appId).toBeNull();
    expect(projection.quickAction.labelKey).toBeNull();
  });

  it("projects a terminal no-objective state without leaking locked objectives", () => {
    const { content, initialState } = loadCase001Session();
    const emptyState = {
      ...initialState,
      activeObjectives: [],
      queuedDialogue: [],
      notifications: [],
    };
    const projection = projectWorkspaceHome({ state: emptyState, content, locale: "en" });

    expect(projection.phaseLabel).toBe("no_objective");
    expect(projection.activeObjective).toBeNull();
    expect(projection.attention).toEqual({
      hasBriefing: false,
      latestNotificationId: null,
      latestNotificationText: null,
    });
    // Nothing locked is exposed.
    expect(projection.availableApps.some((appId) => appId === "app_records")).toBe(false);
  });

  it("does not reveal recommendedAppId from a locked objective", () => {
    const { content, initialState } = loadCase001Session();
    const projection = projectWorkspaceHome({ state: initialState, content, locale: "en" });
    // obj_001's recommendedAppId (app_records) must never surface while locked.
    const json = JSON.stringify(projection);
    expect(json).not.toContain("app_records");
    expect(projection.activeObjective!.id).toBe("obj_000_analyst_verification");
  });
});