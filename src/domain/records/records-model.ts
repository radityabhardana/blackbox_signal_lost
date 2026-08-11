import type { RecordDefinition } from "../../content/schemas";
import type { ContentBundle } from "../../content/validator";
import type { CaseEngineState } from "../engine";
import { toRuleEvaluationContext } from "../engine";
import { searchContent } from "../search";

export interface RecordRowViewModel {
  readonly recordId: string;
  /** null when the row is an available:false classified placeholder. */
  readonly title: string | null;
  readonly recordType: string | null;
  readonly createdAt: string | null;
  readonly available: boolean;
}

export interface RecordDetailViewModel {
  readonly recordId: string;
  readonly title: string;
  readonly recordType: string;
  readonly createdAt: string;
  readonly revisedAt: string | null;
  readonly sourceLabel: string;
  readonly relatedLabels: readonly { entityId: string; label: string }[];
  readonly evidenceLabel: string | null;
  readonly metadata: readonly { key: string; value: string | number | boolean | null }[];
}

export type RecordsViewState =
  | { kind: "search-prompt" }
  | {
      kind: "ok";
      rows: readonly RecordRowViewModel[];
      detail: RecordDetailViewModel | null;
    };

export interface RecordsModelInput {
  readonly content: ContentBundle;
  readonly state: CaseEngineState;
  readonly searchQuery: string;
  readonly selectedRecordId: string | null;
}

/**
 * Search-first Records projection. BBX-023 `searchContent` is the
 * authoritative search and availability gate — `unlockedRecords` is never
 * consulted. A blank query is the search prompt, never a browse list.
 * Classified placeholders rank in position but remain generic rows that are
 * never dereferenced into record data. Detail is offered only for records
 * whose ranked result is available:true in the current query.
 */
export function buildRecordsModel(input: RecordsModelInput): RecordsViewState {
  const query = input.searchQuery.trim();
  if (query.length === 0) {
    return { kind: "search-prompt" };
  }

  const recordIndex = input.content.case.searchableIndex.filter(
    (entry) => entry.entityType === "record",
  );
  const ranked = searchContent(
    query,
    { searchableIndex: recordIndex },
    toRuleEvaluationContext(input.state),
  );

  const records = new Map(input.content.records.map((record) => [record.id, record]));
  const rows: RecordRowViewModel[] = [];
  const availableIds = new Set<string>();

  for (const result of ranked) {
    if (result.available) {
      availableIds.add(result.entityId);
      const record = records.get(result.entityId);
      // Defensive: an index entry without a record yields no row.
      if (record === undefined) continue;
      rows.push({
        recordId: record.id,
        title: record.title,
        recordType: record.recordType,
        createdAt: record.createdAt,
        available: true,
      });
    } else {
      rows.push({
        recordId: result.entityId,
        title: null,
        recordType: null,
        createdAt: null,
        available: false,
      });
    }
  }

  const detail =
    input.selectedRecordId !== null && availableIds.has(input.selectedRecordId)
      ? buildDetail(input.selectedRecordId, records, input.state, input.content)
      : null;

  return { kind: "ok", rows, detail };
}

function buildDetail(
  recordId: string,
  records: Map<string, RecordDefinition>,
  state: CaseEngineState,
  content: ContentBundle,
): RecordDetailViewModel | null {
  const record = records.get(recordId);
  if (record === undefined) return null;

  // Evidence is disclosed only once the engine has discovered it.
  const evidenceLabel: string | null =
    record.evidenceId !== undefined && state.discoveredEntityIds.includes(record.evidenceId)
      ? content.evidence.find((evidence) => evidence.id === record.evidenceId)?.title ?? null
      : null;

  return {
    recordId: record.id,
    title: record.title,
    recordType: record.recordType,
    createdAt: record.createdAt,
    revisedAt: record.revisedAt ?? null,
    sourceLabel: record.source.system ?? record.source.organizationId ?? "Unknown source",
    relatedLabels: record.relatedEntityIds.map((entityId) => ({
      entityId,
      // BBX-041 resolves related entities only against records.
      label: records.get(entityId)?.title ?? entityId,
    })),
    evidenceLabel,
    metadata: Object.entries(record.metadata).map(([key, value]) => ({ key, value })),
  };
}