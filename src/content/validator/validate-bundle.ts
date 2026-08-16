import type {
  ContentBundle,
  EntityKind,
  ValidationIssue,
  ValidationIssueCode,
  ValidationResult,
} from "./types";
import type { RuleExpression, GameEffect } from "../schemas";

type Owner = { entityType: string; entityId: string };
type RegistryEntry = { kind: EntityKind; owner: Owner };
type Registry = Map<string, RegistryEntry>;

interface Registration {
  id: string;
  kind: EntityKind;
  owner: Owner;
}

const KIND_LABELS: Record<EntityKind, string> = {
  case: "case",
  character: "character",
  record: "record",
  evidence: "evidence",
  objective: "objective",
  trigger: "trigger",
  hint: "hint",
  dialogue_node: "dialogue node",
  dialogue_choice: "dialogue choice",
  outcome: "outcome",
  conclusion: "conclusion",
  asset: "asset",
  notification: "notification",
  puzzle: "puzzle",
};

/**
 * BBX-024 static content-integrity validator.
 *
 * Checks, purely from the bundle's documented static content, that: every
 * readable ID is globally unique, every VALIDATE-class reference resolves to
 * an entity of the expected kind, caseId fields match the manifest, hint and
 * objective ownership agree, objectives have hints, and audio assets carry a
 * transcript. It never evaluates rules, executes effects, or simulates
 * runtime reachability (those remain BBX-021/022/105). All maps are local to
 * one call; the input is never mutated.
 */
