#!/usr/bin/env tsx
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UI_ASSET_REGISTRY, uiAssetEntrySchema } from "../src/content/assets/registry";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

interface ValidationIssue {
  assetId?: string;
  rule: string;
  message: string;
}

const issues: ValidationIssue[] = [];

// 1. Structural self-check & Registry checks
const seenIds = new Set<string>();

for (const entry of UI_ASSET_REGISTRY) {
  // Check 1: Duplicate IDs
  if (seenIds.has(entry.id)) {
    issues.push({
      assetId: entry.id,
      rule: "duplicate_id",
      message: `Duplicate asset ID '${entry.id}'`,
    });
  }
  seenIds.add(entry.id);

  // Schema parsing
  const parsed = uiAssetEntrySchema.safeParse(entry);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        assetId: entry.id,
        rule: "schema_validation",
        message: `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      });
    }
  }

  // Check 2: Missing title / creator / license / source / creationMethod
  if (!entry.title || entry.title.trim().length === 0) {
    issues.push({ assetId: entry.id, rule: "missing_title", message: "title is required" });
  }
  if (!entry.creator || entry.creator.trim().length === 0) {
    issues.push({ assetId: entry.id, rule: "missing_creator", message: "creator is required" });
  }
  if (!entry.license || entry.license.trim().length === 0) {
    issues.push({ assetId: entry.id, rule: "missing_license", message: "license is required" });
  }
  if (!entry.source || entry.source.trim().length === 0) {
    issues.push({ assetId: entry.id, rule: "missing_source", message: "source is required" });
  }
  if (!entry.creationMethod || entry.creationMethod.trim().length === 0) {
    issues.push({
      assetId: entry.id,
      rule: "missing_creation_method",
      message: "creationMethod is required",
    });
  }

  // Check 4: third_party requirements
  if (entry.sourceType === "third_party") {
    if (!entry.attribution || entry.attribution.trim() === "none") {
      issues.push({
        assetId: entry.id,
        rule: "third_party_attribution",
        message: "third_party asset requires explicit attribution (cannot be 'none')",
      });
    }
    if (
      !entry.source ||
      (!entry.source.startsWith("http://") && !entry.source.startsWith("https://"))
    ) {
      issues.push({
        assetId: entry.id,
        rule: "third_party_source_url",
        message: "third_party asset requires a valid source URL (http:// or https://)",
      });
    }
  }

  // Check 5: missing altText AND missing accessibilityIntent
  const hasAlt = Boolean(entry.altText && entry.altText.trim().length > 0);
  const hasA11y = Boolean(
    entry.accessibilityIntent && entry.accessibilityIntent.trim().length > 0,
  );
  if (!hasAlt && !hasA11y) {
    issues.push({
      assetId: entry.id,
      rule: "missing_accessibility_intent",
      message: "Missing altText and missing accessibilityIntent",
    });
  }

  // Check 6: componentKey XOR path violation
  const hasComponentKey = Boolean(entry.componentKey && entry.componentKey.trim().length > 0);
  const hasPath = Boolean(entry.path && entry.path.trim().length > 0);
  if (hasComponentKey === hasPath) {
    issues.push({
      assetId: entry.id,
      rule: "component_or_path_xor",
      message: "Asset must define exactly one of componentKey XOR path",
    });
  }

  // Check 7: optimizedPath location and file existence
  if (entry.optimizedPath) {
    if (!entry.optimizedPath.startsWith("public/")) {
      issues.push({
        assetId: entry.id,
        rule: "optimized_path_prefix",
        message: `optimizedPath '${entry.optimizedPath}' must start with 'public/'`,
      });
    }
    const fullOptimized = path.resolve(repoRoot, entry.optimizedPath);
    if (!existsSync(fullOptimized)) {
      issues.push({
        assetId: entry.id,
        rule: "optimized_path_missing",
        message: `optimizedPath file not found: '${entry.optimizedPath}'`,
      });
    }
  }

  // Check 8: path location, existence, and SVG safety scan
  if (entry.path) {
    if (!entry.path.startsWith("public/")) {
      issues.push({
        assetId: entry.id,
        rule: "path_prefix",
        message: `path '${entry.path}' must start with 'public/'`,
      });
    }
    const fullPath = path.resolve(repoRoot, entry.path);
    if (!existsSync(fullPath)) {
      issues.push({
        assetId: entry.id,
        rule: "path_missing",
        message: `path file not found: '${entry.path}'`,
      });
    } else if (entry.path.endsWith(".svg")) {
      try {
        const svgContent = readFileSync(fullPath, "utf-8");
        const unsafeChecks = [
          { pattern: /<script/i, reason: "<script> tag" },
          { pattern: /on\w+\s*=/i, reason: "inline event handler" },
          { pattern: /<foreignObject/i, reason: "<foreignObject> tag" },
          { pattern: /href\s*=\s*["']https?:\/\//i, reason: 'external href ("http...")' },
          { pattern: /src\s*=\s*["']https?:\/\//i, reason: 'external src ("http...")' },
          {
            pattern: /xlink:href\s*=\s*["']https?:\/\//i,
            reason: 'external xlink:href ("http...")',
          },
        ];
        for (const check of unsafeChecks) {
          if (check.pattern.test(svgContent)) {
            issues.push({
              assetId: entry.id,
              rule: "unsafe_svg",
              message: `Unsafe SVG content (${check.reason}) detected in '${entry.path}'`,
            });
          }
        }
      } catch (err) {
        issues.push({
          assetId: entry.id,
          rule: "svg_read_error",
          message: `Failed to read SVG file '${entry.path}': ${String(err)}`,
        });
      }
    }
  }
}

// Check 9: componentKey resolution against component modules
const componentModuleTargets = [
  { name: "icons", path: "../src/components/icons/index" },
  { name: "brand", path: "../src/components/brand/index" },
  { name: "evidence", path: "../src/components/evidence/index" },
];

const resolvedExports = new Set<string>();
const missingModulePaths: string[] = [];

for (const target of componentModuleTargets) {
  try {
    const mod = await import(target.path);
    for (const exportName of Object.keys(mod)) {
      resolvedExports.add(exportName);
    }
  } catch {
    missingModulePaths.push(target.path);
  }
}

if (missingModulePaths.length > 0) {
  for (const modPath of missingModulePaths) {
    issues.push({
      rule: "component_module_missing",
      message: `component module missing: '${modPath}'`,
    });
  }
}

for (const entry of UI_ASSET_REGISTRY) {
  if (entry.componentKey) {
    if (missingModulePaths.length > 0 && !resolvedExports.has(entry.componentKey)) {
      issues.push({
        assetId: entry.id,
        rule: "component_key_unresolved",
        message: `componentKey '${entry.componentKey}' unresolved (component module missing)`,
      });
    } else if (!resolvedExports.has(entry.componentKey)) {
      issues.push({
        assetId: entry.id,
        rule: "component_key_not_exported",
        message: `componentKey '${entry.componentKey}' not found in component module exports`,
      });
    }
  }
}

// Summary reporting
const categoryCounts: Record<string, number> = {};
for (const entry of UI_ASSET_REGISTRY) {
  categoryCounts[entry.category] = (categoryCounts[entry.category] ?? 0) + 1;
}

console.log(`[validate:assets] Total entries: ${UI_ASSET_REGISTRY.length}`);
console.log(
  `[validate:assets] By category: ${Object.entries(categoryCounts)
    .map(([category, count]) => `${category}: ${count}`)
    .join(", ")}`,
);

if (issues.length > 0) {
  console.error(`\n[validate:assets] ${issues.length} validation failure(s) detected:`);
  for (const issue of issues) {
    const target = issue.assetId ? ` [${issue.assetId}]` : "";
    console.error(`  - ${issue.rule}${target}: ${issue.message}`);
  }
  process.exit(1);
}

console.log("[validate:assets] all UI asset entries conform.");
process.exit(0);
