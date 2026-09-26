/** @prose
 * # Examples
 *
 * Every example markz is held to, in one shape and filed by the dialect: under a construct of
 * `syntax.md` (Metadata, Block, Inline) or under the Not supported row it exercises. Where an
 * example comes from is a label, not a category. The upstream suites (CommonMark, GFM) are checked
 * against the oracle; markz's own examples, in `dialect/*.md`, carry their expected output.
 *
 * An example is one of four kinds:
 *
 * - **oracle:** markz's HTML must match micromark's, after normalization.
 * - **differs:** a construct markz keeps under a different rule (no run splitting, `\ `,
 *   comments). It is filed under that construct, whose heading is the reason, and not compared.
 * - **not supported:** it uses a form the dialect cuts on principle. It passes when that row's
 *   warning fires, so the cut is tested rather than skipped.
 * - **expected:** markz's own example, which must give its HTML and warn over exactly its listed
 *   text, and nothing else.
 */
import { html, parse, type Document, type Warning } from '../src/index';
import block from './dialect/block.md?raw';
import inline from './dialect/inline.md?raw';
import metadata from './dialect/metadata.md?raw';
import notSupported from './dialect/not-supported.md?raw';
import { normalize, reference, tokens, type Token } from './oracle';
import commonmark from './spec/commonmark.json' with { type: 'json' };
import gfm from './spec/gfm.json' with { type: 'json' };
import { part, row, type Part } from './syntax';

export type Source = 'commonmark' | 'gfm' | 'markz';
export type Kind = 'oracle' | 'differs' | 'not supported' | 'expected';
export type Status = 'pass' | 'fail' | 'differs';

export interface Example {
	source: Source;
	/** `commonmark:232`, or `markz:block:12` for the 12th example in `dialect/block.md`. */
	id: string;
	number: number;
	/** The construct or Not supported row it is filed under. */
	section: string;
	part: Part;
	/** The section of the upstream suite, for an upstream example. */
	upstream: string | null;
	kind: Kind;
	markdown: string;
	/** The spec's own HTML for an upstream example; the expected HTML for markz's own. */
	html: string;
	/** For markz's own: the source text each warning covers, in order. */
	warnings: string[];
}

/** @prose
 * ## Upstream sections
 *
 * Where each upstream section's examples are filed. An example that uses a cut form goes to that
 * form's row instead, whatever its section.
 */
export const sections: Record<string, string> = {
	'commonmark:Tabs': 'Lists',
	'commonmark:Backslash escapes': 'Escapes and references',
	'commonmark:Entity and numeric character references': 'Escapes and references',
	'commonmark:Precedence': 'Lists',
	'commonmark:Thematic breaks': 'Thematic breaks',
	'commonmark:ATX headings': 'Headings',
	'commonmark:Setext headings': 'Headings',
	'commonmark:Indented code blocks': 'Code blocks',
	'commonmark:Fenced code blocks': 'Code blocks',
	'commonmark:HTML blocks': 'Raw blocks',
	'commonmark:Link reference definitions': 'Links and images',
	'commonmark:Paragraphs': 'Paragraphs',
	'commonmark:Blank lines': 'Paragraphs',
	'commonmark:Block quotes': 'Blockquotes',
	'commonmark:List items': 'Lists',
	'commonmark:Lists': 'Lists',
	'commonmark:Inlines': 'Inline code',
	'commonmark:Code spans': 'Inline code',
	'commonmark:Emphasis and strong emphasis': 'Emphasis',
	'commonmark:Links': 'Links and images',
	'commonmark:Images': 'Links and images',
	'commonmark:Autolinks': 'Links and images',
	'commonmark:Raw HTML': 'Raw blocks',
	'commonmark:Hard line breaks': 'Line breaks',
	'commonmark:Soft line breaks': 'Line breaks',
	'commonmark:Textual content': 'Paragraphs',
	'gfm:Tables': 'Tables',
	'gfm:Task list items': 'Lists',
	'gfm:Strikethrough': 'Emphasis',
	'gfm:Autolinks': 'Links and images',
	'gfm:Disallowed Raw HTML': 'Raw blocks'
};

/** @prose
 * ## Listed by hand
 *
 * What the oracle's tokens can't show, keyed `source:example`: a rule with no token of its own.
 */
