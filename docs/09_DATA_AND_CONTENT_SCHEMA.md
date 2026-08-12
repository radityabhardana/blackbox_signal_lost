# Data and Content Schema

## 1. Purpose

All case content must be authored as validated data. UI components must not contain story-specific conditions.

Recommended format:

- JSON for machine-authored and generated data
- YAML may be used for human drafting only if converted and validated
- Markdown for long record bodies when explicitly supported

## 2. ID conventions

Format:

```text
<type>_<case-or-domain>_<descriptive_name>
```

Examples:

```text
case_001_missing_signal
ev_001_ferry_departure
char_maya_pranata
msg_001_sera_intro
obj_001_verify_location
puz_001_replay_signature
out_001_protected_truth
```

Rules:

- lowercase snake_case
- globally stable
- never reused
- no spaces
- no environment-specific IDs

## 3. Case manifest

```ts
interface CaseManifest {
  id: string;
  version: string;
  title: string;
  subtitle?: string;
  estimatedMinutes: number;
  entryStageId: string;
  stages: CaseStage[];
  entities: EntityReference[];
  objectives: ObjectiveDefinition[];
  triggers: TriggerDefinition[];
  outcomes: OutcomeDefinition[];
  searchableIndex: SearchIndexEntry[];
  assetBundleId: string;
}
```

## 4. Evidence schema

```ts
type EvidenceType =
  | "document"
  | "image"
  | "audio"
  | "video"
  | "database_record"
  | "message"
  | "system_log"
  | "location"
  | "testimony";

interface EvidenceDefinition {
  id: string;
  caseId: string;
  title: string;
  type: EvidenceType;
  summary: string;
  source: SourceDescriptor;
  occurredAt?: string;
  recordedAt?: string;
  confidence?: "low" | "medium" | "high" | "unknown";
  tags: string[];
  relatedEntityIds: string[];
  assetIds: string[];
  discoveryRule: RuleExpression;
  optional: boolean;
  contested: boolean;
  redHerring: boolean;
  reportClaimsSupported: string[];
  accessibilityDescription?: string;
}
```

## 5. Character schema

```ts
interface CharacterDefinition {
  id: string;
  displayName: string;
  aliases: string[];
  role: string;
  organizationIds: string[];
  publicProfile: RichTextDocument;
  portraitAssetId: string;
  searchTerms: string[];
  knownEvidenceIds: string[];
  privateAuthorNotes?: string;
}
```

`privateAuthorNotes` must never be delivered to the browser in production bundles.

## 6. Record schema

```ts
interface RecordDefinition {
  id: string;
  caseId: string;
  recordType: string;
  title: string;
  body: RichTextDocument;
  source: SourceDescriptor;
  createdAt: string;
  revisedAt?: string;
  relatedEntityIds: string[];
  searchTerms: string[];
  aliases: string[];
  availabilityRule: RuleExpression;
  evidenceId?: string;
  metadata: Record<string, string | number | boolean | null>;
}
```

## 7. Dialogue schema

```ts
interface DialogueNode {
  id: string;
  channelId: string;
  speakerId: string;
  text: string;
  sentAtNarrativeTime?: string;
  enterRule: RuleExpression;
  choices?: DialogueChoice[];
  nextNodeId?: string;
  attachments?: string[];
}

interface DialogueChoice {
  id: string;
  label: string;
  consequences: GameEffect[];
  nextNodeId: string;
}
```

Rules:

- Each choice label must accurately represent its action.
- Do not hide major irreversible behavior behind vague wording.
- A choice can change flags, unlock records, and alter later dialogue.
- Avoid more than four simultaneous choices.

## 8. Objective schema

```ts
interface ObjectiveDefinition {
  id: string;
  title: string;
  description: string;
  optional: boolean;
  startRule: RuleExpression;
  completionRule: RuleExpression;
  hintIds: string[];
  nextObjectiveIds: string[];
}
```

## 9. Hint schema

```ts
interface HintDefinition {
  id: string;
  objectiveId: string;
  tier: 1 | 2 | 3 | 4;
  text: string;
}
```

Each objective should have a complete ladder before release.

## 10. Trigger schema

```ts
interface TriggerDefinition {
  id: string;
  once: boolean;
  priority: number;
  rule: RuleExpression;
  effects: GameEffect[];
}
```

Possible effects:

```ts
type GameEffect =
  | { type: "unlock_record"; recordId: string }
  | { type: "unlock_application"; applicationId: string }
  | { type: "queue_dialogue"; nodeId: string }
  | { type: "start_objective"; objectiveId: string }
  | { type: "complete_objective"; objectiveId: string }
  | { type: "set_flag"; key: string; value: string | number | boolean }
  | { type: "discover_evidence"; evidenceId: string }
  | { type: "play_audio_cue"; assetId: string }
  | { type: "show_notification"; notificationId: string }; // resolves to NotificationDefinition (§19)
```

## 11. Rule expression

