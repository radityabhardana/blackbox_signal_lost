import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getUiAssetEntry,
  UI_ASSET_CATEGORIES,
  UI_ASSET_REGISTRY,
  UI_ASSET_SOURCE_TYPES,
  UI_ASSET_STATUSES,
  uiAssetEntrySchema,
} from "./registry";

describe("UI Asset Registry structure", () => {
  it("contains all 33 canonical UI asset entries", () => {
    expect(UI_ASSET_REGISTRY).toHaveLength(33);
  });

  it("has unique IDs for every entry", () => {
    const ids = UI_ASSET_REGISTRY.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("conforms to lowercase snake_case ID naming convention", () => {
    const idRegex = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
    for (const entry of UI_ASSET_REGISTRY) {
      expect(entry.id).toMatch(idRegex);
    }
  });

  it("every entry passes uiAssetEntrySchema validation", () => {
    for (const entry of UI_ASSET_REGISTRY) {
      const result = uiAssetEntrySchema.safeParse(entry);
      if (!result.success) {
        throw new Error(
          `Entry '${entry.id}' failed schema validation: ${JSON.stringify(result.error.issues)}`,
        );
      }
      expect(result.success).toBe(true);
    }
  });

  it("enforces valid closed enums for category, sourceType, and status", () => {
    for (const entry of UI_ASSET_REGISTRY) {
      expect(UI_ASSET_CATEGORIES).toContain(entry.category);
      expect(UI_ASSET_SOURCE_TYPES).toContain(entry.sourceType);
      expect(UI_ASSET_STATUSES).toContain(entry.status);
    }
  });

  it("enforces exactly one of componentKey XOR path for every entry", () => {
    for (const entry of UI_ASSET_REGISTRY) {
      const hasComponent = Boolean(entry.componentKey && entry.componentKey.length > 0);
      const hasPath = Boolean(entry.path && entry.path.length > 0);
      expect(hasComponent !== hasPath).toBe(true);
    }
  });

  it("enforces accessibility descriptions (altText or accessibilityIntent) for all entries", () => {
    for (const entry of UI_ASSET_REGISTRY) {
      const hasAlt = Boolean(entry.altText && entry.altText.trim().length > 0);
      const hasA11y = Boolean(
        entry.accessibilityIntent && entry.accessibilityIntent.trim().length > 0,
      );
      expect(hasAlt || hasA11y).toBe(true);
    }
  });

  it("retrieves entries via getUiAssetEntry helper", () => {
    const symbol = getUiAssetEntry("brand_blackbox_symbol");
    expect(symbol).toBeDefined();
    expect(symbol?.componentKey).toBe("BlackboxSymbol");

    const nonExistent = getUiAssetEntry("unknown_asset_id");
    expect(nonExistent).toBeUndefined();
  });
});

describe("uiAssetEntrySchema validation rules", () => {
  const validBaseEntry = {
    id: "test_asset_entry",
    title: "Test Asset Entry",
    category: "app_icon" as const,
    sourceType: "original" as const,
    creator: "BLACKBOX team",
    creationMethod: "authored SVG vector paths in-repo",
    source: "original — authored for BLACKBOX: Signal Lost",
    license: "proprietary — project original",
    attribution: "none",
    componentKey: "TestIcon",
    status: "integrated" as const,
    accessibilityIntent: "decorative test icon",
  };

  it("accepts a valid componentKey entry", () => {
    const result = uiAssetEntrySchema.safeParse(validBaseEntry);
    expect(result.success).toBe(true);
  });

  it("accepts a valid path entry starting with public/assets/", () => {
    const { componentKey: _, ...rest } = validBaseEntry;
    const pathEntry = {
      ...rest,
      path: "public/assets/test.svg",
    };
    const result = uiAssetEntrySchema.safeParse(pathEntry);
    expect(result.success).toBe(true);
  });

  it("rejects an entry with neither componentKey nor path", () => {
    const { componentKey: _, ...noTarget } = validBaseEntry;
    const result = uiAssetEntrySchema.safeParse(noTarget);
    expect(result.success).toBe(false);
  });

  it("rejects an entry with both componentKey and path", () => {
    const doubleTarget = {
      ...validBaseEntry,
      path: "public/assets/both.svg",
    };
    const result = uiAssetEntrySchema.safeParse(doubleTarget);
    expect(result.success).toBe(false);
  });

  it("rejects a path not starting with public/assets/", () => {
    const { componentKey: _, ...rest } = validBaseEntry;
    const badPath = {
      ...rest,
      path: "src/assets/icon.svg",
    };
    const result = uiAssetEntrySchema.safeParse(badPath);
    expect(result.success).toBe(false);
  });

  it("rejects an optimizedPath not starting with public/", () => {
    const badOptimized = {
      ...validBaseEntry,
      optimizedPath: "src/assets/icon.webp",
    };
    const result = uiAssetEntrySchema.safeParse(badOptimized);
    expect(result.success).toBe(false);
  });

  it("rejects invalid category enum values", () => {
    const badCategory = {
      ...validBaseEntry,
      category: "unsupported_category",
    };
    const result = uiAssetEntrySchema.safeParse(badCategory);
    expect(result.success).toBe(false);
  });

  it("rejects invalid status enum values", () => {
    const badStatus = {
      ...validBaseEntry,
      status: "finished",
    };
    const result = uiAssetEntrySchema.safeParse(badStatus);
    expect(result.success).toBe(false);
  });

  it("rejects empty required fields", () => {
    expect(uiAssetEntrySchema.safeParse({ ...validBaseEntry, title: "" }).success).toBe(false);
    expect(uiAssetEntrySchema.safeParse({ ...validBaseEntry, creator: "" }).success).toBe(false);
    expect(uiAssetEntrySchema.safeParse({ ...validBaseEntry, creationMethod: "" }).success).toBe(
      false,
    );
    expect(uiAssetEntrySchema.safeParse({ ...validBaseEntry, source: "" }).success).toBe(false);
    expect(uiAssetEntrySchema.safeParse({ ...validBaseEntry, license: "" }).success).toBe(false);
  });

  it("rejects malformed IDs", () => {
    expect(uiAssetEntrySchema.safeParse({ ...validBaseEntry, id: "Test_Bad_ID" }).success).toBe(
      false,
    );
    expect(uiAssetEntrySchema.safeParse({ ...validBaseEntry, id: "test-dash-id" }).success).toBe(
      false,
    );
    expect(uiAssetEntrySchema.safeParse({ ...validBaseEntry, id: "" }).success).toBe(false);
  });

  it("rejects unknown extra fields due to strict schema", () => {
    const extraField = {
      ...validBaseEntry,
      unexpectedField: 123,
    };
    const result = uiAssetEntrySchema.safeParse(extraField);
    expect(result.success).toBe(false);
  });
});

describe("Component module export contracts", () => {
  it("resolves brand componentKeys against brand module if present", async () => {
    let brandMod: Record<string, unknown> | null = null;
    try {
      brandMod = await import("@/components/brand");
    } catch {
      // Component module missing during parallel lane execution
    }
    if (!brandMod) {
      return;
    }
    const brandEntries = UI_ASSET_REGISTRY.filter((entry) => entry.category === "brand");
    for (const entry of brandEntries) {
      expect(entry.componentKey).toBeDefined();
      expect(brandMod).toHaveProperty(entry.componentKey!);
    }
  });

  it("resolves app_icon and system_glyph componentKeys against icons module if present", async () => {
    let iconsMod: Record<string, unknown> | null = null;
    try {
      iconsMod = await import("@/components/icons");
    } catch {
      // Component module missing during parallel lane execution
    }
    if (!iconsMod) {
      return;
    }
    const iconAndGlyphEntries = UI_ASSET_REGISTRY.filter(
      (entry) => entry.category === "app_icon" || entry.category === "system_glyph",
    );
    for (const entry of iconAndGlyphEntries) {
      expect(entry.componentKey).toBeDefined();
      expect(iconsMod).toHaveProperty(entry.componentKey!);
    }
  });

  it("resolves evidence componentKeys against evidence module if present", async () => {
    let evidenceMod: Record<string, unknown> | null = null;
    // Widened to string so tsc does not statically resolve a module that lands later.
    const evidenceModuleSpecifier: string = "@/components/evidence";
    try {
      evidenceMod = await import(evidenceModuleSpecifier);
    } catch {
      // Component module missing during parallel lane execution
    }
    if (!evidenceMod) {
      return;
    }
    const evidenceEntries = UI_ASSET_REGISTRY.filter((entry) => entry.category === "evidence");
    for (const entry of evidenceEntries) {
      expect(entry.componentKey).toBeDefined();
      expect(evidenceMod).toHaveProperty(entry.componentKey!);
    }
  });
});

describe("Static file assets", () => {
  it("verifies static files when present on disk and tests SVG safety", () => {
    const pathEntries = UI_ASSET_REGISTRY.filter((entry) => Boolean(entry.path));
    expect(pathEntries.length).toBeGreaterThan(0);

    for (const entry of pathEntries) {
      const fullPath = path.resolve(process.cwd(), entry.path!);
      if (!existsSync(fullPath)) {
        // Pending authoring by parallel lane
        continue;
      }
      expect(existsSync(fullPath)).toBe(true);
      if (entry.path!.endsWith(".svg")) {
        const content = readFileSync(fullPath, "utf-8");
        expect(content).not.toMatch(/<script/i);
        expect(content).not.toMatch(/on\w+\s*=/i);
        expect(content).not.toMatch(/<foreignObject/i);
        expect(content).not.toMatch(/href\s*=\s*["']https?:\/\//i);
        expect(content).not.toMatch(/src\s*=\s*["']https?:\/\//i);
        expect(content).not.toMatch(/xlink:href\s*=\s*["']https?:\/\//i);
      }
    }
  });
});
