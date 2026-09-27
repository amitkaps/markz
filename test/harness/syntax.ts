/** @prose
 * # The dialect's outline
 *
 * `syntax.md` read as data: each construct by the id on the `{#id}` line above its heading, and
 * the Not supported rows by warning code. The grammar says which constructs exist and where they
 * belong; this reads what the page says about them, so the tests can hold the two together. Nothing
 * here depends on wording: headings, leads and cells can be reworded as long as the ids, the codes
 * and the origin leads stay.
 */
import syntax from '../../prose/syntax.md?raw';
import { type WarningCode } from '../../src/index';

export type Part = 'Metadata' | 'Block' | 'Inline' | 'Not supported';

/** @prose
 * ## Origins
 *
 * Where a construct's rule comes from: the earliest layer that defines it, in the order the layers
 * build on each other. CommonMark, then GFM, which extends it, then micromark-extension-directive,
 * then djot. Math sits outside that chain: its delimiters are pandoc's and GitHub's, written in
 * GitHub's HTML shape. What no layer defines is markz's own. Each construct in `syntax.md` opens
 * with its origin's lead, in bold, and that lead is where the grammar takes its origin from.
 */
export type Origin = 'CommonMark' | 'GFM' | 'directive' | 'djot' | 'GitHub' | 'pandoc' | 'markz';

export const LEADS: Record<Origin, string> = {
	CommonMark: 'As CommonMark',
	GFM: 'As GFM',
	directive: 'From micromark-extension-directive',
	djot: 'From djot',
	GitHub: 'As GitHub',
	pandoc: 'From pandoc',
	markz: 'markz'
};

/** A construct as `syntax.md` presents it. */
export interface Anchor {
	id: string;
	title: string;
	/** The `##` section it sits under. */
	part: string;
	/** The paragraph under the heading, which opens with the origin's lead. */
	lead: string;
}

export interface Row {
	code: WarningCode;
	/** The Syntax cell. */
	syntax: string;
	instead: string;
	/** Metadata, block or inline forms. */
	group: string;
}

export const anchors: Anchor[] = [];
{
	const lines = syntax.split('\n');
	let fence = '';
	let part = '';
	let id: string | null = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		const ticks = /^(`{3,})/.exec(line)?.[1];
		if (fence) {
			if (ticks && ticks.length >= fence.length && line.trim() === ticks) fence = '';
			continue;
		}
		if (ticks) fence = ticks;
		else if (/^\{#[\w-]+\}$/.test(line)) id = line.slice(2, -1);
		else if (/^#{2,3} /.test(line)) {
			const title = line.replace(/^#+ /, '');
			if (line.startsWith('## ')) part = title;
			if (id) {
				let j = i + 1;
				while (lines[j] === '') j++;
				const lead: string[] = [];
				for (; lines[j]; j++) lead.push(lines[j]!);
				anchors.push({ id, title, part, lead: lead.join(' ') });
			}
			id = null;
		}
	}
}

export const anchor = (id: string): Anchor | undefined => anchors.find((a) => a.id === id);

/** The origin whose lead a construct's section opens with. */
export function origin(id: string): Origin | undefined {
	const lead = anchor(id)?.lead;
	const found = Object.entries(LEADS).find(([, l]) => lead?.startsWith(`**${l}`));
	return found?.[0] as Origin | undefined;
}

// Between two known headings, since the samples in syntax.md contain `##` lines of their own.
const between = (from: string, to: string) =>
	syntax.split(`\n## ${from}\n`)[1]!.split(`\n## ${to}\n`)[0]!;

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
	const a = anchor(section);
	if (a) return a.part as Part;
	return row(section) ? 'Not supported' : undefined;
}

/** What the site shows for a section: the construct's heading, or the row's code. */
export const title = (section: string): string => anchor(section)?.title ?? section;
