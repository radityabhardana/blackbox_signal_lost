#!/usr/bin/env tsx
/**
 * Repository content validation (BBX-020 structural + BBX-024 integrity).
 *
 * PASS 1 (structural): walks `fixtures/valid/` and proves every file parses
 * against its documented BBX-020 schema.
 *
 * PASS 2 (integrity): walks `fixtures/bundles/valid/` and proves every bundle
 * parses the bundle envelope AND passes the BBX-024 content validator.
 *
 * The command exits non-zero on the first failing pass. Invalid fixtures are
 * NOT loaded here; they are exercised by vitest. Reference/reachability checks
 * are structural-only for BBX-024; runtime reachability is BBX-021/022/105.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFixtureSchema } from "../src/content/schemas/fixture-schemas";
import { parseContent } from "../src/content/schemas/parse";
import { contentBundleSchema, validateContentBundle } from "../src/content/validator";

const __filename = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(__filename);
const fixtureRoot = path.join(scriptDir, "../src/content/fixtures/valid");
const bundleRoot = path.join(scriptDir, "../src/content/fixtures/bundles/valid");

function collectJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? collectJsonFiles(full) : [full];
    })
    .filter((file) => file.endsWith(".json"))
    .sort();
}

let failures = 0;

for (const file of collectJsonFiles(fixtureRoot)) {
  const rel = path.relative(fixtureRoot, file);
  const descriptor = resolveFixtureSchema(rel);

  if (!descriptor) {
    console.error(`[validate:content] no schema registered for '${rel}'`);
    failures += 1;
    continue;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf-8"));
  } catch (error) {
    console.error(`[validate:content] ${rel}: JSON parse failure: ${String(error)}`);
    failures += 1;
    continue;
  }

  const result = parseContent(descriptor.schema, raw, { entityType: descriptor.entityType });
  if (!result.success) {
    for (const issue of result.issues) {
      console.error(
        `[validate:content] ${rel}: ${issue.entityType} '${issue.entityId ?? ""}' -> ${issue.path || "(root)"}: ${issue.reason}`,
      );
    }
    failures += 1;
  }
}

for (const file of collectJsonFiles(bundleRoot)) {
  const rel = path.relative(bundleRoot, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf-8"));
  } catch (error) {
    console.error(`[validate:content] ${rel}: JSON parse failure: ${String(error)}`);
    failures += 1;
    continue;
  }

  const parsed = contentBundleSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[validate:content] bundle ${rel}: does not match the bundle schema.`);
    failures += 1;
    continue;
  }

  const result = validateContentBundle(parsed.data);
  if (!result.success) {
    for (const issue of result.issues) {
      console.error(
        `[validate:content] bundle ${rel}: ${issue.entityType} '${issue.entityId}' -> ${issue.path}: ${issue.reason}${issue.referencedId ? ` (${issue.referencedId})` : ""}`,
      );
    }
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`[validate:content] ${failures} content file(s) invalid.`);
  process.exit(1);
}

console.log("[validate:content] all structural fixtures and content bundles conform.");
