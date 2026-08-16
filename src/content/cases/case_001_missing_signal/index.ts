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
        },
      ],
      triggers: [
        {
          id: "trigger_001_bootstrap",
          once: true,
          priority: 100,
          rule: { eventOccurred: { type: "case_001_bootstrap" } },
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
      ],
      outcomes: [
        {
          id: "outcome_001_stage1",
          title: "Stage 1 verification complete",
          priority: 1,
          endingContentId: "ending_001_stage1",
          evaluationRule: { objectiveCompleted: "obj_001_verify_location" },
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
      ],
      assetBundleId: "bundle_001_missing_signal",
    },
    characters: [
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
    ],
    evidence: [
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
    ],
    hints: CASE_001_HINTS,
    dialogue: [
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
    ],
    conclusions: [
      {
        id: "conclusion_001_missing_signal",
        caseId: "case_001_missing_signal",
        claimSlots: [],
        evidenceSlotCount: 3,
        disclosureChoices: [],
      },
    ],
    assets: [
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
    notifications: [],
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
    initialState: stepCaseEngine(
      createInitialEngineState(),
      { kind: "game_event", event: { type: "case_001_bootstrap" } },
      parsed,
    ).state,
  };
}