/** @prose
 * # Examples
 *
 * Every example markz is held to, in one shape and filed by the dialect: under a construct, by its
 * id in `grammar.ts` (Metadata, Block, Inline), or under the Not supported row it exercises, by
 * its warning code. Where an
 * example comes from is a label, not a category. The upstream suites are checked against an
 * oracle (micromark for the Markdown, `yaml` for metadata); markz's own examples, in
 * `dialect/*.md`, carry their expected output.
 *
 * An example is one of four kinds:
 *
 * - **oracle:** markz's HTML must match micromark's, after normalization.
 * - **differ:** a construct markz keeps under a different rule (no run splitting, `\ `,
 *   comments). It is filed under that construct, whose heading is the reason, and not compared.
 * - **not supported:** it uses a form the dialect cuts on principle. It holds when that row's
 *   warning fires, so the cut is tested rather than skipped.
 * - **expected:** markz's own example, which must give its HTML and warn over exactly its listed
 *   text, and nothing else.
 */
import { html, parse, type Document, type Warning } from '../src/index';
import block from './dialect/block.md?raw';
import inline from './dialect/inline.md?raw';
import metadata from './dialect/metadata.md?raw';
import notSupported from './dialect/not-supported.md?raw';
import { metadataOracle, normalize, reference, slugOracle, tokens, type Token } from './oracle';
import commonmark from './spec/commonmark.json' with { type: 'json' };
import directive from './spec/directive.json' with { type: 'json' };
import frontmatter from './spec/frontmatter.json' with { type: 'json' };
import slugger from './spec/slugger.json' with { type: 'json' };
import yamlSuite from './spec/yaml.json' with { type: 'json' };
import gfmAutolinkLiteral from './spec/gfm-autolink-literal.json' with { type: 'json' };
import gfmStrikethrough from './spec/gfm-strikethrough.json' with { type: 'json' };
import gfmTable from './spec/gfm-table.json' with { type: 'json' };
import gfm from './spec/gfm.json' with { type: 'json' };
import { part, row, type Part } from './syntax';

export type Upstream =
	| 'commonmark'
	| 'gfm'
	| 'gfm-table'
	| 'gfm-strikethrough'
	| 'gfm-autolink-literal'
	| 'directive'
	| 'frontmatter'
	| 'yaml'
	| 'slugger';
export type Source = Upstream | 'markz';
export type Kind = 'oracle' | 'differ' | 'not supported' | 'expected';
export type Status = 'match' | 'warn' | 'differ' | 'fail';

