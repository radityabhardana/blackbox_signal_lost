import { z } from "zod";

/**
 * Whether an opaque subtype's structure is documented by docs/09.
 * Shared for marking the owning future task.
 */
export const LOWER_SNAKE_CASE_ID = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export const idSchema = z
  .string()
  .min(1)
  .regex(LOWER_SNAKE_CASE_ID, "IDs must be lowercase snake_case");

export type Id = z.infer<typeof idSchema>;