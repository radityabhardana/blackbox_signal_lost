import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { resolveFixtureSchema } from "./fixture-schemas";
import { parseContent } from "./parse";

const fixtureRoot = path.join(__dirname, "../fixtures");

function listFixturePaths(branch: "valid" | "invalid"): string[] {
  const base = path.join(fixtureRoot, branch);
  const files: string[] = [];
  (function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".json")) files.push(path.relative(base, full));
    }
  })(base);
  return files.sort();
}

function readFixture(branch: "valid" | "invalid", relPath: string): unknown {
  return JSON.parse(readFileSync(path.join(fixtureRoot, branch, relPath), "utf-8"));
}

describe("valid fixture inventory", () => {
  for (const file of listFixturePaths("valid")) {
    it(`loads valid fixture: ${file}`, () => {
      const descriptor = resolveFixtureSchema(file);
      expect(descriptor, `missing schema mapping for ${file}`).toBeDefined();
      const raw = readFixture("valid", file);
      const result = parseContent(descriptor!.schema, raw, { entityType: descriptor!.entityType });
      expect(result.success, `fixture failed: ${file}`).toBe(true);
    });
  }
});

describe("invalid fixture inventory", () => {
  for (const file of listFixturePaths("invalid")) {
    it(`rejects invalid fixture: ${file}`, () => {
      const descriptor = resolveFixtureSchema(file);
      expect(descriptor, `missing schema mapping for ${file}`).toBeDefined();
      const raw = readFixture("invalid", file);
      const result = parseContent(descriptor!.schema, raw, { entityType: descriptor!.entityType });
      expect(result.success, `fixture unexpectedly passed: ${file}`).toBe(false);
    });
  }
});