export interface Example {
	source: Source;
	/** `commonmark:232`, or `markz:block:12` for the 12th example in `dialect/block.md`. */
	id: string;
	number: number;
	/** The construct id or Not supported code it is filed under. */
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
 * Where each upstream section's examples are filed, by `source:section`, by the group an
 * extension suite's section starts with (its fixture file or `test()` group), or by the source
 * alone for a suite that tests one construct. `DIRECTIVE` files a group that mixes directive kinds
 * by what the oracle found. An example that uses a cut form goes to that form's row instead,
 * whatever its section.
 */
const DIRECTIVE = 'by directive kind';

export const sections: Record<string, string> = {
	'commonmark:Tabs': 'list',
	'commonmark:Backslash escapes': 'escape',
	'commonmark:Entity and numeric character references': 'escape',
	'commonmark:Precedence': 'list',
	'commonmark:Thematic breaks': 'thematic-break',
	'commonmark:ATX headings': 'heading',
	'commonmark:Setext headings': 'heading',
	'commonmark:Indented code blocks': 'code-block',
	'commonmark:Fenced code blocks': 'code-block',
	'commonmark:HTML blocks': 'raw-block',
	'commonmark:Link reference definitions': 'link',
	'commonmark:Paragraphs': 'paragraph',
	'commonmark:Blank lines': 'paragraph',
	'commonmark:Block quotes': 'blockquote',
	'commonmark:List items': 'list',
	'commonmark:Lists': 'list',
	'commonmark:Inlines': 'inline-code',
	'commonmark:Code spans': 'inline-code',
	'commonmark:Emphasis and strong emphasis': 'emphasis',
	'commonmark:Links': 'link',
	'commonmark:Images': 'link',
	'commonmark:Autolinks': 'link',
	'commonmark:Raw HTML': 'raw-block',
	'commonmark:Hard line breaks': 'line-break',
	'commonmark:Soft line breaks': 'line-break',
	'commonmark:Textual content': 'paragraph',
	'gfm:Tables': 'table',
	'gfm:Task list items': 'list',
	'gfm:Strikethrough': 'emphasis',
	'gfm:Autolinks': 'link',
	'gfm:Disallowed Raw HTML': 'raw-block',
	'gfm-table': 'table',
	'gfm-strikethrough': 'emphasis',
	'gfm-autolink-literal': 'link',
	'directive:micromark-extension-directive (syntax, text)': 'text-directive',
	'directive:micromark-extension-directive (syntax, leaf)': 'directive',
	'directive:micromark-extension-directive (syntax, container)': 'directive',
	'directive:micromark-extension-directive (compile)': DIRECTIVE,
	'directive:content': DIRECTIVE,
	frontmatter: 'metadata',
	yaml: 'metadata',
	slugger: 'heading'
};

/** A leaf or container directive files the example under `directive`, else `text-directive`. */
function directiveKind(markdown: string): string {
	const block = tokens(markdown).some(
		(t) => t.type === 'directiveLeaf' || t.type === 'directiveContainer'
	);
	return block ? 'directive' : 'text-directive';
}

/** @prose
 * ## Listed by hand
 *
 * What the oracle's tokens can't show, keyed `source:example`: a rule with no token of its own.
 */
export const listed: Record<string, string> = {
	// `\ ` is a non-breaking space in markz, a literal backslash and space in GFM.
	'commonmark:13': 'escape',
	// Emphasis that needs a delimiter run split (`****`, `__foo_`), which markz doesn't do.
	...Object.fromEntries(
		[
			408, 409, 413, 414, 415, 416, 417, 426, 427, 430, 431, 442, 443, 444, 445, 446, 447, 454, 455,
			456, 457, 458, 459, 464, 465, 466, 467, 468
		].map((n) => [`commonmark:${n}`, 'emphasis'])
	),
	// A run opened before a `[` can't close inside the brackets, even when they make no link.
	'commonmark:523': 'emphasis',
	// A paragraph continuing without its `>` or its item's indentation.
	...Object.fromEntries(
		[93, 232, 233, 238, 247, 250, 251, 291, 292, 293, 312].map((n) => [
			`commonmark:${n}`,
			'lazy-line'
		])
	),
	...Object.fromEntries([78, 79, 81, 85].map((n) => [`gfm-table:${n}`, 'lazy-line'])),
	'gfm-table:58': 'escape',
	// github-slugger's character class is Unicode 13's; markz's properties are the runtime's, where
	// `𐗋` and others have since been assigned as letters.
	'slugger:73': 'heading',
	// Content after the block: a `***` rule and indented code, both cut.
	'frontmatter:4': 'rule-marker',
	// micromark's attribute syntax is wider than markz's one line of `#id .class key=value key`:
	// single quotes, spaces around `=`, `.a.b` with no space, braces across lines, and keys outside
	// ASCII or starting with `_`. markz's is looser in one place: any character but a space, brace,
	// quote or `=` may be in a name or value.
	...Object.fromEntries(
		[
			36, 38, 41, 43, 44, 50, 53, 56, 57, 61, 65, 89, 96, 97, 150, 228, 232, 233, 234, 235, 236,
			237, 238, 239, 240, 241, 242, 243
		].map((n) => [`directive:${n}`, 'attributes'])
	),
	// `:a{}` is a directive in markz; the oracle's handler can't tell it from a bare `:a`.
	'directive:34': 'text-directive',
	'directive:35': 'text-directive',
	// micromark stops balancing a label's brackets at 32 levels; markz has no limit.
	'directive:216': 'text-directive',
	// A leaf or container name starts with a letter in markz, as a text directive's does.
	...Object.fromEntries([70, 71, 131, 132].map((n) => [`directive:${n}`, 'directive'])),
	// A container's label is plain text in markz.
	'directive:144': 'directive',
	// micromark's tight list drops the `<p>` inside a container directive in the item, too.
	'directive:163': 'directive',
	// `&apos;` in an attribute value, which the oracle shows as no reference token.
	'directive:226': 'named-reference',
	'directive:227': 'named-reference'
};

/** @prose
 * Where the oracle and the spec's own HTML disagree on an example compared with it, and why.
 * markz is still compared with the oracle there; this list explains the oracle's self-check, and
 * for bare URLs lets markz warn where GitHub links and the oracle doesn't.
 */
export const oracleDiffers: Record<string, string> = {
	'gfm:279': 'cmark-gfm orders task-item input attributes differently and omits the void slash',
	'gfm:280': 'cmark-gfm orders task-item input attributes differently and omits the void slash',
	'gfm-table:58':
		'GitHub reads an escaped backslash before a pipe as escaping the pipe (cmark-gfm#277)',
	'yaml:18': '`yaml` reads `!!binary` as bytes, where the suite writes the base64 string',
	'commonmark:98': 'the oracle reads the opening `---` block as frontmatter, as markz does',
	'slugger:19': "the suite's id is numbered past ` a `, a fixture a heading can't hold",
	'gfm-autolink-literal:12':
		'the fixture\'s HTML went through rehype, which writes `&#x26;`, `"` and `>` differently',
	'gfm-autolink-literal:19': 'GitHub links an email after `:`, and micromark does not',
	'gfm-autolink-literal:21': 'GitHub links `www.` after a tab, and micromark does not',
	'gfm-autolink-literal:22': 'GitHub links an email after a tab, and micromark does not',
	'gfm-autolink-literal:23': 'GitHub links an email after `:`, and micromark does not'
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
	['comment', (t) => t.type === 'htmlFlow' && t.text.trimStart().startsWith('<!--')],
	['jsx', (t) => /^html(?:Flow|Text)$/.test(t.type) && /^<\/?[A-Z][a-z]/.test(t.text.trimStart())],
	['raw-html', (t) => t.type === 'htmlFlow' || t.type === 'htmlText'],
	['setext-heading', (t) => t.type === 'setextHeading'],
	['indented-code', (t) => t.type === 'codeIndented'],
	['tilde-fence', (t) => t.type === 'codeFencedFenceSequence' && t.text[0] === '~'],
	['reference-link', (t) => t.type === 'definition' || t.type === 'reference'],
	['bare-url', (t) => t.type === 'literalAutolink'],
	['named-reference', (t) => t.type === 'characterReference' && !t.text.startsWith('&#')],
	['trailing-spaces', (t) => t.type === 'hardBreakTrailing'],
	['rule-marker', (t) => t.type === 'thematicBreak' && first(t) !== '-'],
	['underscore-strong', (t) => t.type === 'strongSequence' && t.text[0] === '_'],
	['star-emphasis', (t) => t.type === 'emphasisSequence' && t.text[0] === '*'],
	['single-tilde', (t) => t.type === 'strikethroughSequence' && t.text.length === 1]
];

function filed(
	section: string,
	upstream: string | null
): Pick<Example, 'section' | 'part' | 'kind'> {
	const p = part(section);
	if (!p) throw new Error(`"${section}" is not a construct id or a Not supported code`);
	const kind: Kind =
		p === 'Not supported' ? 'not supported' : upstream === section ? 'oracle' : 'differ';
	return { section, part: p, kind };
}

function upstreamExample(
	source: Upstream,
	e: { example: number; section: string; markdown: string; html: string }
): Example {
	const id = `${source}:${e.example}`;
	let home =
		sections[`${source}:${e.section}`] ??
		sections[`${source}:${e.section.split(' › ')[0]}`] ??
		sections[source];
	if (home === DIRECTIVE) home = directiveKind(e.markdown);
	if (!home) throw new Error(`${source} section "${e.section}" is not mapped to syntax.md`);
	// micromark's tokens say nothing about a YAML block or a heading's id.
	const token =
		source === 'yaml' || source === 'slugger'
			? undefined
			: cuts.find(([, test]) => tokens(e.markdown).some(test));
	let found = listed[id] ?? token?.[0];
	// Where markz accepts what the token looked like (`*` touching a word), it isn't a cut.
	const cut = found && !listed[id] && row(found);
	if (cut && !parse(e.markdown).warnings.some((w) => w.code === cut.code)) found = undefined;
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
 * inside a warning's text. Each example is filed under the nearest `##` heading: a construct id
 * or a warning code.
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
	...gfmTable.map((e) => upstreamExample('gfm-table', e)),
	...gfmStrikethrough.map((e) => upstreamExample('gfm-strikethrough', e)),
	...gfmAutolinkLiteral.map((e) => upstreamExample('gfm-autolink-literal', e)),
	...directive.map((e) => upstreamExample('directive', e)),
	...frontmatter.map((e) => upstreamExample('frontmatter', e)),
	...yamlSuite.map((e) => upstreamExample('yaml', e)),
	// Each slugger fixture follows the ones before it in one document, so repeats are numbered.
	...slugger.map((e, i) =>
		upstreamExample('slugger', {
			...e,
			markdown: slugger
				.slice(0, i + 1)
				.map((f) => f.markdown)
				.join('')
		})
	),
	...dialect('metadata', metadata),
	...dialect('block', block),
	...dialect('inline', inline),
	...dialect('not-supported', notSupported)
];

/** @prose
 * ## Checking an example
 *
 * One function decides every status, for the tests and for the site. An example holds in one of
 * three ways and fails in the fourth:
 *
 * - **match:** it gives what it is held to, the oracle's output or markz's own expected HTML.
 * - **warn:** it holds because markz warned: a Not supported row's warning fired, or a metadata
 *   line markz doesn't read was reported rather than read differently from YAML.
 * - **differ:** it is filed under a construct markz keeps under its own rule, and not compared.
 * - **fail:** anything else.
 *
 * `detail` says which: what it matched (`oracle`, `expected`), the codes it warned with, or why it
 * fails. `problem` is set only for a failure, for the tests.
 */
export interface Result {
	status: Status;
	detail: string;
	markz: string;
	/** The oracle's output, for an upstream example. */
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
		const problem = 'threw';
		return {
			status: 'fail',
			detail: problem,
			markz: String(error),
			oracle: null,
			warnings: [],
			problem
		};
	}
	if (e.source === 'yaml') return againstYaml(e, doc);
	if (e.source === 'slugger') return againstSlugger(e, doc);
	const oracle = e.source === 'markz' ? null : reference(e.markdown);
	const code = e.part === 'Not supported' ? e.section : null;
	const result = (status: Status, detail: string): Result => ({
		status,
		detail,
		markz,
		oracle,
		warnings: [...doc.warnings],
		problem: status === 'fail' ? detail : null
	});
	const holds = () => (code ? result('warn', code) : result('match', e.kind));
	if (e.kind === 'oracle') {
		return normalize(markz) === normalize(oracle!)
			? holds()
			: result('fail', 'differs from the oracle');
	}
	if (e.kind === 'differ') return result('differ', 'by design');
	if (e.kind === 'not supported') {
		const fired = doc.warnings.some((w) => w.code === code);
		if (!fired) return result('fail', `no \`${code}\` warning`);
		const missed =
			code === 'bare-url' ? unwarnedUrls(e.markdown, doc, !!oracleDiffers[e.id]) : null;
		return missed ? result('fail', missed) : holds();
	}
	if (markz.replace(/\n$/, '') !== e.html) return result('fail', 'HTML differs from the expected');
	const covered = doc.warnings.map((w) => e.markdown.slice(w.start, w.end));
	if (JSON.stringify(covered) !== JSON.stringify(e.warnings)) {
		return result('fail', `warned over ${JSON.stringify(covered)}`);
	}
	if (code && doc.warnings.some((w) => w.code !== code)) {
		return result('fail', `a warning other than \`${code}\``);
	}
	return holds();
}