export const listed: Record<string, string> = {
	// `\ ` is a non-breaking space in markz, a literal backslash and space in GFM.
	'commonmark:13': 'Escapes and references',
	// Emphasis that needs a delimiter run split (`****`, `__foo_`), which markz doesn't do.
	...Object.fromEntries(
		[
			408, 409, 413, 414, 415, 416, 417, 426, 427, 430, 431, 442, 443, 444, 445, 446, 447, 454, 455,
			456, 457, 458, 459, 464, 465, 466, 467, 468
		].map((n) => [`commonmark:${n}`, 'Emphasis'])
	),
	// A run opened before a `[` can't close inside the brackets, even when they make no link.
	'commonmark:523': 'Emphasis',
	// A paragraph continuing without its `>` or its item's indentation.
	...Object.fromEntries(
		[93, 232, 233, 238, 247, 250, 251, 291, 292, 293, 312].map((n) => [
			`commonmark:${n}`,
			'Lazy continuation lines'
		])
	)
};

/** @prose
 * Where the oracle and the spec's own HTML disagree on an example compared with it, and why.
 * markz is still compared with the oracle there; this list only explains the oracle's self-check.
 */
export const oracleDiffers: Record<string, string> = {
	'gfm:279': 'cmark-gfm orders task-item input attributes differently and omits the void slash',
	'gfm:280': 'cmark-gfm orders task-item input attributes differently and omits the void slash'
};

/** @prose
 * ## Cut forms
 *
 * Each rule names the oracle token that shows a form markz reads differently, and where the
 * example goes: a Not supported row, or a construct markz keeps under its own rule. The first
 * matching rule wins. A token only suggests the form: when markz raises no warning for that row,
 * it read the input as supported (`*` touching a word), so the example stays in its construct and
 * is compared with the oracle.
 */
const first = (t: Token) => t.text.trimStart()[0];

export const cuts: [section: string, test: (t: Token) => boolean][] = [
	['Comments', (t) => t.type === 'htmlFlow' && t.text.trimStart().startsWith('<!--')],
	['MDX', (t) => /^html(?:Flow|Text)$/.test(t.type) && /^<\/?[A-Z][a-z]/.test(t.text.trimStart())],
	['Raw HTML', (t) => t.type === 'htmlFlow' || t.type === 'htmlText'],
	['Setext headings', (t) => t.type === 'setextHeading'],
	['Indented code blocks', (t) => t.type === 'codeIndented'],
	['`~~~` fences', (t) => t.type === 'codeFencedFenceSequence' && t.text[0] === '~'],
	['Reference links', (t) => t.type === 'definition' || t.type === 'reference'],
	['Bare URLs', (t) => t.type === 'literalAutolink'],
	['Named character', (t) => t.type === 'characterReference' && !t.text.startsWith('&#')],
	['Two trailing spaces', (t) => t.type === 'hardBreakTrailing'],
	['`***`', (t) => t.type === 'thematicBreak' && first(t) !== '-'],
	['`__strong__`', (t) => t.type === 'strongSequence' && t.text[0] === '_'],
	['`*emphasis*`', (t) => t.type === 'emphasisSequence' && t.text[0] === '*'],
	['`~single~`', (t) => t.type === 'strikethroughSequence' && t.text.length === 1]
];

function filed(
	section: string,
	upstream: string | null
): Pick<Example, 'section' | 'part' | 'kind'> {
	const p = part(section);
	if (!p) throw new Error(`"${section}" is not a construct or row in syntax.md`);
	const kind: Kind =
		p === 'Not supported' ? 'not supported' : upstream === section ? 'oracle' : 'differs';
	return { section, part: p, kind };
}

function upstreamExample(
	source: 'commonmark' | 'gfm',
	e: { example: number; section: string; markdown: string; html: string }
): Example {
	const id = `${source}:${e.example}`;
	const home = sections[`${source}:${e.section}`];
	if (!home) throw new Error(`${source} section "${e.section}" is not mapped to syntax.md`);
	let found = listed[id] ?? cuts.find(([, test]) => tokens(e.markdown).some(test))?.[0];
	// Where markz accepts what the token looked like (`*` touching a word), it isn't a cut.
	const cut = found && !listed[id] && row(found);
	if (cut && !parse(e.markdown).warnings.some((w) => w.instead === cut.instead)) found = undefined;
	// `filed` calls an example "oracle" when it stays in its own construct.
	const where = filed(found ?? home, found ? null : home);
	return {
		source,
		id,
		number: e.example,
		upstream: e.section,
		markdown: e.markdown,
		html: e.html,
		warnings: [],
		...where
	};
}