export function validateContentBundle(bundle: ContentBundle): ValidationResult {
  const issues: ValidationIssue[] = [];
  const registry: Registry = new Map();
  const hintsById = new Map<string, { objectiveId: string }>();

  for (const registration of buildRegistrations(bundle, hintsById)) {
    const existing = registry.get(registration.id);
    if (existing) {
      issues.push(
        makeIssue({
          code: "duplicate_id",
          entityType: registration.owner.entityType,
          entityId: registration.owner.entityId,
          path: "id",
          referencedId: registration.id,
          reason: `duplicate id '${registration.id}' (already used by ${existing.owner.entityType} '${existing.owner.entityId}')`,
        }),
      );
      continue;
    }
    registry.set(registration.id, { kind: registration.kind, owner: registration.owner });
  }

  const caseId = bundle.case.id;
  validateObjectives(bundle, registry, hintsById, issues);
  validateHints(bundle, registry, issues);
  validateCharacters(bundle, registry, issues);
  validateRecords(bundle, registry, caseId, issues);
  validateEvidence(bundle, registry, caseId, issues);
  validateDialogue(bundle, registry, issues);
  validateTriggers(bundle.case.triggers, registry, issues);
  validateOutcomes(bundle.case.outcomes, registry, issues);
  validateSearchIndex(bundle.case.searchableIndex, registry, issues);
  validateAssets(bundle, caseId, issues);
  validateConclusions(bundle, caseId, issues);
  validatePuzzles(bundle, registry, caseId, issues);

  return issues.length === 0 ? { success: true } : { success: false, issues: sortIssues(issues) };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

function buildRegistrations(
  bundle: ContentBundle,
  hintsById: Map<string, { objectiveId: string }>,
): Registration[] {
  const registrations: Registration[] = [];
  const manifest = bundle.case;

  registrations.push({ id: manifest.id, kind: "case", owner: { entityType: "case", entityId: manifest.id } });
  for (const objective of manifest.objectives) {
    registrations.push({ id: objective.id, kind: "objective", owner: { entityType: "objective", entityId: objective.id } });
  }
  for (const trigger of manifest.triggers) {
    registrations.push({ id: trigger.id, kind: "trigger", owner: { entityType: "trigger", entityId: trigger.id } });
  }
  for (const outcome of manifest.outcomes) {
    registrations.push({ id: outcome.id, kind: "outcome", owner: { entityType: "outcome", entityId: outcome.id } });
  }
  for (const character of bundle.characters) {
    registrations.push({ id: character.id, kind: "character", owner: { entityType: "character", entityId: character.id } });
  }
  for (const record of bundle.records) {
    registrations.push({ id: record.id, kind: "record", owner: { entityType: "record", entityId: record.id } });
  }
  for (const evidence of bundle.evidence) {
    registrations.push({ id: evidence.id, kind: "evidence", owner: { entityType: "evidence", entityId: evidence.id } });
  }
  for (const hint of bundle.hints) {
    registrations.push({ id: hint.id, kind: "hint", owner: { entityType: "hint", entityId: hint.id } });
    hintsById.set(hint.id, { objectiveId: hint.objectiveId });
  }
  for (const node of bundle.dialogue) {
    registrations.push({ id: node.id, kind: "dialogue_node", owner: { entityType: "dialogue node", entityId: node.id } });
    for (const choice of node.choices ?? []) {
      registrations.push({ id: choice.id, kind: "dialogue_choice", owner: { entityType: "dialogue choice", entityId: choice.id } });
    }
  }
  for (const conclusion of bundle.conclusions) {
    registrations.push({ id: conclusion.id, kind: "conclusion", owner: { entityType: "conclusion", entityId: conclusion.id } });
  }
  for (const asset of bundle.assets) {
    registrations.push({ id: asset.id, kind: "asset", owner: { entityType: "asset", entityId: asset.id } });
  }
  for (const notification of bundle.notifications) {
    registrations.push({ id: notification.id, kind: "notification", owner: { entityType: "notification", entityId: notification.id } });
  }
  for (const puzzle of bundle.puzzles) {
    registrations.push({ id: puzzle.id, kind: "puzzle", owner: { entityType: "puzzle", entityId: puzzle.id } });
  }
  return registrations;
}

// ---------------------------------------------------------------------------
// Reference helpers
// ---------------------------------------------------------------------------

function resolveRef(
  id: string,
  expectedKind: EntityKind,
  owner: Owner,
  path: string,
  registry: Registry,
  issues: ValidationIssue[],
): void {
  const target = registry.get(id);
  if (!target) {
    issues.push(
      makeIssue({
        code: "reference_unresolved",
        entityType: owner.entityType,
        entityId: owner.entityId,
        path,
        referencedId: id,
        reason: `reference '${id}' does not resolve`,
      }),
    );
    return;
  }
  if (target.kind !== expectedKind) {
    issues.push(
      makeIssue({
        code: "reference_wrong_kind",
        entityType: owner.entityType,
        entityId: owner.entityId,
        path,
        referencedId: id,
        reason: `reference '${id}' is a ${KIND_LABELS[target.kind]}, expected ${KIND_LABELS[expectedKind]}`,
      }),
    );
  }
}

function checkCaseRef(caseId: string, owner: Owner, path: string, bundleCaseId: string, issues: ValidationIssue[]): void {
  if (caseId !== bundleCaseId) {
    issues.push(
      makeIssue({
        code: "case_reference_mismatch",
        entityType: owner.entityType,
        entityId: owner.entityId,
        path,
        referencedId: caseId,
        reason: `caseId '${caseId}' does not match case manifest id '${bundleCaseId}'`,
      }),
    );
  }
}

function validateRule(
  rule: RuleExpression,
  owner: Owner,
  path: string,
  registry: Registry,
  issues: ValidationIssue[],
): void {
  for (const key of Object.keys(rule) as (keyof RuleExpression)[]) {
    const value = rule[key];
    if (key === "all" || key === "any") {
      for (const child of (value ?? []) as RuleExpression[]) validateRule(child, owner, path, registry, issues);
    } else if (key === "not") {
      validateRule((value ?? undefined) as RuleExpression, owner, `${path}.not`, registry, issues);
    } else if (key === "objectiveCompleted") {
      resolveRef(value as string, "objective", owner, `${path}.objectiveCompleted`, registry, issues);
    } else if (key === "choiceSelected") {
      resolveRef(value as string, "dialogue_choice", owner, `${path}.choiceSelected`, registry, issues);
    }
  }
}

/**
 * The single documented reference carried by a GameEffect, or null for the
 * DEFER/NOT-CONTENT-REFERENCE variants (unlock_application, set_flag).
 */
function effectTarget(effect: GameEffect): { id: string; kind: EntityKind; field: string } | null {
  switch (effect.type) {
    case "unlock_record":
      return { kind: "record", field: "recordId", id: effect.recordId };
    case "queue_dialogue":
      return { kind: "dialogue_node", field: "nodeId", id: effect.nodeId };
    case "start_objective":
    case "complete_objective":
      return { kind: "objective", field: "objectiveId", id: effect.objectiveId };
    case "discover_evidence":
      return { kind: "evidence", field: "evidenceId", id: effect.evidenceId };
    case "play_audio_cue":
      return { kind: "asset", field: "assetId", id: effect.assetId };
    case "show_notification":
      return { kind: "notification", field: "notificationId", id: effect.notificationId };
    default:
      return null;
  }
}

function resolveEffectTargets(
  effects: GameEffect[],
  owner: Owner,
  prefix: string,
  registry: Registry,
  issues: ValidationIssue[],
): void {
  effects.forEach((effect, index) => {
    const target = effectTarget(effect);
    if (target) resolveRef(target.id, target.kind, owner, `${prefix}[${index}].${target.field}`, registry, issues);
  });
}

// ---------------------------------------------------------------------------
// Collection validators
// ---------------------------------------------------------------------------

function validateObjectives(
  bundle: ContentBundle,
  registry: Registry,
  hintsById: Map<string, { objectiveId: string }>,
  issues: ValidationIssue[],
): void {
  for (const objective of bundle.case.objectives) {
    const owner: Owner = { entityType: "objective", entityId: objective.id };
    validateRule(objective.startRule, owner, "startRule", registry, issues);
    validateRule(objective.completionRule, owner, "completionRule", registry, issues);
    for (const nextId of objective.nextObjectiveIds) {
      resolveRef(nextId, "objective", owner, "nextObjectiveIds", registry, issues);
    }
    if (objective.hintIds.length === 0) {
      issues.push(
        makeIssue({
          code: "objective_missing_hints",
          entityType: owner.entityType,
          entityId: owner.entityId,
          path: "hintIds",
          reason: `objective '${objective.id}' has no hints`,
        }),
      );
      continue;
    }
    for (const hintId of objective.hintIds) {
      const entry = hintsById.get(hintId);
      if (!entry) {
        issues.push(
          makeIssue({
            code: "objective_hint_unresolved",
            entityType: owner.entityType,
            entityId: owner.entityId,
            path: "hintIds",
            referencedId: hintId,
            reason: `hint '${hintId}' referenced by objective '${objective.id}' does not resolve`,
          }),
        );
        continue;
      }
      if (entry.objectiveId !== objective.id) {
        issues.push(
          makeIssue({
            code: "objective_hint_mismatch",
            entityType: owner.entityType,
            entityId: owner.entityId,
            path: "hintIds",
            referencedId: hintId,
            reason: `hint '${hintId}' belongs to objective '${entry.objectiveId}', not '${objective.id}'`,
          }),
        );
      }
    }
  }
}

function validateHints(bundle: ContentBundle, registry: Registry, issues: ValidationIssue[]): void {
  for (const hint of bundle.hints) {
    const owner: Owner = { entityType: "hint", entityId: hint.id };
    const target = registry.get(hint.objectiveId);
    if (!target || target.kind !== "objective") {
      issues.push(
        makeIssue({
          code: "objective_hint_unresolved",
          entityType: owner.entityType,
          entityId: owner.entityId,
          path: "objectiveId",
          referencedId: hint.objectiveId,
          reason: `objective '${hint.objectiveId}' referenced by hint '${hint.id}' does not resolve to an objective`,
        }),
      );
    }
  }
}

function validateCharacters(bundle: ContentBundle, registry: Registry, issues: ValidationIssue[]): void {
  for (const character of bundle.characters) {
    const owner: Owner = { entityType: "character", entityId: character.id };
    resolveRef(character.portraitAssetId, "asset", owner, "portraitAssetId", registry, issues);
    for (const knownId of character.knownEvidenceIds) {
      resolveRef(knownId, "evidence", owner, "knownEvidenceIds", registry, issues);
    }
  }
}

function validateRecords(
  bundle: ContentBundle,
  registry: Registry,
  bundleCaseId: string,
  issues: ValidationIssue[],
): void {
  for (const record of bundle.records) {
    const owner: Owner = { entityType: "record", entityId: record.id };
    checkCaseRef(record.caseId, owner, "caseId", bundleCaseId, issues);
    validateRule(record.availabilityRule, owner, "availabilityRule", registry, issues);
    if (record.evidenceId !== undefined) {
      resolveRef(record.evidenceId, "evidence", owner, "evidenceId", registry, issues);
    }
  }
}

function validateEvidence(
  bundle: ContentBundle,
  registry: Registry,
  bundleCaseId: string,
  issues: ValidationIssue[],
): void {
  for (const evidence of bundle.evidence) {
    const owner: Owner = { entityType: "evidence", entityId: evidence.id };
    checkCaseRef(evidence.caseId, owner, "caseId", bundleCaseId, issues);
    for (const assetId of evidence.assetIds) {
      resolveRef(assetId, "asset", owner, "assetIds", registry, issues);
    }
    validateRule(evidence.discoveryRule, owner, "discoveryRule", registry, issues);
  }
}

function validateDialogue(bundle: ContentBundle, registry: Registry, issues: ValidationIssue[]): void {
  for (const node of bundle.dialogue) {
    const owner: Owner = { entityType: "dialogue node", entityId: node.id };
    resolveRef(node.speakerId, "character", owner, "speakerId", registry, issues);
    validateRule(node.enterRule, owner, "enterRule", registry, issues);
    if (node.nextNodeId !== undefined) {
      resolveRef(node.nextNodeId, "dialogue_node", owner, "nextNodeId", registry, issues);
    }
    for (const attachmentId of node.attachments ?? []) {
      resolveRef(attachmentId, "asset", owner, "attachments", registry, issues);
    }
    for (const [index, choice] of (node.choices ?? []).entries()) {
      const choiceOwner: Owner = { entityType: "dialogue choice", entityId: choice.id };
      resolveRef(choice.nextNodeId, "dialogue_node", choiceOwner, `choices[${index}].nextNodeId`, registry, issues);
      resolveEffectTargets(choice.consequences, choiceOwner, `choices[${index}].consequences`, registry, issues);
    }
  }
}

function validateTriggers(
  triggers: ContentBundle["case"]["triggers"],
  registry: Registry,
  issues: ValidationIssue[],
): void {
  for (const trigger of triggers) {
    const owner: Owner = { entityType: "trigger", entityId: trigger.id };
    validateRule(trigger.rule, owner, "rule", registry, issues);
    resolveEffectTargets(trigger.effects, owner, "effects", registry, issues);
  }
}

function validateOutcomes(
  outcomes: ContentBundle["case"]["outcomes"],
  registry: Registry,
  issues: ValidationIssue[],
): void {
  for (const outcome of outcomes) {
    const owner: Owner = { entityType: "outcome", entityId: outcome.id };
    validateRule(outcome.evaluationRule, owner, "evaluationRule", registry, issues);
    resolveEffectTargets(outcome.effects, owner, "effects", registry, issues);
  }
}

function validateSearchIndex(
  entries: ContentBundle["case"]["searchableIndex"],
  registry: Registry,
  issues: ValidationIssue[],
): void {
  for (const entry of entries) {
    const owner: Owner = { entityType: "search entry", entityId: entry.entityId };
    if (entry.entityType === "record" || entry.entityType === "character") {
      resolveRef(entry.entityId, entry.entityType, owner, "entityId", registry, issues);
    }
    validateRule(entry.availabilityRule, owner, "availabilityRule", registry, issues);
  }
}

function validateAssets(bundle: ContentBundle, bundleCaseId: string, issues: ValidationIssue[]): void {
  for (const asset of bundle.assets) {
    const owner: Owner = { entityType: "asset", entityId: asset.id };
    for (const caseId of asset.caseIds) {
      checkCaseRef(caseId, owner, "caseIds", bundleCaseId, issues);
    }
    if (asset.type === "audio" && asset.transcriptPath === undefined) {
      issues.push(
        makeIssue({
          code: "asset_missing_transcript",
          entityType: owner.entityType,
          entityId: owner.entityId,
          path: "transcriptPath",
          referencedId: asset.id,
          reason: `audio asset '${asset.id}' has no transcriptPath`,
        }),
      );
    }
  }
}

function validateConclusions(bundle: ContentBundle, bundleCaseId: string, issues: ValidationIssue[]): void {
  for (const conclusion of bundle.conclusions) {
    const owner: Owner = { entityType: "conclusion", entityId: conclusion.id };
    checkCaseRef(conclusion.caseId, owner, "caseId", bundleCaseId, issues);
  }
}

function validatePuzzles(bundle: ContentBundle, registry: Registry, bundleCaseId: string, issues: ValidationIssue[]): void {
  for (const puzzle of bundle.puzzles) {
    const owner: Owner = { entityType: "puzzle", entityId: puzzle.id };
    checkCaseRef(puzzle.caseId, owner, "caseId", bundleCaseId, issues);
    resolveRef(puzzle.sourceEvidenceId, "evidence", owner, "sourceEvidenceId", registry, issues);
    resolveRef(puzzle.referenceRecordId, "record", owner, "referenceRecordId", registry, issues);
    resolveRef(puzzle.solutionEvidenceId, "evidence", owner, "solutionEvidenceId", registry, issues);
  }
}

// ---------------------------------------------------------------------------
// Issue construction and ordering
// ---------------------------------------------------------------------------

function makeIssue(input: {
  code: ValidationIssueCode;
  entityType: string;
  entityId: string;
  path: string;
  reason: string;
  referencedId?: string;
}): ValidationIssue {
  return {
    code: input.code,
    entityType: input.entityType,
    entityId: input.entityId,
    path: input.path,
    reason: input.reason,
    ...(input.referencedId !== undefined ? { referencedId: input.referencedId } : {}),
  };
}

function sortIssues(issues: ValidationIssue[]): ValidationIssue[] {
  return [...issues].sort((a, b) =>
    compare(a.entityType, b.entityType) ||
    compare(a.entityId, b.entityId) ||
    compare(a.path, b.path) ||
    compare(a.code, b.code),
  );
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}