/** @prose
 * ## Bare URLs, one by one
 *
 * A document can hold many bare URLs, so one `bare-url` warning isn't enough: each URL GFM links
 * must have its own warning, and each warning a URL GFM links, or a reader loses a link with no
 * signal. They pair by overlap, not by exact text: where GFM trims a URL's tail (a `;`, a `]`,
 * an `&amp;`) is its autolink rule, the one the dialect cuts, and a warning a character longer
 * still points at the right URL. Where GitHub links more than the oracle (`oracleDiffers`), only a
 * missed link fails.
 */
function unwarnedUrls(markdown: string, doc: Document, github: boolean): string | null {
	const gfm = tokens(markdown).filter((t) => t.type === 'literalAutolink');
	if (!gfm.length) return null;
	const mine = doc.warnings.filter((w) => w.code === 'bare-url');
	const overlaps = (a: Range, b: Range) => a.start < b.end && b.start < a.end;
	const missed = gfm.filter((t) => !mine.some((w) => overlaps(t, w)));
	const extra = github ? [] : mine.filter((w) => !gfm.some((t) => overlaps(t, w)));
	if (!missed.length && !extra.length) return null;
	const text = (r: Range) => markdown.slice(r.start, r.end);
	return `missed ${JSON.stringify(missed.map(text))}, warned over ${JSON.stringify(extra.map(text))} where GFM links nothing`;
}

