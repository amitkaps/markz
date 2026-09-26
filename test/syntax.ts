/** @prose
 * # The dialect's outline
 *
 * `syntax.md` read as data: its three parts and the constructs under each, and the Not supported
 * rows with their "Write instead" cells. Every example is filed under one of these, and the
 * tests and the site both take the outline from here, so a heading renamed in `syntax.md` is a
 * failing test rather than a silently empty category.
 */
import syntax from '../prose/syntax.md?raw';

export type Part = 'Metadata' | 'Block' | 'Inline' | 'Not supported';

export interface Row {
	/** The Syntax cell, which examples name by its start. */
	syntax: string;
	instead: string;
	/** Metadata, block or inline forms. */
	group: string;
}

// Between two known headings, since the samples in syntax.md contain `##` lines of their own.
const between = (from: string, to: string) =>
	syntax.split(`\n## ${from}\n`)[1]!.split(`\n## ${to}\n`)[0]!;
const headings = (text: string) => [...text.matchAll(/^### (.+)$/gm)].map((m) => m[1]!);

export const constructs: Record<Exclude<Part, 'Not supported'>, string[]> = {
	Metadata: ['Metadata'],
	Block: headings(between('Block', 'Inline')),
	Inline: headings(between('Inline', 'Not supported'))
};

export const rows: Row[] = [];
for (const block of between('Not supported', 'Canonical form').split(/^### /m).slice(1)) {
	const group = block.slice(0, block.indexOf('\n'));
	for (const line of block.split('\n')) {
		if (!line.startsWith('| ') || line.startsWith('| Syntax') || line.startsWith('| ---')) continue;
		const [syntax, instead] = line
			.slice(2)
			.split(/ +\| +/)
			.map((c) => c.trim());
		rows.push({ syntax: syntax!, instead: instead!, group });
	}
}

/** The row a name starts, when exactly one does. */
export function row(name: string): Row | undefined {
	const found = rows.filter((r) => r.syntax.startsWith(name));
	return found.length === 1 ? found[0] : undefined;
}

/** Where a section name belongs: a construct's part, or Not supported for a row. */
export function part(section: string): Part | undefined {
	for (const [p, names] of Object.entries(constructs))
		if (names.includes(section)) return p as Part;
	return row(section) ? 'Not supported' : undefined;
}
