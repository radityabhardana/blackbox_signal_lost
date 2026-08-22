import { contentBundleSchema, validateContentBundle } from "@/content/validator";
import type { ContentBundle } from "@/content/validator";
import { createInitialEngineState, stepCaseEngine } from "@/domain/engine";
import type { CaseEngineState } from "@/domain/engine";
import { CASE_001_HINTS } from "./hints";

export interface Case001Session {
  readonly content: ContentBundle;
  readonly initialState: CaseEngineState;
}

export const CASE_001_SLOT_ID = "slot_case_001";
export const CASE_001_MAIL_CHANNEL_ID = "channel_001_mail";
export const CASE_001_MESSENGER_CHANNEL_ID = "channel_001_messenger";

export function loadCase001Session(): Case001Session {
  const parsed = contentBundleSchema.parse({
    case: {
      id: "case_001_missing_signal",
      version: "1.0.0",
      title: "Missing Signal",
      subtitle: "A Pelaga Systems engineer has vanished.",
      estimatedMinutes: 30,
      entryStageId: "stage_001_missing_engineer",
      stages: [],
      entities: [],
      objectives: [
        {
          // Stage 0 onboarding objective (docs/05 Stage 0 — analyst
          // onboarding). No hint ladder: there is no investigation to solve,
          // so requiresHints opts out of the hint-ladder invariant.
          id: "obj_000_analyst_verification",
          title: "Complete analyst verification",
          description:
            "Review your assignment mail, inspect your analyst credential, and confirm your identity to begin case allocation.",
          optional: false,
          startRule: { always: true },
          completionRule: {
            all: [{ entityDiscovered: "ev_000_analyst_credential" }, { choiceSelected: "choice_000_confirm_identity" }],
          },
          hintIds: [],
          requiresHints: false,
          nextObjectiveIds: [],
          recommendedAppId: "app_mail",
        },
        {
          id: "obj_001_verify_location",
          title: "Verify Maya Pranata's final confirmed location",
          description:
            "Two records describe Maya's location on the same night. Determine which account is consistent with the evidence.",
          optional: false,
          startRule: { always: true },
          completionRule: {
            all: [{ entityDiscovered: "ev_001_ferry_departure" }, { entityDiscovered: "ev_001_emergency_call" }],
          },
          hintIds: ["hint_001_verify_location_1", "hint_001_verify_location_2", "hint_001_verify_location_3", "hint_001_verify_location_4"],
          nextObjectiveIds: [],
          recommendedAppId: "app_records",
        },
        {
          id: "obj_002_determine_authenticity",
          title: "Determine whether the ferry departure record is authentic",
          description:
            "Compare the disputed ferry event against a normal ferry gate baseline and identify the discrepancies that prove the departure was not recorded normally.",
          optional: false,
          startRule: { objectiveCompleted: "obj_001_verify_location" },
          completionRule: { eventOccurred: { type: "puzzle_completed", entityId: "puzzle_001_ferry_authenticity" } },
          hintIds: ["hint_002_authenticity_1", "hint_002_authenticity_2", "hint_002_authenticity_3", "hint_002_authenticity_4"],
          nextObjectiveIds: [],
          recommendedAppId: "app_signal_analyzer",
        },
        {
          id: "obj_003_reason_for_north_barrier",
          title: "Identify why Maya entered North Barrier after curfew",
          description:
            "Maya went to North Barrier in the middle of the night for a reason connected to her work on Node 7. Establish what she was doing there.",
          optional: false,
          startRule: {
            any: [
              { choiceSelected: "choice_001_stage3_ciab" },
              { choiceSelected: "choice_001_stage3_offline" },
              { choiceSelected: "choice_001_stage3_pelaga" },
            ],
          },
          completionRule: {
            all: [
              { entityDiscovered: "ev_001_node7_summary" },
              { entityDiscovered: "ev_001_manual_escalation" },
              { entityDiscovered: "ev_001_corridor_access" },
            ],
          },
          hintIds: ["hint_003_north_barrier_1", "hint_003_north_barrier_2", "hint_003_north_barrier_3", "hint_003_north_barrier_4"],
          nextObjectiveIds: [],
          recommendedAppId: "app_records",
        },
      ],
      triggers: [
        {
          // Stage 0 bootstrap (docs/05 Stage 0). Fresh sessions fire
          // case_000_bootstrap; legacy saves restore their own state and never
          // see Stage 0 (their trigger_001_bootstrap is already fired).
          id: "trigger_000_bootstrap",
          once: true,
          priority: 100,
          rule: { eventOccurred: { type: "case_000_bootstrap" } },
          effects: [
            { type: "unlock_application", applicationId: "app_mail" },
            { type: "start_objective", objectiveId: "obj_000_analyst_verification" },
            { type: "queue_dialogue", nodeId: "dialogue_000_onboarding_briefing" },
            { type: "show_notification", notificationId: "notification_000_briefing" },
          ],
        },
        {
          // Credential inspection makes the identity confirmation available —
          // the confirmation node is queued only AFTER the attachment is
          // activated (docs/05 Stage 0 task order).
          id: "trigger_000_credential_inspected",
          once: true,
          priority: 95,
          rule: { entityDiscovered: "ev_000_analyst_credential" },
          effects: [{ type: "queue_dialogue", nodeId: "dialogue_000_identity_confirmation" }],
        },
        {
          // Stage 0 completion: credential inspected AND identity confirmed.
          id: "trigger_000_confirmation_complete",
          once: true,
          priority: 90,
          rule: {
            all: [{ entityDiscovered: "ev_000_analyst_credential" }, { choiceSelected: "choice_000_confirm_identity" }],
          },
          effects: [{ type: "complete_objective", objectiveId: "obj_000_analyst_verification" }],
        },
        {
          // Stage 1 bootstrap. Fresh sessions: case_000_bootstrap → Stage 0 →
          // obj_000 completion fires this once. Legacy saves already have this
          // trigger in firedTriggerIds, so they are unaffected and never re-enter
          // Stage 0. Priority 5 (below trigger_000_confirmation_complete at 90)
          // so it fires in the same engine step as obj_000 completion.
          id: "trigger_001_bootstrap",
          once: true,
          priority: 5,
          rule: { objectiveCompleted: "obj_000_analyst_verification" },
          effects: [
            { type: "start_objective", objectiveId: "obj_001_verify_location" },
            { type: "unlock_application", applicationId: "app_mail" },
            { type: "unlock_application", applicationId: "app_messenger" },
            { type: "unlock_application", applicationId: "app_records" },
            { type: "unlock_application", applicationId: "app_evidence_board" },
            { type: "unlock_application", applicationId: "app_objectives" },
            { type: "queue_dialogue", nodeId: "dialogue_001_sera_intro" },
          ],
        },
        {
          id: "trigger_001_ferry_discovery",
          once: true,
          priority: 50,
          rule: { eventOccurred: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
          effects: [{ type: "discover_evidence", evidenceId: "ev_001_ferry_departure" }],
        },
        {
          id: "trigger_001_emergency_discovery",
          once: true,
          priority: 50,
          rule: { eventOccurred: { type: "record_opened", entityId: "rec_001_emergency_call" } },
          effects: [{ type: "discover_evidence", evidenceId: "ev_001_emergency_call" }],
        },
        {
          id: "trigger_001_objective_complete",
          once: true,
          priority: 10,
          rule: { all: [{ entityDiscovered: "ev_001_ferry_departure" }, { entityDiscovered: "ev_001_emergency_call" }] },
          effects: [{ type: "complete_objective", objectiveId: "obj_001_verify_location" }],
        },
        {
          id: "trigger_002_stage2_activation",
          once: true,
          priority: 5,
          rule: { objectiveCompleted: "obj_001_verify_location" },
          effects: [
            { type: "unlock_application", applicationId: "app_signal_analyzer" },
            { type: "start_objective", objectiveId: "obj_002_determine_authenticity" },
          ],
        },
        {
          id: "trigger_002_authenticity_complete",
          once: true,
          priority: 10,
          rule: { eventOccurred: { type: "puzzle_completed", entityId: "puzzle_001_ferry_authenticity" } },
          effects: [
            { type: "discover_evidence", evidenceId: "ev_001_replay_signature" },
            { type: "complete_objective", objectiveId: "obj_002_determine_authenticity" },
            { type: "set_flag", key: "ferry_record_forged", value: true },
          ],
        },
        {
          // Stage 2 complete → Sera asks the tablet question (docs/05 Stage 3).
          id: "trigger_003_stage3_surface",
          once: true,
          priority: 5,
          rule: { objectiveCompleted: "obj_002_determine_authenticity" },
          effects: [{ type: "queue_dialogue", nodeId: "dialogue_001_stage3_pressure" }],
        },
        {
          // Any Stage 3 branch → Stage 4 objective starts. No choice is a dead end.
          id: "trigger_003_stage4_activation",
          once: true,
          priority: 5,
          rule: {
            any: [
              { choiceSelected: "choice_001_stage3_ciab" },
              { choiceSelected: "choice_001_stage3_offline" },
              { choiceSelected: "choice_001_stage3_pelaga" },
            ],
          },
          effects: [{ type: "start_objective", objectiveId: "obj_003_reason_for_north_barrier" }],
        },
        {
          // Option 2 only → Maya's diagnostic note becomes evidence.
          // Flag-gated (NOT search-gated) per the Stage 3 oracle binding.
          id: "trigger_003_diagnostic_note",
          once: true,
          priority: 5,
          rule: { flagEquals: { key: "tablet_path_offline", value: true } },
          effects: [{ type: "discover_evidence", evidenceId: "ev_001_diagnostic_note" }],
        },
        {
          // Stage 4 required evidence: record_opened → discover_evidence pattern.
          id: "trigger_004_node7_discovery",
          once: true,
          priority: 50,
          rule: { eventOccurred: { type: "record_opened", entityId: "rec_001_node7_summary" } },
          effects: [{ type: "discover_evidence", evidenceId: "ev_001_node7_summary" }],
        },
        {
          id: "trigger_004_escalation_discovery",
          once: true,
          priority: 50,
          rule: { eventOccurred: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
          effects: [{ type: "discover_evidence", evidenceId: "ev_001_manual_escalation" }],
        },
        {
          // Corridor access also surfaces the OPTIONAL meta isolation event as a
          // side companion (docs/05 L170). It never gates completion.
          id: "trigger_004_corridor_discovery",
          once: true,
          priority: 50,
          rule: { eventOccurred: { type: "record_opened", entityId: "rec_001_corridor_access" } },
          effects: [
            { type: "discover_evidence", evidenceId: "ev_001_corridor_access" },
            { type: "discover_evidence", evidenceId: "ev_001_isolation_event" },
          ],
        },
        {
          // Stage 4 completion is branch-independent and requires ONLY the three
          // documented evidence items. ev_001_diagnostic_note and
          // ev_001_isolation_event are optional/conditional and must NOT gate
          // completion (no-dead-end rule).
          id: "trigger_004_obj003_complete",
          once: true,
          priority: 10,
          rule: {
            all: [
              { entityDiscovered: "ev_001_node7_summary" },
              { entityDiscovered: "ev_001_manual_escalation" },
              { entityDiscovered: "ev_001_corridor_access" },
            ],
          },
          effects: [{ type: "complete_objective", objectiveId: "obj_003_reason_for_north_barrier" }],
        },
        // Stage 5 — the masked contact surfaces once Stage 4 is complete
        // (docs/05 Stage 5). Never gates completion (no Stage 5 objective).
        {
          id: "trigger_005_masked_surface",
          once: true,
          priority: 5,
          rule: {
            all: [
              { objectiveCompleted: "obj_003_reason_for_north_barrier" },
              { entityDiscovered: "ev_001_corridor_access" },
            ],
          },
          effects: [{ type: "queue_dialogue", nodeId: "dialogue_001_stage5_masked" }],
        },
        // Ask-proof branch: the anonymized checksum record unlocks via a
        // flag-gated trigger, NOT a dialogue effect (docs/13 §4 matrix).
        {
          id: "trigger_005_checksum_discovery",
          once: true,
          priority: 5,
          rule: { flagEquals: { key: "masked_checksum_unlocked", value: true } },
          effects: [{ type: "discover_evidence", evidenceId: "ev_001_checksum_record" }],
        },
        // Stage 6 — the conclusion unlocks once Stage 4 is complete. Stage 5
        // is NOT a gate: docs/05 "No choice prevents completion" extends to the
        // masked contact (an optional modifier).
        {
          id: "trigger_006_conclusion_unlock",
          once: true,
          priority: 5,
          rule: { objectiveCompleted: "obj_003_reason_for_north_barrier" },
          effects: [{ type: "unlock_application", applicationId: "app_conclusion" }],
        },
        // Hidden meta (docs/05 §5): if the player discovered the isolation
        // event AND did not forward the masked contact, the BLACKBOX
        // intervention is noticed after an ending is delivered. Gated on
        // outcome_selected so the forward decision (Stage 5) is settled before
        // the flag evaluates — without this gate the rule would fire during
        // Stage 4 for every isolation discoverer.
        {
          id: "trigger_006_meta_flag",
          once: true,
          priority: 5,
          rule: {
            all: [
              { entityDiscovered: "ev_001_isolation_event" },
              { not: { flagEquals: { key: "masked_forwarded", value: true } } },
              { eventOccurred: { type: "outcome_selected" } },
            ],
          },
          effects: [
            { type: "set_flag", key: "noticed_blackbox_intervention", value: true },
            { type: "show_notification", notificationId: "notification_001_blackbox_meta" },
          ],
        },
      ],
      outcomes: [
        // Stage 1 placeholder — kept resolvable with its own ending entry.
        {
          id: "outcome_001_stage1",
          title: "Stage 1 verification complete",
          priority: 1,
          endingContentId: "ending_001_stage1",
          evaluationRule: { objectiveCompleted: "obj_001_verify_location" },
          effects: [],
        },
        // Ending A — Protected truth (docs/05 §5): core facts correct + MIO.
        // PRIORITY DESIGN: the docs' Ending A condition includes "Redact Maya's
        // location", but a fully-correct report with MIO-no-redact would match
        // NO ending (A needs redact; B needs forwarded/pelaga; C needs leak; D
        // needs a wrong claim). To avoid a no-match dead end, Ending A's rule
        // drops the redact requirement: all-4-correct + MIO → A. The
        // disclosure_redacts flag remains authored data (used by UI
        // presentation, not the rule).
        {
          id: "outcome_001_protected_truth",
          title: "Protected Truth",
          priority: 40,
          endingContentId: "ending_001_protected_truth",
          evaluationRule: {
            all: [
              { flagEquals: { key: "claim_claim_001_location_correct", value: true } },
              { flagEquals: { key: "claim_claim_001_ferry_record_correct", value: true } },
              { flagEquals: { key: "claim_claim_001_obstruction_correct", value: true } },
              { flagEquals: { key: "claim_claim_001_return_reason_correct", value: true } },
              { flagEquals: { key: "disclosure_recipient", value: "mio" } },
            ],
          },
          effects: [
            { type: "show_notification", notificationId: "notification_001_sera_trust" },
            { type: "show_notification", notificationId: "notification_001_blackbox_bounds" },
          ],
        },
        // Ending B — Official compliance (docs/05 §5): forwarded OR pelaga
        // stolen-data classification. Matches even when some facts are wrong
        // (docs: "Accept Pelaga narrative or submit weak contradiction").
        {
          id: "outcome_001_official_compliance",
          title: "Official Compliance",
          priority: 30,
          endingContentId: "ending_001_official_compliance",
          evaluationRule: {
            any: [
              { flagEquals: { key: "masked_forwarded", value: true } },
              { flagEquals: { key: "disclosure_recipient", value: "pelaga" } },
            ],
          },
          effects: [{ type: "show_notification", notificationId: "notification_001_blackbox_compliance" }],
        },
        // Ending C — Public exposure (docs/05 §5): leak to Open Signal.
        {
          id: "outcome_001_public_exposure",
          title: "Public Exposure",
          priority: 20,
          endingContentId: "ending_001_public_exposure",
          evaluationRule: { flagEquals: { key: "disclosure_recipient", value: "open_signal" } },
          effects: [],
        },
        // Ending D — Misidentified culprit (docs/05 §5): any claim answered
        // wrong. prepareSubmission ALWAYS sets all four claim_*_correct flags
        // (true or false), so this matches whenever any claim is wrong.
        {
          id: "outcome_001_misidentified",
          title: "Misidentified Culprit",
          priority: 10,
          endingContentId: "ending_001_misidentified",
          evaluationRule: {
            any: [
              { not: { flagEquals: { key: "claim_claim_001_location_correct", value: true } } },
              { not: { flagEquals: { key: "claim_claim_001_ferry_record_correct", value: true } } },
              { not: { flagEquals: { key: "claim_claim_001_obstruction_correct", value: true } } },
              { not: { flagEquals: { key: "claim_claim_001_return_reason_correct", value: true } } },
            ],
          },
          effects: [],
        },
      ],
      searchableIndex: [
        {
          entityId: "rec_001_ferry_departure",
          entityType: "record",
          title: "Ferry Departure Record",
          exactTerms: ["ferry", "departure", "ferry departure"],
          aliases: ["ferry record", "transit record"],
          partialTerms: ["ferry", "departure"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 10,
        },
        {
          entityId: "rec_001_emergency_call",
          entityType: "record",
          title: "North Barrier Emergency Call",
          exactTerms: ["emergency", "emergency call", "north barrier"],
          aliases: ["emergency call metadata", "north barrier call"],
          partialTerms: ["emergency", "north barrier"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 9,
        },
        {
          entityId: "rec_001_maya_profile",
          entityType: "record",
          title: "Maya Pranata — Employee Profile",
          exactTerms: ["maya", "maya pranata", "employee profile"],
          aliases: ["maya profile", "employee record"],
          partialTerms: ["maya", "pranata"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 8,
        },
        {
          entityId: "rec_001_sera_field_note",
          entityType: "record",
          title: "CIAB Field Note — Sera Wibawa",
          exactTerms: ["sera", "sera wibawa", "field note"],
          aliases: ["sera note", "ciab field note"],
          partialTerms: ["sera", "wibawa"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 7,
        },
        {
          entityId: "char_maya_pranata",
          entityType: "character",
          title: "Maya Pranata",
          exactTerms: ["maya", "maya pranata"],
          aliases: [],
          partialTerms: ["maya", "pranata"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 6,
        },
        {
          entityId: "char_sera_wibawa",
          entityType: "character",
          title: "Sera Wibawa",
          exactTerms: ["sera", "sera wibawa"],
          aliases: [],
          partialTerms: ["sera", "wibawa"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 5,
        },
        {
          entityId: "rec_001_ferry_baseline",
          entityType: "record",
          title: "Ferry Gate Baseline — Normal Departure Event",
          exactTerms: ["ferry", "baseline", "normal departure"],
          aliases: ["normal ferry event", "gate baseline"],
          partialTerms: ["ferry", "baseline", "normal"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 4,
        },
        {
          entityId: "rec_001_node7_summary",
          entityType: "record",
          title: "Node 7 Maintenance Summary",
          exactTerms: ["node 7", "maintenance"],
          aliases: ["node seven", "flood control"],
          partialTerms: ["node", "maintenance", "alert"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 3,
        },
        {
          entityId: "rec_001_manual_escalation",
          entityType: "record",
          title: "Manual Escalation — Node 7 Alert Suppression",
          exactTerms: ["escalation", "manual escalation"],
          aliases: ["escalation ticket"],
          partialTerms: ["escalation", "alert"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 2,
        },
        {
          entityId: "rec_001_corridor_access",
          entityType: "record",
          title: "North Barrier Corridor Access Log",
          exactTerms: ["corridor", "access log"],
          aliases: ["corridor access"],
          partialTerms: ["corridor", "access"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 2,
        },
        {
          entityId: "rec_001_reliability_report",
          entityType: "record",
          title: "Pelaga Public Reliability Report — November",
          exactTerms: ["reliability", "report"],
          aliases: ["public report"],
          partialTerms: ["reliability"],
          unavailableBehavior: "hidden",
          availabilityRule: { always: true },
          authoredRank: 1,
        },
        // Stage 5 checksum record — hidden until the player asks for proof
        // (docs/13 §4: "Ask masked contact for proof | Checksum record unlocks").
        {
          entityId: "rec_001_checksum_record",
          entityType: "record",
          title: "Anonymized Checksum Record",
          exactTerms: ["checksum", "proof"],
          aliases: ["checksum record", "verification record"],
          partialTerms: ["checksum"],
          unavailableBehavior: "hidden",
          availabilityRule: { flagEquals: { key: "masked_checksum_unlocked", value: true } },
          authoredRank: 1,
        },
      ],
      assetBundleId: "bundle_001_missing_signal",
    },
    characters: [
      // char_analyst_services — Stage 0 system sender for onboarding mail
      // (docs/05 Stage 0). Institutional sender only; the portrait asset is
      // never rendered as a speaker avatar (mail renders the displayName).
      {
        id: "char_analyst_services",
        displayName: "BLACKBOX Analyst Services",
        aliases: [],
        role: "BLACKBOX analyst services",
        organizationIds: [],
        publicProfile: {},
        portraitAssetId: "asset_maya_portrait",
        searchTerms: ["blackbox", "analyst", "services"],
        knownEvidenceIds: [],
      },
      {
        id: "char_maya_pranata",
        displayName: "Maya Pranata",
        aliases: ["maya"],
        role: "Senior Systems Engineer, Pelaga Systems",
        organizationIds: [],
        publicProfile: {},
        portraitAssetId: "asset_maya_portrait",
        searchTerms: ["maya", "maya pranata", "engineer"],
        knownEvidenceIds: ["ev_001_ferry_departure", "ev_001_emergency_call"],
      },
      {
        id: "char_sera_wibawa",
        displayName: "Sera Wibawa",
        aliases: ["sera"],
        role: "CIAB Field Investigator",
        organizationIds: [],
        publicProfile: {},
        portraitAssetId: "asset_sera_portrait",
        searchTerms: ["sera", "sera wibawa", "investigator"],
        knownEvidenceIds: [],
      },
      // char_masked_contact — Stage 5 anonymous sender (docs/05 L182). The
      // account's identity is NOT authored (SOURCE GAP: keep "Unknown"/"Masked
      // account"; no fabricated identity). The placeholder portrait reuses an
      // existing asset and is never rendered as a speaker avatar.
      {
        id: "char_masked_contact",
        displayName: "Masked account",
        aliases: [],
        role: "Unknown sender",
        organizationIds: [],
        publicProfile: {},
        portraitAssetId: "asset_maya_portrait",
        searchTerms: ["masked", "unknown"],
        knownEvidenceIds: [],
      },
    ],
    records: [
      {
        id: "rec_001_ferry_departure",
        caseId: "case_001_missing_signal",
        recordType: "transit_record",
        title: "Ferry Departure Record",
        body: {},
        source: { system: "ferry_archive" },
        createdAt: "2041-11-18T22:14:00+07:00",
        relatedEntityIds: ["char_maya_pranata"],
        searchTerms: ["ferry", "departure", "ferry departure", "transit"],
        aliases: [],
        availabilityRule: { always: true },
        evidenceId: "ev_001_ferry_departure",
        metadata: { departure_time: "22:14", date: "2041-11-18", gate: "Meridian Ferry Gate" },
      },
      {
        id: "rec_001_emergency_call",
        caseId: "case_001_missing_signal",
        recordType: "emergency_log",
        title: "North Barrier Emergency Call",
        body: {},
        source: { system: "emergency_dispatch" },
        createdAt: "2041-11-18T22:31:00+07:00",
        relatedEntityIds: ["char_maya_pranata"],
        searchTerms: ["emergency", "emergency call", "north barrier", "call"],
        aliases: [],
        availabilityRule: { always: true },
        evidenceId: "ev_001_emergency_call",
        metadata: { call_time: "22:31", date: "2041-11-18", location: "North Barrier, Sector 7" },
      },
      {
        id: "rec_001_maya_profile",
        caseId: "case_001_missing_signal",
        recordType: "employee_record",
        title: "Maya Pranata — Employee Profile",
        body: {},
        source: { system: "pelaga_hr" },
        createdAt: "2041-11-18T21:45:00+07:00",
        relatedEntityIds: ["char_maya_pranata"],
        searchTerms: ["maya", "maya pranata", "employee", "profile", "engineer"],
        aliases: [],
        availabilityRule: { always: true },
        metadata: { last_check_in: "2041-11-18T21:45", department: "Flood Control Node 7" },
      },
      {
        id: "rec_001_sera_field_note",
        caseId: "case_001_missing_signal",
        recordType: "field_note",
        title: "CIAB Field Note — Sera Wibawa",
        body: {},
        source: { system: "ciab_field" },
        createdAt: "2041-11-19T08:00:00+07:00",
        relatedEntityIds: ["char_sera_wibawa", "char_maya_pranata"],
        searchTerms: ["sera", "sera wibawa", "field note", "ciab"],
        aliases: [],
        availabilityRule: { always: true },
        metadata: {},
      },
      {
        id: "rec_001_ferry_baseline",
        caseId: "case_001_missing_signal",
        recordType: "transit_record",
        title: "Ferry Gate Baseline — Normal Departure Event",
        body: {},
        source: { system: "ferry_archive" },
        createdAt: "2041-11-17T08:00:00+07:00",
        relatedEntityIds: [],
        searchTerms: ["ferry", "baseline", "normal", "departure", "gate"],
        aliases: ["normal ferry event", "gate baseline"],
        availabilityRule: { always: true },
        metadata: {
          gate: "Meridian Ferry Gate",
          sync_delay_seconds: "2-8",
          location_proof: "Beacon and camera",
          account_signature: "Passenger token",
        },
      },
      // rec_001_node7_summary — flood-control Node 7 maintenance summary.
      // metadata.alerts_last_30_days is authored as a string ("≥ 160
      // low-confidence") to stay JSON-safe rather than a numeric threshold.
      {
        id: "rec_001_node7_summary",
        caseId: "case_001_missing_signal",
        recordType: "maintenance_summary",
        title: "Node 7 Maintenance Summary",
        body: {},
        source: { system: "pelaga_ops" },
        createdAt: "2041-11-18T21:00:00+07:00",
        relatedEntityIds: ["char_maya_pranata"],
        searchTerms: ["node 7", "maintenance", "flood control"],
        aliases: [],
        availabilityRule: { always: true },
        metadata: { alerts_last_30_days: "≥ 160 low-confidence", grouping: "auto-grouped as sensor noise" },
      },
      {
        id: "rec_001_manual_escalation",
        caseId: "case_001_missing_signal",
        recordType: "escalation_ticket",
        title: "Manual Escalation — Node 7 Alert Suppression",
        body: {},
        source: { system: "pelaga_mail_archive" },
        createdAt: "2041-11-17T14:20:00+07:00",
        relatedEntityIds: ["char_maya_pranata"],
        searchTerms: ["escalation", "maya", "node 7", "alert"],
        aliases: ["escalation ticket"],
        availabilityRule: { always: true },
        evidenceId: "ev_001_manual_escalation",
        metadata: { author: "Maya Pranata", subject: "Node 7 low-confidence alerts suppressed as noise" },
      },
      {
        id: "rec_001_corridor_access",
        caseId: "case_001_missing_signal",
        recordType: "access_log",
        title: "North Barrier Corridor Access Log",
        body: {},
        source: { system: "pelaga_access" },
        createdAt: "2041-11-18T22:31:10+07:00",
        relatedEntityIds: [],
        searchTerms: ["corridor", "access", "north barrier"],
        aliases: [],
        availabilityRule: { always: true },
        evidenceId: "ev_001_corridor_access",
        metadata: { corridor: "NB-7 maintenance corridor", badge: "Maya Pranata", initiator: "bbx_risk_orchestrator" },
      },
      // rec_001_reliability_report — Pelaga public reliability report that
      // omits the manual escalation (docs/05 L169). NO fabricated content
      // beyond that documented omission: metadata.mention_manual_escalation is
      // the authored fact, nothing else about the report's contents is invented.
      {
        id: "rec_001_reliability_report",
        caseId: "case_001_missing_signal",
        recordType: "public_report",
        title: "Pelaga Public Reliability Report — November",
        body: {},
        source: { system: "pelaga_public" },
        createdAt: "2041-11-19T09:00:00+07:00",
        relatedEntityIds: [],
        searchTerms: ["reliability", "report", "pelaga"],
        aliases: [],
        availabilityRule: { always: true },
        metadata: { mention_manual_escalation: false },
      },
      // rec_001_checksum_record — Stage 5 ask-proof branch (docs/05 L193).
      // SOURCE GAP: the checksum record's contents are not authored; only
      // fictional internal identifiers/metadata are used (no real crypto, no
      // realistic secrets). Hidden until the player asks for proof.
      {
        id: "rec_001_checksum_record",
        caseId: "case_001_missing_signal",
        recordType: "verification_record",
        title: "Anonymized Checksum Record",
        body: {},
        source: { system: "ciab_verification" },
        createdAt: "2041-11-20T10:00:00+07:00",
        relatedEntityIds: [],
        searchTerms: ["checksum", "proof", "anonymized"],
        aliases: ["checksum record"],
        availabilityRule: { flagEquals: { key: "masked_checksum_unlocked", value: true } },
        evidenceId: "ev_001_checksum_record",
        metadata: { checksum: "bbx-verify-7f3a91c4", note: "Anonymized verification hash for the masked contact's claim." },
      },
    ],
    evidence: [
      {
        // Stage 0 credential (docs/05 Stage 0). Discovery flows through the
        // mail attachment activation (message-detail.tsx dispatches
        // evidence_discovered directly); the discoveryRule documents that
        // mechanism rather than a record_opened path — no record carries it.
        id: "ev_000_analyst_credential",
        caseId: "case_001_missing_signal",
        title: "Analyst Credential",
        type: "document",
        summary: "Analyst session credential issued by BLACKBOX analyst services. Confirms identity and session allocation.",
        source: { system: "bbx_system" },
        occurredAt: "2041-11-18T21:30:00+07:00",
        tags: ["credential", "identity"],
        relatedEntityIds: [],
        assetIds: ["asset_000_analyst_credential"],
        discoveryRule: { eventOccurred: { type: "evidence_discovered", entityId: "ev_000_analyst_credential" } },
        optional: false,
        contested: false,
        redHerring: false,
        reportClaimsSupported: [],
      },
      {
        id: "ev_001_ferry_departure",
        caseId: "case_001_missing_signal",
        title: "Ferry Departure Record",
        type: "database_record",
        summary: "A transit event claims Maya Pranata departed Nusakara at 22:14 on 2041-11-18.",
        source: { system: "ferry_archive" },
        occurredAt: "2041-11-18T22:14:00+07:00",
        tags: ["transit", "maya", "departure"],
        relatedEntityIds: ["char_maya_pranata"],
        assetIds: ["asset_001_ferry_document"],
        discoveryRule: { eventOccurred: { type: "record_opened", entityId: "rec_001_ferry_departure" } },
        optional: false,
        contested: true,
        redHerring: false,
        reportClaimsSupported: [],
      },
      {
        id: "ev_001_emergency_call",
        caseId: "case_001_missing_signal",
        title: "North Barrier Emergency Call Metadata",
        type: "system_log",
        summary:
          "An emergency call linked to Maya Pranata's device was logged at North Barrier at 22:31 on 2041-11-18.",
        source: { system: "emergency_dispatch" },
        occurredAt: "2041-11-18T22:31:00+07:00",
        tags: ["emergency", "maya", "north barrier"],
        relatedEntityIds: ["char_maya_pranata"],
        assetIds: ["asset_001_emergency_document"],
        discoveryRule: { eventOccurred: { type: "record_opened", entityId: "rec_001_emergency_call" } },
        optional: false,
        contested: false,
        redHerring: false,
        reportClaimsSupported: [],
      },
      {
        id: "ev_001_replay_signature",
        caseId: "case_001_missing_signal",
        title: "Administrative Replay Signature",
        type: "system_log",
        summary:
          "Maya's ferry departure event was injected through an administrative replay service, not recorded by a physical terminal.",
        source: { system: "ferry_archive" },
        occurredAt: "2041-11-18T22:14:00+07:00",
        tags: ["ferry", "replay", "signature", "falsification"],
        relatedEntityIds: ["char_maya_pranata"],
        assetIds: ["asset_001_ferry_document"],
        discoveryRule: { eventOccurred: { type: "puzzle_completed", entityId: "puzzle_001_ferry_authenticity" } },
        optional: false,
        contested: true,
        redHerring: false,
        reportClaimsSupported: [],
      },
      // ev_001_node7_summary — Required, Records, Context (docs/05 evidence table)
      {
        id: "ev_001_node7_summary",
        caseId: "case_001_missing_signal",
        title: "Node 7 Maintenance Summary",
        type: "database_record",
        summary:
          "Node 7 generated repeated low-confidence maintenance alerts that were automatically grouped as sensor noise.",
        source: { system: "pelaga_ops" },
        occurredAt: "2041-11-18T21:00:00+07:00",
        tags: ["node 7", "maintenance", "noise"],
        relatedEntityIds: ["char_maya_pranata"],
        assetIds: ["asset_001_ferry_document"],
        discoveryRule: { eventOccurred: { type: "record_opened", entityId: "rec_001_node7_summary" } },
        optional: false,
        contested: false,
        redHerring: false,
        reportClaimsSupported: [],
      },
      // ev_001_manual_escalation — Required, Mail archive, Motive
      {
        id: "ev_001_manual_escalation",
        caseId: "case_001_missing_signal",
        title: "Maya's Escalation Ticket",
        type: "database_record",
        summary:
          "Maya manually escalated the Node 7 low-confidence alerts after they were auto-grouped as noise.",
        source: { system: "pelaga_mail_archive" },
        occurredAt: "2041-11-17T14:20:00+07:00",
        tags: ["maya", "escalation", "node 7"],
        relatedEntityIds: ["char_maya_pranata"],
        assetIds: [],
        discoveryRule: { eventOccurred: { type: "record_opened", entityId: "rec_001_manual_escalation" } },
        optional: false,
        contested: false,
        redHerring: false,
        reportClaimsSupported: [],
      },
      // ev_001_corridor_access — Required, Records, Opportunity and location
      {
        id: "ev_001_corridor_access",
        caseId: "case_001_missing_signal",
        title: "North Barrier Corridor Access Log",
        type: "system_log",
        summary:
          "Maya's badge opened the NB-7 corridor after curfew on the night of her disappearance.",
        source: { system: "pelaga_access" },
        occurredAt: "2041-11-18T22:31:10+07:00",
        tags: ["corridor", "access", "north barrier"],
        relatedEntityIds: ["char_maya_pranata"],
        assetIds: ["asset_001_ferry_document"],
        discoveryRule: { eventOccurred: { type: "record_opened", entityId: "rec_001_corridor_access" } },
        optional: false,
        contested: false,
        redHerring: false,
        reportClaimsSupported: [],
      },
      // ev_001_diagnostic_note — Conditional, Tablet, Suppression proof.
      // OPTIONAL; unlocked ONLY by the Stage 3 Option 2 flag (flag-gated
      // trigger, not search-gated). Never required for Stage 4 completion.
      {
        id: "ev_001_diagnostic_note",
        caseId: "case_001_missing_signal",
        title: "Maya's Diagnostic Note",
        type: "document",
        summary:
          "Maya's offline note explaining that remote Node 7 records were being suppressed and the diagnostic archive must be collected locally.",
        source: { system: "sera_field" },
        occurredAt: "2041-11-18T22:00:00+07:00",
        tags: ["maya", "diagnostic", "suppression"],
        relatedEntityIds: ["char_maya_pranata"],
        assetIds: [],
        discoveryRule: { flagEquals: { key: "tablet_path_offline", value: true } },
        optional: true,
        contested: false,
        redHerring: false,
        reportClaimsSupported: [],
      },
      // ev_001_isolation_event — Optional/meta, System log, Meta mystery.
      // OPTIONAL; discovered as a side companion on corridor access. Must NOT
      // appear in any completion rule (docs/05 L170 + no-dead-end rule).
      {
        id: "ev_001_isolation_event",
        caseId: "case_001_missing_signal",
        title: "System Isolation Event — NB-7 Corridor",
        type: "system_log",
        summary:
          "A corridor isolation event was initiated by an automated risk orchestrator, not a human security terminal.",
        source: { system: "bbx_system" },
        occurredAt: "2041-11-18T22:31:20+07:00",
        tags: ["isolation", "corridor", "system"],
        relatedEntityIds: [],
        assetIds: [],
        discoveryRule: { eventOccurred: { type: "record_opened", entityId: "rec_001_corridor_access" } },
        optional: true,
        contested: true,
        redHerring: false,
        reportClaimsSupported: [],
      },
      // ev_001_checksum_record — Stage 5 ask-proof branch (docs/05 §7 matrix:
      // "Ask masked contact for proof | Checksum record unlocks"). OPTIONAL,
      // flag-gated (NOT search-gated); never required for completion.
      {
        id: "ev_001_checksum_record",
        caseId: "case_001_missing_signal",
        title: "Anonymized Checksum Record",
        type: "database_record",
        summary: "An anonymized verification record supporting the masked contact's claim about the exit record.",
        source: { system: "ciab_verification" },
        occurredAt: "2041-11-20T10:00:00+07:00",
        tags: ["checksum", "masked", "verification"],
        relatedEntityIds: [],
        assetIds: [],
        discoveryRule: { flagEquals: { key: "masked_checksum_unlocked", value: true } },
        optional: true,
        contested: false,
        redHerring: false,
        reportClaimsSupported: [],
      },
    ],
    hints: CASE_001_HINTS,
    dialogue: [
      // Stage 0 — onboarding mail (docs/05 Stage 0). Neutral institutional
      // prose only; no case lore. The credential attachment is activated by the
      // player in Mail (message-detail.tsx dispatches evidence_discovered for
      // ev_000_analyst_credential via the asset→evidence reverse lookup).
      {
        id: "dialogue_000_onboarding_briefing",
        channelId: CASE_001_MAIL_CHANNEL_ID,
        speakerId: "char_analyst_services",
        text: "Welcome to BLACKBOX. Your analyst session has been allocated. Review the attached credential and confirm your identity to begin case assignment. The system is monitored; keep this terminal in a secure environment.",
        enterRule: { always: true },
        attachments: ["asset_000_analyst_credential"],
      },
      {
        id: "dialogue_000_identity_confirmation",
        channelId: CASE_001_MAIL_CHANNEL_ID,
        speakerId: "char_analyst_services",
        text: "Analyst identity confirmation: you are bound by the analyst charter to act only on case data. Confirm your identity to proceed.",
        enterRule: { always: true },
        choices: [
          {
            id: "choice_000_confirm_identity",
            label: "Confirm analyst identity",
            // trigger_000_confirmation_complete drives completion via
            // discovery + choice; the choice needs no consequences.
            consequences: [],
            nextNodeId: "dialogue_000_identity_ack",
          },
        ],
      },
      {
        id: "dialogue_000_identity_ack",
        channelId: CASE_001_MAIL_CHANNEL_ID,
        speakerId: "char_analyst_services",
        text: "Identity confirmed. Case allocation in progress.",
        enterRule: { always: true },
      },
      {
        id: "dialogue_001_sera_intro",
        channelId: CASE_001_MAIL_CHANNEL_ID,
        speakerId: "char_sera_wibawa",
        text: "Pelaga Systems engineer Maya Pranata failed to report for a scheduled emergency maintenance review. Pelaga claims she voluntarily left the city after mishandling restricted data. Her transit account shows a ferry departure at 22:14. I am requesting verification because the departure record conflicts with an emergency call from the North Barrier logged at 22:31. Please verify Maya's final confirmed location.",
        enterRule: { always: true },
      },
      // Stage 3 — the Sera tablet decision (docs/05 Stage 3).
      // SOURCE GAP (docs/05 L156, Option 1): "some data is automatically
      // redacted" — no doc names WHICH data. Represented ONLY by the generic
      // tablet_path_ciab flag; no redacted content is fabricated. If future
      // content specifies redactions, author them then.
      // SOURCE GAP (docs/05 L158, Option 3): "one optional record becomes
      // unavailable" — no doc names the record. No record is removed or gated
      // this slice; the availabilityRule flagEquals mechanism stays available
      // for future authored content.
      {
        id: "dialogue_001_stage3_pressure",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_sera_wibawa",
        text: "Found a damaged service tablet near Node 7. It likely belonged to Maya. What should I do with it?",
        enterRule: { always: true },
        choices: [
          {
            id: "choice_001_stage3_ciab",
            label: "Send it directly to CIAB",
            consequences: [
              { type: "set_flag", key: "tablet_path_ciab", value: true },
              { type: "queue_dialogue", nodeId: "dialogue_001_stage3_reply_ciab" },
            ],
            nextNodeId: "dialogue_001_stage3_reply_ciab",
          },
          {
            id: "choice_001_stage3_offline",
            label: "Let Sera inspect it offline first",
            consequences: [
              { type: "set_flag", key: "tablet_path_offline", value: true },
              // sera_trust_increased: authored boolean recording the documented Option-2
              // consequence (docs/05: "increases Sera's trust"). Permitted by ADR-008 (no
              // numeric trust meter; the flag is never displayed). Currently unread by any
              // rule — reserved as a progression seed for future dialogue/ending content.
              { type: "set_flag", key: "sera_trust_increased", value: true },
              { type: "queue_dialogue", nodeId: "dialogue_001_stage3_reply_offline" },
            ],
            nextNodeId: "dialogue_001_stage3_reply_offline",
          },
          {
            id: "choice_001_stage3_pelaga",
            label: "Hand it to Pelaga security",
            consequences: [
              { type: "set_flag", key: "tablet_path_pelaga", value: true },
              { type: "queue_dialogue", nodeId: "dialogue_001_stage3_reply_pelaga" },
            ],
            nextNodeId: "dialogue_001_stage3_reply_pelaga",
          },
        ],
      },
      // Follow-up reply nodes: text stays within docs/05 Stage 3 consequences.
      {
        id: "dialogue_001_stage3_reply_ciab",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_sera_wibawa",
        text: "Understood — sending it up the standard chain. Some data will be automatically redacted by intake.",
        enterRule: { always: true },
      },
      {
        id: "dialogue_001_stage3_reply_offline",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_sera_wibawa",
        text: "Good — that keeps the diagnostics intact. I'll copy anything Maya left readable and flag what matters for Node 7.",
        enterRule: { always: true },
      },
      {
        // SOURCE GAP: docs/05 only says "Reno responds quickly" (L158). Reno's
        // exact words are NOT fabricated — this text stays within that
        // documented response and does not invent further dialogue.
        id: "dialogue_001_stage3_reply_pelaga",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_sera_wibawa",
        text: "Alright. Pelaga is responding quickly — Reno is already asking about the tablet. I'll keep the chain aware of what I saw.",
        enterRule: { always: true },
      },
      // Stage 5 — the masked contact (docs/05 Stage 5). The message text is
      // authored verbatim from docs/05 L184. The sender is a MASKED account
      // (identity unspecified — SOURCE GAP: no fabricated identity).
      {
        id: "dialogue_001_stage5_masked",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_masked_contact",
        text: "The system is showing you the exit record because it wants the case closed.",
        enterRule: { always: true },
        choices: [
          {
            id: "choice_001_stage5_ignore",
            label: "Ignore",
            consequences: [{ type: "set_flag", key: "masked_ignored", value: true }],
            nextNodeId: "dialogue_001_stage5_ignored",
          },
          {
            id: "choice_001_stage5_proof",
            label: "Ask for proof",
            consequences: [
              { type: "set_flag", key: "masked_proof_requested", value: true },
              { type: "set_flag", key: "masked_checksum_unlocked", value: true },
              { type: "queue_dialogue", nodeId: "dialogue_001_stage5_proof_reply" },
            ],
            nextNodeId: "dialogue_001_stage5_proof_reply",
          },
          {
            id: "choice_001_stage5_identity",
            label: "Demand identity",
            consequences: [{ type: "set_flag", key: "masked_identity_demanded", value: true }],
            nextNodeId: "dialogue_001_stage5_identity_reply",
          },
          {
            id: "choice_001_stage5_forward",
            label: "Forward the message to CIAB",
            consequences: [{ type: "set_flag", key: "masked_forwarded", value: true }],
            nextNodeId: "dialogue_001_stage5_forward_reply",
          },
        ],
      },
      // Stage 5 reply nodes — text stays within docs/05 Stage 5 consequences.
      // The checksum record unlock is recorded via trigger_005_checksum_discovery
      // (flag-gated), NOT a dialogue effect.
      {
        id: "dialogue_001_stage5_ignored",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_masked_contact",
        text: "No reply.",
        enterRule: { always: true },
      },
      {
        id: "dialogue_001_stage5_proof_reply",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_masked_contact",
        text: "A checksum record has been made available.",
        enterRule: { always: true },
      },
      {
        id: "dialogue_001_stage5_identity_reply",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_masked_contact",
        text: "Identity withheld.",
        enterRule: { always: true },
      },
      {
        id: "dialogue_001_stage5_forward_reply",
        channelId: CASE_001_MESSENGER_CHANNEL_ID,
        speakerId: "char_masked_contact",
        text: "Acknowledged. Compliance note recorded.",
        enterRule: { always: true },
      },
    ],
    conclusions: [
      {
        // Stage 6 conclusion (docs/05 Stage 6) — four claims + four disclosure
        // choices. Claim answers authored from docs/05 (Claim A: North Barrier
        // maintenance corridor; B: Falsified through administrative replay; C:
        // Reno Adikara best-supported; D: Preserve or retrieve Node 7
        // diagnostic evidence).
        id: "conclusion_001_missing_signal",
        caseId: "case_001_missing_signal",
        claimSlots: [
          {
            id: "claim_001_location",
            prompt: "Final confirmed location",
            answerOptions: [
              { id: "claim_001_location_north_barrier", label: "North Barrier maintenance corridor", correct: true },
              { id: "claim_001_location_ferry", label: "Ferry to the mainland" },
              { id: "claim_001_location_unknown", label: "Unknown — left the city" },
            ],
            supportedByEvidenceIds: ["ev_001_corridor_access", "ev_001_emergency_call"],
          },
          {
            id: "claim_001_ferry_record",
            prompt: "Ferry record",
            answerOptions: [
              { id: "claim_001_ferry_authentic", label: "Authentic — she departed" },
              { id: "claim_001_ferry_forged", label: "Falsified through administrative replay", correct: true },
            ],
            supportedByEvidenceIds: ["ev_001_replay_signature"],
          },
          {
            id: "claim_001_obstruction",
            prompt: "Primary human obstruction",
            answerOptions: [
              { id: "claim_001_obstruction_reno", label: "Reno Adikara", correct: true },
              { id: "claim_001_obstruction_nara", label: "Nara Santoso" },
              { id: "claim_001_obstruction_sera", label: "Sera Wibawa" },
            ],
            supportedByEvidenceIds: ["ev_001_replay_signature", "ev_001_manual_escalation"],
          },
          {
            id: "claim_001_return_reason",
            prompt: "Reason Maya returned",
            answerOptions: [
              { id: "claim_001_reason_sabotage", label: "To sabotage Node 7" },
              { id: "claim_001_reason_evidence", label: "To preserve or retrieve Node 7 diagnostic evidence", correct: true },
              { id: "claim_001_reason_meeting", label: "To meet a contact" },
            ],
            supportedByEvidenceIds: ["ev_001_manual_escalation", "ev_001_diagnostic_note"],
          },
        ],
        evidenceSlotCount: 3,
        disclosureChoices: [
          { id: "disclosure_001_mio_full", label: "Submit the full diagnostic archive to MIO", recipient: "mio" },
          {
            id: "disclosure_001_mio_redacted",
            label: "Submit obstruction evidence with Maya's location redacted",
            recipient: "mio",
            redactsLocation: true,
          },
          {
            id: "disclosure_001_pelaga",
            label: "Follow Pelaga's request and classify the archive as stolen data",
            recipient: "pelaga",
          },
          { id: "disclosure_001_open_signal", label: "Leak the archive to Open Signal", recipient: "open_signal" },
        ],
      },
    ],
    assets: [
      {
        id: "asset_000_analyst_credential",
        type: "document",
        sourcePath: "assets/case_001/analyst-credential.svg",
        optimizedPath: "assets/case_001/analyst-credential.svg",
        license: "original",
        creator: "BLACKBOX team",
        provenanceNote: "Original placeholder credential document for Stage 0 onboarding slice.",
        caseIds: ["case_001_missing_signal"],
        preload: "none",
      },
      {
        id: "asset_maya_portrait",
        type: "image",
        sourcePath: "assets/case_001/maya-portrait.png",
        optimizedPath: "assets/case_001/maya-portrait.webp",
        license: "original",
        creator: "BLACKBOX team",
        provenanceNote: "Original placeholder portrait for Case 001 vertical slice.",
        caseIds: ["case_001_missing_signal"],
        preload: "none",
      },
      {
        id: "asset_sera_portrait",
        type: "image",
        sourcePath: "assets/case_001/sera-portrait.png",
        optimizedPath: "assets/case_001/sera-portrait.webp",
        license: "original",
        creator: "BLACKBOX team",
        provenanceNote: "Original placeholder portrait for Case 001 vertical slice.",
        caseIds: ["case_001_missing_signal"],
        preload: "none",
      },
      {
        id: "asset_001_ferry_document",
        type: "document",
        sourcePath: "assets/case_001/ferry-departure.png",
        optimizedPath: "assets/case_001/ferry-departure.webp",
        license: "original",
        creator: "BLACKBOX team",
        provenanceNote: "Original placeholder document for Case 001 vertical slice.",
        caseIds: ["case_001_missing_signal"],
        preload: "none",
      },
      {
        id: "asset_001_emergency_document",
        type: "document",
        sourcePath: "assets/case_001/emergency-call.png",
        optimizedPath: "assets/case_001/emergency-call.webp",
        license: "original",
        creator: "BLACKBOX team",
        provenanceNote: "Original placeholder document for Case 001 vertical slice.",
        caseIds: ["case_001_missing_signal"],
        preload: "none",
      },
    ],
    notifications: [
      { id: "notification_000_briefing", text: "New briefing received. Review your analyst credential.", priority: "informational" },
      { id: "notification_001_sera_trust", text: "Sera: Maya is safe for now. Thank you.", priority: "message" },
      { id: "notification_001_blackbox_bounds", text: "BLACKBOX: analyst deviation within acceptable bounds.", priority: "system_anomaly" },
      { id: "notification_001_blackbox_compliance", text: "BLACKBOX: procedural consistency acknowledged.", priority: "system_anomaly" },
      { id: "notification_001_blackbox_meta", text: "ANALYST MODEL: RESISTS RECOMMENDED CLOSURE", priority: "system_anomaly" },
    ],
    endings: [
      // Stage 1 placeholder — keeps the mid-case checkpoint resolvable.
      { id: "ending_001_stage1", caseId: "case_001_missing_signal", title: "Stage 1 complete", body: {} },
      // Ending A — Protected truth (docs/05 §5 outcome text verbatim).
      {
        id: "ending_001_protected_truth",
        caseId: "case_001_missing_signal",
        title: "Protected Truth",
        body: {
          sections: [
            "MIO opens a limited review.",
            "Maya remains protected.",
            "Sera sends a cautious message of trust.",
            "BLACKBOX records: 'analyst deviation within acceptable bounds.'",
          ],
        },
      },
      // Ending B — Official compliance (docs/05 §5 outcome text verbatim).
      {
        id: "ending_001_official_compliance",
        caseId: "case_001_missing_signal",
        title: "Official Compliance",
        body: {
          sections: [
            "The case closes as a voluntary departure.",
            "Reno Adikara is cleared.",
            "A flood alert later appears from Node 7.",
            "BLACKBOX congratulates the analyst for procedural consistency.",
          ],
        },
      },
      // Ending C — Public exposure (docs/05 §5 outcome text verbatim).
      {
        id: "ending_001_public_exposure",
        caseId: "case_001_missing_signal",
        title: "Public Exposure",
        body: {
          sections: [
            "The suppression becomes public.",
            "Maya's shelter is compromised.",
            "Pelaga faces scrutiny.",
            "Sera questions whether the exposure protected anyone.",
          ],
        },
      },
      // Ending D — Misidentified culprit (docs/05 §5 outcome text verbatim).
      {
        id: "ending_001_misidentified",
        caseId: "case_001_missing_signal",
        title: "Misidentified Culprit",
        body: {
          sections: [
            "The accused person is investigated.",
            "Reno retains control of the narrative.",
            "A post-case contradiction demonstrates the error.",
          ],
        },
      },
      // Hidden meta epilogue (docs/05 §5) — isHiddenMeta, not a fifth primary
      // ending. Reached via trigger_006_meta_flag (isolation discovered AND
      // NOT forwarded → hidden system log after credits).
      {
        id: "ending_001_blackbox_meta",
        caseId: "case_001_missing_signal",
        title: "Analyst Model",
        body: { sections: ["ANALYST MODEL: RESISTS RECOMMENDED CLOSURE"] },
        isHiddenMeta: true,
      },
    ],
    puzzles: [
      {
        kind: "signal_comparison",
        id: "puzzle_001_ferry_authenticity",
        caseId: "case_001_missing_signal",
        title: "Ferry event signature comparison",
        referenceLabel: "Normal ferry event",
        disputedLabel: "Maya ferry event",
        sourceEvidenceId: "ev_001_ferry_departure",
        referenceRecordId: "rec_001_ferry_baseline",
        solutionEvidenceId: "ev_001_replay_signature",
        properties: [
          {
            id: "property_gate_device",
            label: "Gate device",
            referenceValue: "Physical terminal",
            disputedValue: "Replication service",
            decisive: true,
          },
          {
            id: "property_location_proof",
            label: "Location proof",
            referenceValue: "Beacon and camera",
            disputedValue: "Beacon only",
            decisive: false,
          },
          {
            id: "property_account_signature",
            label: "Account signature",
            referenceValue: "Passenger token",
            disputedValue: "Administrative replay token",
            decisive: true,
          },
          {
            id: "property_sync_delay",
            label: "Sync delay",
            referenceValue: "2–8 seconds",
            disputedValue: "19 minutes",
            decisive: false,
          },
        ],
        conclusionText: "The ferry departure was injected through an administrative replay service.",
      },
    ],
  });

  if (!validateContentBundle(parsed).success) {
    throw new Error(`validateContentBundle failed for ${parsed.case.id}`);
  }

  return {
    content: parsed,
    // Fresh sessions start in Stage 0: case_000_bootstrap fires
    // trigger_000_bootstrap only. Legacy saves restore their own persisted
    // state (trigger_001_bootstrap already fired) and never see Stage 0.
    initialState: stepCaseEngine(
      createInitialEngineState(),
      { kind: "game_event", event: { type: "case_000_bootstrap" } },
      parsed,
    ).state,
  };
}