type Range = { start: number; end: number };

/** @prose
 * ## Metadata against YAML
 *
 * A yaml-test-suite example is held to the `yaml` package, key by key: every key markz keeps
 * must have the value YAML gives it, and a block YAML rejects must raise a metadata warning. A
 * key markz skipped is fine when it warned about the line, and such an example warns rather than
 * matches. A block markz doesn't read as metadata at all differs, by the metadata rule.
 */
function againstYaml(e: Example, doc: Document): Result {
	const oracle = metadataOracle(e.markdown.slice(4, -4));
	const mine = doc.metadata;
	const codes = [
		...new Set(doc.warnings.filter((w) => w.code.startsWith('metadata-')).map((w) => w.code))
	];
	const result = (status: Status, detail: string): Result => ({
		status,
		detail,
		markz: mine === undefined ? '(not metadata)' : JSON.stringify(mine, null, 1),
		oracle: 'error' in oracle ? `error: ${oracle.error}` : JSON.stringify(oracle.value, null, 1),
		warnings: [...doc.warnings],
		problem: status === 'fail' ? detail : null
	});
	const holds = () => (codes.length ? result('warn', codes.join(', ')) : result('match', 'oracle'));
	if (mine === undefined) return result('differ', 'not metadata');
	if ('error' in oracle) {
		return codes.length ? holds() : result('fail', 'accepted a block YAML rejects');
	}
	const value = oracle.value as Record<string, unknown>;
	for (const [key, v] of Object.entries(mine)) {
		if (JSON.stringify(v) !== JSON.stringify(value[key]))
			return result('fail', `\`${key}\` differs from YAML`);
	}
	if (!codes.length && Object.keys(value).length !== Object.keys(mine).length) {
		return result('fail', 'dropped a key without a warning');
	}
	return holds();
}

/** @prose
 * ## Heading ids against github-slugger
 *
 * A github-slugger example is a document of headings, and what is checked is the last one's id:
 * it must be the one github-slugger gives the same texts in the same order.
 */
function againstSlugger(e: Example, doc: Document): Result {
	const ids = [...doc.children(doc.root)]
		.filter((n) => doc.type(n) === 'heading')
		.map((n) => doc.data(n, 'heading').id);
	const oracle = slugOracle(headingTexts(e.markdown)).at(-1)!;
	const mine = ids.at(-1) ?? '';
	const [status, detail]: [Status, string] =
		e.kind === 'differ'
			? ['differ', 'by design']
			: mine === oracle
				? ['match', 'oracle']
				: ['fail', 'a different id from github-slugger'];
	return {
		status,
		detail,
		markz: mine,
		oracle,
		warnings: [...doc.warnings],
		problem: status === 'fail' ? detail : null
	};
}

/** The text of each `# …` line a slugger example is made of, its escapes undone. */
export function headingTexts(markdown: string): string[] {
	return markdown
		.trimEnd()
		.split('\n')
		.map((l) => l.slice(2).replace(/\\([!-/:-@[-`{-~])/g, '$1'));
}
