/** @prose
 * # markz
 *
 * Small, opinionated Markdown: one fixed dialect (GFM's everyday syntax without the parts that
 * need backtracking, plus directives with `{…}` attributes, math, `${…}` expressions and YAML
 * frontmatter), one compact source-mapped AST, and `html()` output,
 * with no options. This is the package entry point: the public API lives here and nothing else is
 * importable.
 */
export { parse } from './parse';
export { html } from './html';
export { Document, NONE } from './ast';
export type {
	Align,
	Attribute,
	Attributes,
	DataType,
	Destination,
	Diagnostic,
	FrontmatterScalar,
	FrontmatterValue,
	NodeData,
	NodeId,
	NodeType,
	Range
} from './ast';
