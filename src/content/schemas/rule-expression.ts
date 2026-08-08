import { z } from "zod";

// docs/09 §11 — the closed set of rule-expression operators.

// Implementation-local annotation only, used to satisfy TypeScript for the
// recursive z.lazy. The exported type below is derived purely by z.infer.
const flagEqualsSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
}).strict();

const eventOccurredSchema = z.object({
  type: z.string(),
  entityId: z.string().optional(),
}).strict();

const countAtLeastSchema = z.object({
  eventType: z.string(),
  count: z.number().int().min(0),
}).strict();

interface RuleExpressionShape {
  always?: true | undefined;
  all?: RuleExpressionShape[] | undefined;
  any?: RuleExpressionShape[] | undefined;
  not?: RuleExpressionShape | undefined;
  flagEquals?: z.infer<typeof flagEqualsSchema> | undefined;
  eventOccurred?: z.infer<typeof eventOccurredSchema> | undefined;
  entityDiscovered?: string | undefined;
  objectiveCompleted?: string | undefined;
  choiceSelected?: string | undefined;
  countAtLeast?: z.infer<typeof countAtLeastSchema> | undefined;
}

export const ruleExpressionSchema: z.ZodType<RuleExpressionShape> = z.lazy(() =>
  z
    .object({
      always: z.literal(true).optional(),
      all: z.array(z.lazy(() => ruleExpressionSchema)).optional(),
      any: z.array(z.lazy(() => ruleExpressionSchema)).optional(),
      not: z.lazy(() => ruleExpressionSchema).optional(),
      flagEquals: flagEqualsSchema.optional(),
      eventOccurred: eventOccurredSchema.optional(),
      entityDiscovered: z.string().optional(),
      objectiveCompleted: z.string().optional(),
      choiceSelected: z.string().optional(),
      countAtLeast: countAtLeastSchema.optional(),
    })
    .strict()
    .refine((node) => Object.keys(node).length === 1, {
      message: "Rule expression must contain exactly one documented operator.",
    }),
);

export type RuleExpression = z.infer<typeof ruleExpressionSchema>;
