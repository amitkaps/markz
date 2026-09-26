/** @prose
 * # markz
 *
 * Small, opinionated Markdown: one fixed dialect (GFM's everyday syntax without the parts that
 * need backtracking, plus directives with `{…}` attributes, math, `${…}` expressions and YAML
 * frontmatter), one compact source-mapped AST, and `html()` output,
 * with no options. This is the package entry point: the public API lives here and nothing else is
 * importable.
 */

/** @prose
 * Placeholder until the parser lands (see `prose/plan.md`, steps 2–5).
 */
export function parse(source: string): string {
	return source;
}
