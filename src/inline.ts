/** @prose
 * # Inline pass
 *
 * Turns a leaf's content lines into inline nodes under the builder's current node. The block pass
 * hands it the lines as source ranges with container prefixes and outer whitespace already cut,
 * so it never sees a `> ` or an item's indentation. The line ending between two lines is a soft
 * break, written as `\n` in the text.
 *
 * Until step 5 it writes each line as one text node, with no inline syntax recognised.
 */
import { type Builder, type Range } from './ast';

export function inline(b: Builder, source: string, lines: readonly Range[]): void {
	for (let i = 0; i < lines.length; i++) {
		const { start, end } = lines[i]!;
		if (start === end) continue;
		const newline = i < lines.length - 1 ? '\n' : '';
		b.leaf('text', start, end, { value: source.slice(start, end) + newline });
	}
}

/** @prose
 * ## Scanner
 *
 * The inline scanner (`prose/plan.md`, step 5): code, expressions and math first, then text
 * directives, links and images with their attributes, autolinks, emphasis by djot's rules,
 * escapes, numeric references, `\` breaks, `\ ` and smart punctuation. A table cell's `\|` is a
 * literal `|` even inside code.
 */
