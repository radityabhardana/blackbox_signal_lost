import type { ZodTypeAny } from "zod";
import { assetDefinitionSchema } from "./assets";
import { caseManifestSchema } from "./case";
import { characterDefinitionSchema, productionCharacterDefinitionSchema } from "./characters";
import { conclusionDefinitionSchema } from "./conclusion";
import { dialogueNodeSchema } from "./dialogue";
import { endingDefinitionSchema } from "./endings";
import { evidenceDefinitionSchema } from "./evidence";
import { hintDefinitionSchema } from "./hints";
import { idSchema } from "./ids";
import { objectiveDefinitionSchema } from "./objectives";
import { outcomeDefinitionSchema } from "./outcomes";
import { puzzleDefinitionSchema } from "./puzzles";
import { recordDefinitionSchema } from "./records";
import { ruleExpressionSchema } from "./rule-expression";
import { saveGameSchema } from "./save";
import { searchIndexEntrySchema } from "./search-index";
import { triggerDefinitionSchema } from "./triggers";

export interface FixtureSchemaDescriptor {
  schema: ZodTypeAny;
  entityType: string;
}

/**
 * Maps the top-level fixture subdirectory names to their validating schema.
 * Shared between the fixture tests and the validate:content script.
 */
export const schemasByDirectory: Record<string, FixtureSchemaDescriptor> = {
  "assets/": { schema: assetDefinitionSchema, entityType: "asset" },
  "case/": { schema: caseManifestSchema, entityType: "case manifest" },
  "characters/": { schema: characterDefinitionSchema, entityType: "character" },
  "characters/production/": {
    schema: productionCharacterDefinitionSchema,
    entityType: "production character",
  },
  "conclusion/": { schema: conclusionDefinitionSchema, entityType: "conclusion" },
  "dialogue/": { schema: dialogueNodeSchema, entityType: "dialogue node" },
  "endings/": { schema: endingDefinitionSchema, entityType: "ending" },
  "evidence/": { schema: evidenceDefinitionSchema, entityType: "evidence" },
  "hints/": { schema: hintDefinitionSchema, entityType: "hint" },
  "ids/": { schema: idSchema, entityType: "id" },
  "objectives/": { schema: objectiveDefinitionSchema, entityType: "objective" },
  "outcomes/": { schema: outcomeDefinitionSchema, entityType: "outcome" },
  "puzzles/": { schema: puzzleDefinitionSchema, entityType: "puzzle" },
  "records/": { schema: recordDefinitionSchema, entityType: "record" },
  "rules/": { schema: ruleExpressionSchema, entityType: "rule expression" },
  "save/": { schema: saveGameSchema, entityType: "save game" },
  "search/": { schema: searchIndexEntrySchema, entityType: "search index" },
  "triggers/": { schema: triggerDefinitionSchema, entityType: "trigger" },
};

/**
 * Resolves the registered schema for a fixture path relative to the fixture
 * root, preferring the longest registered directory prefix so nested fixture
 * directories (for example `characters/production/`) win over their parents.
 */
export function resolveFixtureSchema(relPath: string): FixtureSchemaDescriptor | undefined {
  const prefixes = Object.keys(schemasByDirectory).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (relPath.startsWith(prefix)) return schemasByDirectory[prefix];
  }
  return undefined;
}