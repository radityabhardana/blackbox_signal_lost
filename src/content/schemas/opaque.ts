import { z } from "zod";

/**
 * docs/09 names these subtypes but does not define their internal contract.
 * They are intentionally opaque in BBX-020 and belong to the owning task's
 * schema design work (rich text, case manifest iteration, save payloads).
 */
export const richTextDocumentSchema = z.record(z.unknown()); // docs/09 §6 — owns: content authoring / future rich-text schema
export const caseStageSchema = z.record(z.unknown()); // docs/09 §3 — owns: BBX-100 case-manifest iteration
export const entityReferenceSchema = z.record(z.unknown()); // docs/09 §3 — owns: BBX-100 case-manifest iteration

// SaveGame payload types are opaque snapshots per docs/09 §14; their internal
// schemas belong to BBX-030.
export const sessionSnapshotSchema = z.record(z.unknown());
export const uiSnapshotSchema = z.record(z.unknown());
export const playerSettingsSchema = z.record(z.unknown());
export const gameEventSchema = z.record(z.unknown()); // docs/08 §5 sketch is not normative — owns: rule engine (BBX-021)

export type RichTextDocument = z.infer<typeof richTextDocumentSchema>;
export type CaseStage = z.infer<typeof caseStageSchema>;
export type EntityReference = z.infer<typeof entityReferenceSchema>;
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>;
export type UiSnapshot = z.infer<typeof uiSnapshotSchema>;
export type PlayerSettings = z.infer<typeof playerSettingsSchema>;
export type GameEvent = z.infer<typeof gameEventSchema>;