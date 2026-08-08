#!/usr/bin/env tsx
/**
 * Structural content validation (BBX-020).
 *
 * Reads the repository's `fixtures/valid/` tree and proves every file parses
 * against its documented schema. Any failure is reported with enough context
 * (file, issue code, field path, rule context) before exiting non-zero.
 *
 * Invalid fixtures are NOT loaded here; those are exercised by vitest.
 * Reference/reachability validation is BBX-024 and is intentionally out of
 * scope for this command.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveFixtureSchema } from "../src/content/schemas/fixture-schemas";
import { parseContent } from "../src/content/schemas/parse";

const __filename = fileURLToPath(import.meta.url);
const fixtureRoot = path.join(path.dirname(__filename), "../src/content/fixtures/valid");

function collectFixtureFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? collectFixtureFiles(full) : [full];
    })
    .filter((file) => file.endsWith(".json"))
    .sort();
}

let failures = 0;
const files = collectFixtureFiles(fixtureRoot);

for (const file of files) {
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

if (failures > 0) {
  console.error(`[validate:content] ${failures} fixture file(s) invalid.`);
  process.exit(1);
}

console.log(`[validate:content] all ${files.length} valid fixtures conform.`);