/** @prose
 * ## markz's own
 *
 * `dialect/*.md` holds markz's examples in the CommonMark spec's format, in the fence oxfmt
 * writes: a backtick fence with the info string `example`, long enough for what it holds, then
 * the Markdown, a `.` line, the expected HTML, and optionally a second `.` line and the text each
 * warning covers, one per line. Without that part, the example must warn about nothing. `→` is a
 * tab, `␣` a space that would otherwise be invisible at the end of a line, and `⏎` a line ending
 * inside a warning's text. Each example is filed under the nearest `##` heading.
 */
function dialect(file: string, text: string): Example[] {
	const out: Example[] = [];
	let section = '';
	const lines = text.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		if (line.startsWith('## ')) section = line.slice(3).trim();
		const fence = /^(`{3,})example$/.exec(line)?.[1];
		if (!fence) continue;
		const body: string[] = [];
		for (i++; lines[i] !== fence; i++) body.push(lines[i]!);
		const parts: string[][] = [[]];
		for (const l of body) {
			if (l === '.') parts.push([]);
			else parts.at(-1)!.push(l);
		}
		const [markdown = '', html = '', warnings = ''] = parts.map((p) => p.join('\n'));
		const decode = (s: string) => s.replace(/→/g, '\t').replace(/␣/g, ' ');
		const number = out.length + 1;
		out.push({
			source: 'markz',
			id: `markz:${file}:${number}`,
			number,
			upstream: null,
			markdown: decode(markdown),
			html: decode(html),
			warnings: warnings
				.split('\n')
				.filter(Boolean)
				.map((w) => decode(w).replace(/⏎/g, '\n')),
			...filed(section, null),
			kind: 'expected'
		});
	}
	return out;
}

export const examples: Example[] = [
	...commonmark.map((e) => upstreamExample('commonmark', e)),
	...gfm.map((e) => upstreamExample('gfm', e)),
	...dialect('metadata', metadata),
	...dialect('block', block),
	...dialect('inline', inline),
	...dialect('not-supported', notSupported)
];

/** @prose
 * ## Checking an example
 *
 * One function decides every status, for the tests and for the site. `problem` says why an
 * example fails.
 */
export interface Result {
	status: Status;
	markz: string;
	/** micromark's HTML, for an upstream example. */
	oracle: string | null;
	warnings: Warning[];
	problem: string | null;
}

export function check(e: Example): Result {
	let doc: Document;
	let markz: string;
	try {
		doc = parse(e.markdown);
		markz = html(doc);
	} catch (error) {
		return { status: 'fail', markz: String(error), oracle: null, warnings: [], problem: 'threw' };
	}
	const oracle = e.source === 'markz' ? null : reference(e.markdown);
	const result = (problem: string | null, status: Status = problem ? 'fail' : 'pass'): Result => ({
		status,
		markz,
		oracle,
		warnings: [...doc.warnings],
		problem
	});
	if (e.kind === 'oracle') {
		return result(normalize(markz) === normalize(oracle!) ? null : 'differs from the oracle');
	}
	if (e.kind === 'differs') return result(null, 'differs');
	const instead = e.part === 'Not supported' ? row(e.section)!.instead : null;
	if (e.kind === 'not supported') {
		const fired = doc.warnings.some((w) => w.instead === instead);
		return result(fired ? null : `no warning for "${e.section}"`);
	}
	if (markz.replace(/\n$/, '') !== e.html) return result('HTML differs from the expected');
	const covered = doc.warnings.map((w) => e.markdown.slice(w.start, w.end));
	if (JSON.stringify(covered) !== JSON.stringify(e.warnings)) {
		return result(`warned over ${JSON.stringify(covered)}`);
	}
	if (instead && doc.warnings.some((w) => w.instead !== instead)) {
		return result(`a warning's instead isn't the row's "${instead}"`);
	}
	return result(null);
}
