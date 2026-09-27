/** @prose
 * # Example fences
 *
 * The one format every example is kept in, upstream or markz's own: the CommonMark spec's, in the
 * fence oxfmt writes. A file may start with a metadata block, and each `##` heading names the
 * section the examples under it belong to. An example is a backtick fence with the info string
 * `example`, long enough for what it holds, then the Markdown, a `.` line, the expected output,
 * and optionally a second `.` line and the text each warning covers, one per line. Without a `.`,
 * the expected output is empty.
 *
 * A part is its lines joined by line endings, exactly, so one that ends with a line ending shows
 * it as a blank last line. What an editor or git would lose is marked: `→` is a tab, `␣` a space
 * at the end of a line, `␍` a carriage return, and `⏎` a line ending inside a warning's text.
 * The info string goes on to the example's number, then the edge it tries (`cases.ts`), then, for
 * an ambiguous one, the side rule that settles it: `example 17 ambiguous closing-hashes`.
 */

export interface Fence {
	section: string;
	number: number | null;
	category: string | null;
	rule: string | null;
	markdown: string;
	expected: string;
	warnings: string[];
}

export interface Fences {
	/** The `#` heading. */
	title: string;
	/** The metadata block's `key: value` lines. */
	meta: Record<string, string>;
	examples: Fence[];
}

const INFO = /^(`{3,})example(?: (\d+))?(?: ([a-z-]+))?(?: ([a-z-]+))?$/;
const MARKS = /[→␣␍]/;

const decode = (s: string) => s.replace(/→/g, '\t').replace(/␣/g, ' ').replace(/␍/g, '\r');

export function readFences(text: string): Fences {
	const meta: Record<string, string> = {};
	const examples: Fence[] = [];
	const lines = text.split('\n');
	let i = 0;
	if (lines[0] === '---') {
		for (i = 1; lines[i] !== '---'; i++) {
			const m = /^([\w-]+): (.*)$/.exec(lines[i]!);
			if (!m) throw new Error(`not metadata: ${lines[i]}`);
			meta[m[1]!] = m[2]!;
		}
		i++;
	}
	let title = '';
	let section = '';
	for (; i < lines.length; i++) {
		const line = lines[i]!;
		if (line.startsWith('# ') && !title) title = line.slice(2).trim();
		if (line.startsWith('## ')) section = line.slice(3).trim();
		const info = INFO.exec(line);
		if (!info) continue;
		const [, fence, number, category = null, rule = null] = info;
		const parts: string[][] = [[]];
		for (i++; lines[i] !== fence; i++) {
			if (i >= lines.length) throw new Error(`unclosed example in ${section}`);
			if (lines[i] === '.') parts.push([]);
			else parts.at(-1)!.push(lines[i]!);
		}
		const [markdown = '', expected = '', warnings = ''] = parts.map((p) => p.join('\n'));
		examples.push({
			section,
			number: number ? Number(number) : null,
			category,
			rule,
			markdown: decode(markdown),
			expected: decode(expected),
			warnings: warnings
				.split('\n')
				.filter(Boolean)
				.map((w) => decode(w).replace(/⏎/g, '\n'))
		});
	}
	return { title, meta, examples };
}

/** @prose
 * ## Writing
 *
 * What `scripts/vendor.ts` writes an upstream suite with, so a vendored file is always the one
 * form `readFences` reads back to the same examples. It refuses what the format can't carry: a
 * mark already in the text, or a lone `.` line.
 */
export function writeFences(
	title: string,
	meta: Record<string, string>,
	examples: Fence[]
): string {
	let out = `---\n${Object.entries(meta)
		.map(([k, v]) => `${k}: ${v}\n`)
		.join('')}---\n\n# ${title}\n`;
	let section: string | null = null;
	for (const e of examples) {
		if (e.section !== section) {
			section = e.section;
			out += `\n## ${section}\n`;
		}
		const parts = [e.markdown, ...(e.expected ? [e.expected] : [])].map((p) => {
			if (MARKS.test(p)) throw new Error(`a mark in example ${e.number}`);
			if (/^\.$/m.test(p)) throw new Error(`a lone . in example ${e.number}`);
			return p
				.replace(/\t/g, '→')
				.replace(/\r/g, '␍')
				.replace(/ +$/gm, (s) => '␣'.repeat(s.length));
		});
		const longest = Math.max(2, ...[...parts.join('\n').matchAll(/`+/g)].map((m) => m[0].length));
		const fence = '`'.repeat(longest + 1);
		const info = ['example', e.number, e.category, e.rule].filter((x) => x !== null).join(' ');
		out += `\n${fence}${info}\n${parts.join('\n.\n')}\n${fence}\n`;
	}
	return out;
}
