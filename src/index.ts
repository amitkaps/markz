/** @prose
 * # markz
 *
 * Small, opinionated Markdown, with one fixed dialect, one compact source-mapped AST and `html()`
 * output, and no options. This is the package entry point. The public API lives here, and nothing
 * else is importable.
 *
 * The dialect is GFM's everyday syntax without the parts that need backtracking. It adds `{…}`
 * attributes and elements, math, `${…}` expressions and YAML metadata.
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
