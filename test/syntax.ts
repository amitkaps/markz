/** @prose
 * # The dialect's outline
 *
 * `syntax.md` read as data: its three parts and the constructs under each, and the Not supported
 * rows by warning code. Every example is filed under a construct or a code, and the tests and the
 * site both take the outline from here. Rows are keyed by the code in their first column, never
 * by their wording, so the prose can be reworded freely.
 */
import syntax from '../prose/syntax.md?raw';
import { type WarningCode } from '../src/index';

export type Part = 'Metadata' | 'Block' | 'Inline' | 'Not supported';

export interface Row {
	code: WarningCode;
	/** The Syntax cell. */
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
		if (!line.startsWith('| ') || line.startsWith('| Code') || line.startsWith('| ---')) continue;
		const [code, syntax, instead] = line
			.slice(2)
			.split(/ +\| +/)
			.map((c) => c.trim());
		rows.push({
			code: code!.slice(1, -1) as WarningCode,
			syntax: syntax!,
			instead: instead!,
			group
		});
	}
}

export const row = (code: string): Row | undefined => rows.find((r) => r.code === code);

/** Every warning code `syntax.md` names in backticks, in a table or a construct's prose. */
export const named = (code: string): boolean => syntax.includes(`\`${code}\``);

/** Where a section belongs: a construct's part, or Not supported for a row's code. */
export function part(section: string): Part | undefined {
	for (const [p, names] of Object.entries(constructs))
		if (names.includes(section)) return p as Part;
	return row(section) ? 'Not supported' : undefined;
}