```ts
type RuleExpression =
  | { always: true }
  | { all: RuleExpression[] }
  | { any: RuleExpression[] }
  | { not: RuleExpression }
  | { flagEquals: { key: string; value: string | number | boolean } }
  | { eventOccurred: { type: string; entityId?: string } }
  | { entityDiscovered: string }
  | { objectiveCompleted: string }
  | { choiceSelected: string }
  | { countAtLeast: { eventType: string; count: number } };
```

Keep the rule language closed and documented. Do not evaluate arbitrary JavaScript from content.

## 12. Search index schema

```ts
interface SearchIndexEntry {
  entityId: string;
  entityType: "record" | "character" | "organization" | "location";
  title: string;
  exactTerms: string[];
  aliases: string[];
  partialTerms: string[];
  unavailableBehavior: "hidden" | "classified_placeholder";
  availabilityRule: RuleExpression;
  authoredRank: number;
}
```

## 13. Conclusion schema

```ts
interface ConclusionDefinition {
  id: string;
  caseId: string;
  claimSlots: ClaimSlotDefinition[];
  evidenceSlotCount: number;
  disclosureChoices: DisclosureChoiceDefinition[];
}

interface OutcomeDefinition {
  id: string;
  title: string;
  evaluationRule: RuleExpression;
  priority: number;
  endingContentId: string;
  effects: GameEffect[];
}
```

Outcome rules must be mutually understandable. When multiple outcomes match, highest priority wins and tests must prove intended ordering.

## 14. Save schema

```ts
interface SaveGame {
  saveSchemaVersion: number;
  contentVersion: string;
  applicationVersion: string;
  slotId: string;
  updatedAt: string;
  currentCaseId: string;
  gameEvents: GameEvent[];
  sessionSnapshot: SessionSnapshot;
  uiSnapshot: UiSnapshot;
  settings: PlayerSettings;
  checksum: string;
}
```

Do not save author-only fields.

## 15. Asset schema

```ts
interface AssetDefinition {
  id: string;
  type: "image" | "audio" | "video" | "font" | "document";
  sourcePath: string;
  optimizedPath: string;
  altText?: string;
  transcriptPath?: string;
  license: string;
  creator: string;
  provenanceNote: string;
  caseIds: string[];
  preload: "none" | "stage" | "immediate";
}
```

## 16. Content validation rules

A case build fails when:

- an ID is duplicated,
- a reference is missing,
- an outcome has no ending,
- a required objective has no completion path,
- evidence supports a missing claim,
- a required audio item lacks a transcript,
- a search term maps to an author-only record,
- an asset lacks provenance,
- a trigger creates an impossible loop,
- or save-incompatible content changes omit a version increment.

## 17. Content compilation

```text
Author content
  → schema validation
  → reference validation
  → reachability analysis
  → search-index generation
  → author-only field removal
  → production content bundle
  → asset bundle manifest
```

## 18. Example evidence JSON

```json
{
  "id": "ev_001_ferry_departure",
  "caseId": "case_001_missing_signal",
  "title": "Ferry Departure Record",
  "type": "database_record",
  "summary": "A transit event claims Maya departed Nusakara at 22:14.",
  "source": {
    "organizationId": "org_nta",
    "system": "ferry_archive"
  },
  "occurredAt": "2041-11-18T22:14:00+07:00",
  "confidence": "high",
  "tags": ["transit", "maya", "departure"],
  "relatedEntityIds": ["char_maya_pranata", "loc_meridian_ferry_gate"],
  "assetIds": [],
  "discoveryRule": {
    "eventOccurred": {
      "type": "record_opened",
      "entityId": "rec_001_ferry_departure"
    }
  },
  "optional": false,
  "contested": true,
  "redHerring": false,
  "reportClaimsSupported": ["claim_ferry_record_false"]
}
```

## 19. Notification schema

Notification definitions own the authored presentation content of runtime
notifications. They are referenced by the `show_notification` game effect
(`notificationId` resolves to a `NotificationDefinition` id; unresolved or
wrong-kind references fail content validation, see §16).

```ts
interface NotificationDefinition {
  id: string;                         // stable lowercase snake_case id
  text: string;                       // plain text, no markdown/HTML
  priority:
    | "informational"
    | "discovery"
    | "message"
    | "urgent"
    | "system_anomaly";
}
```

The priority tier set comes directly from docs/07 §14 (Informational,
Discovery, Message, Urgent, System anomaly). No other presentation metadata is
defined: there is no title, sender, icon, timestamp, target/deep-link, read
state, dismiss state, or sound.

The ContentBundle envelope carries `notifications: NotificationDefinition[]`.
The collection defaults to an empty array so pre-existing bundles parse
unchanged; the parsed runtime bundle always exposes a deterministic
`notifications` array. Runtime identity and history remain BBX-022-owned:
`CaseEngineState.notifications` is an append-only id queue written by
`show_notification` (duplicates allowed, engine order preserved).