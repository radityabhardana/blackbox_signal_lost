// Re-export every schema module, so consumers have a single entry point.
export * from "./ids";
export * from "./opaque";
export * from "./sources";
export * from "./rule-expression";
export * from "./game-effect";
export * from "./assets";
export * from "./characters";
export * from "./records";
export * from "./evidence";
export * from "./objectives";
export * from "./hints";
export * from "./notifications";
export * from "./triggers";
export * from "./dialogue";
export * from "./search-index";
export * from "./conclusion";
export * from "./outcomes";
export * from "./case";
export * from "./save";
export { parseContent, type ContentIssue } from "./parse";
export {
  schemasByDirectory,
  resolveFixtureSchema,
  type FixtureSchemaDescriptor,
} from "./fixture-schemas";