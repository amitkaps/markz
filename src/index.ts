/** @prose
 * # markz
 *
 * Small, opinionated Markdown: one fixed dialect (GFM's everyday syntax without the parts that
 * need backtracking, plus `{…}` attributes and elements, math, `${…}` expressions and YAML
 * metadata), one compact source-mapped AST, and `html()` output,
 * with no options. This is the package entry point: the public API lives here and nothing else is
 * importable.
 */
export { parse } from "./parse";
export { html } from "./html";
export { walk, textContent, headings, type Heading, type Visitor } from "./walk";
export { position, type Position } from "./position";
export { Document, NONE } from "./ast";
export type { WarningCode } from "./warnings";
export type {
  Align,
  Attribute,
  Attributes,
  DataType,
  Destination,
  Warning,
  MetadataObject,
  MetadataScalar,
  MetadataValue,
  NodeData,
  NodeId,
  NodeType,
  Range,
} from "./ast";
