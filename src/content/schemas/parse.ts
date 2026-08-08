import type { z } from "zod";

export interface ContentIssue {
  entityType: string;
  entityId: string | undefined;
  code: string;
  path: string;
  reason: string;
}

/**
 * Formats Zod structural parsing issues into developer-readable issues.
 * This is schema-level formatting only — no references, graph checks, or
 * reachability (those belong to BBX-024).
 */
export function parseContent<Schema extends z.ZodTypeAny>(
  schema: Schema,
  raw: unknown,
  context: { entityType: string; entityId?: string },
):
  | { success: true; data: z.infer<Schema> }
  | { success: false; issues: ContentIssue[] } {
  const result = schema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues: ContentIssue[] = result.error.issues.map((issue) => ({
    entityType: context.entityType,
    entityId: context.entityId,
    code: issue.code,
    path: issue.path.join("."),
    reason: issue.message,
  }));
  return { success: false, issues };
}