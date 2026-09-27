/** @prose
 * # Examples
 *
 * Every example markz is held to, in one shape and filed by the dialect: under a construct, by its
 * id in `grammar.ts` (Metadata, Block, Inline), or under the Not supported row it exercises, by
 * its warning code. Where an
 * example comes from is a label, not a category. The upstream suites are checked against an
 * oracle (micromark for the Markdown, `yaml` for metadata); markz's own examples, in
 * `examples/markz/`, carry their expected output.
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
import { html, parse, type Document, type NodeId, type Warning } from '../src/index';
import {
	collapse,
	mathOracle,
	metadataOracle,
	normalize,
	reference,
	slugOracle,
	tokens,
	type MathSpan,
	type Token
} from './oracle';
import commonmark from './examples/upstream/commonmark.md?raw';
import directive from './examples/upstream/directive.md?raw';
import frontmatter from './examples/upstream/frontmatter.md?raw';
import math from './examples/upstream/math.md?raw';
import slugger from './examples/upstream/slugger.md?raw';
import yamlSuite from './examples/upstream/yaml.md?raw';
import gfmFootnote from './examples/upstream/gfm-footnote.md?raw';
import gfmAutolinkLiteral from './examples/upstream/gfm-autolink-literal.md?raw';
import gfmStrikethrough from './examples/upstream/gfm-strikethrough.md?raw';
import gfmTable from './examples/upstream/gfm-table.md?raw';
import gfm from './examples/upstream/gfm.md?raw';
import { readFences, type Fence } from './fences';
import { part, row, type Part } from './syntax';
import { element } from '../src/elements';

export type Upstream =
	| 'commonmark'
	| 'gfm'
	| 'gfm-table'
	| 'gfm-strikethrough'
	| 'gfm-autolink-literal'
	| 'gfm-footnote'
	| 'directive'
	| 'frontmatter'
	| 'yaml'
	| 'slugger'
	| 'math';
export type Source = Upstream | 'markz';
/**
 * What an example is held to: micromark (`oracle`), the `yaml` package, github-slugger, the math
 * extension's spans, or, for markz's own, its expected output. An upstream file names it in its
 * metadata.
 */
export type Checks = 'oracle' | 'yaml' | 'slug' | 'math' | 'expected';
const CHECKS: Checks[] = ['oracle', 'yaml', 'slug', 'math'];
export type Kind = 'oracle' | 'differ' | 'not supported' | 'expected';
/** The edges a construct is tried at (`cases.ts`); a valid case needs no label. */
export type Category = 'valid' | 'boundary' | 'near-miss' | 'ambiguous' | 'unclosed';
export const CATEGORIES: Category[] = ['valid', 'boundary', 'near-miss', 'ambiguous', 'unclosed'];
export type Status = 'match' | 'warn' | 'differ' | 'fail';

export interface Example {
	source: Source;
	/** `commonmark:232`, or `markz:12`: the number in the example's fence. */
	id: string;
	number: number;
	/** The construct id or Not supported code it is filed under. */
	section: string;
	part: Part;
	/** The section of the upstream suite, for an upstream example. */
	upstream: string | null;
	kind: Kind;
	checks: Checks;
	markdown: string;
	/** The spec's own HTML for an upstream example; the expected HTML for markz's own. */
	html: string;
	/** For markz's own: the source text each warning covers, in order. */
	warnings: string[];
	/** For markz's own: the edge it tries (`cases.ts`), and for an ambiguous one, the side rule. */
	category: Category | null;
	rule: string | null;
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
const MATH = 'by math kind';

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
	'gfm-footnote': 'link',
	'directive:micromark-extension-directive (syntax, text)': 'text-directive',
	'directive:micromark-extension-directive (syntax, leaf)': 'directive',
	'directive:micromark-extension-directive (syntax, container)': 'directive',
	'directive:micromark-extension-directive (compile)': DIRECTIVE,
	'directive:content': DIRECTIVE,
	frontmatter: 'metadata',
	yaml: 'metadata',
	slugger: 'heading',
	math: MATH
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
		[36, 38, 41, 43, 44, 49, 52, 53, 57, 61].map((n) => [`directive:${n}`, 'attributes'])
	),
	// `:a{}` is a directive in markz; the oracle's handler can't tell it from a bare `:a`.
	'directive:34': 'text-directive',
	'directive:35': 'text-directive',
	// micromark stops balancing a label's brackets at 32 levels; markz has no limit.
	'directive:143': 'text-directive',
	// A leaf or container name starts with a letter in markz, as a text directive's does.
	...Object.fromEntries([66, 67, 93, 94].map((n) => [`directive:${n}`, 'directive'])),
	// micromark-extension-math pairs dollar runs as code spans pair backticks. markz's inline math
	// is pandoc's single `$`, whose TeX holds no `$` and has no space inside either end, and a run
	// of dollars around math in a line, or a `$$$` fence, is text that warns.
	...Object.fromEntries([1, 5, 6, 7, 8, 10, 11, 15].map((n) => [`math:${n}`, 'math-delimiter'])),
	...Object.fromEntries([3, 13].map((n) => [`math:${n}`, 'inline-math'])),
	// A math block's fence is exactly `$$` on a line of its own, with no meta string.
	...Object.fromEntries([19, 20].map((n) => [`math:${n}`, 'math-block'])),
	// micromark's tight list drops the `<p>` inside a container directive in the item, too.
	'directive:103': 'directive',
	// `&apos;` in an attribute value, which the oracle shows as no reference token.
	'directive:144': 'named-reference',
	'directive:145': 'named-reference'
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
	'yaml:9': '`yaml` reads `!!binary` as bytes, where the suite writes the base64 string',
	'commonmark:98': 'the oracle reads the opening `---` block as frontmatter, as markz does',
	'slugger:19': "the suite's id is numbered past ` a `, a fixture a heading can't hold",
	'gfm-autolink-literal:12': 'GitHub links `www.` after a tab, and micromark does not',
	'gfm-autolink-literal:13': 'GitHub links an email after a tab, and micromark does not',
	'gfm-autolink-literal:14': 'GitHub links an email after `:`, and micromark does not'
};

/** @prose
 * ## Cut forms
 *
 * Each rule names the oracle token that shows a form markz reads differently, and where the
 * example goes: a Not supported row, or a construct markz keeps under its own rule. The first
 * matching rule wins. A token only suggests the form: a row's rule matches only when markz raised
 * that row's warning, since otherwise it read the input as supported (`*` touching a word, or
 * `http:example` that micromark takes for a bare `:example`). An example no rule matches stays in
 * its construct and is compared with the oracle.
 */
const first = (t: Token) => t.text.trimStart()[0];

export const cuts: [section: string, test: (t: Token) => boolean][] = [
	['comment', (t) => t.type === 'htmlFlow' && t.text.trimStart().startsWith('<!--')],
	['jsx', (t) => /^html(?:Flow|Text)$/.test(t.type) && /^<\/?[A-Z][a-z]/.test(t.text.trimStart())],
	['raw-html', (t) => t.type === 'htmlFlow' || t.type === 'htmlText'],
	['directive-name', (t) => t.type in NAMES && !element(t.text, NAMES[t.type]!)],
	['setext-heading', (t) => t.type === 'setextHeading'],
	['indented-code', (t) => t.type === 'codeIndented'],
	['tilde-fence', (t) => t.type === 'codeFencedFenceSequence' && t.text[0] === '~'],
	['footnote', (t) => t.type === 'gfmFootnoteCall' || t.type === 'gfmFootnoteDefinition'],
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

/** @prose
 * ## Directive names
 *
 * The directive suite names its directives `a`, `b` and `youtube`, words markz rejects since a
 * name is the element it writes. What most of its tests check is everything else (fences, labels,
 * attributes), so a plain lowercase word that isn't an element of its kind becomes a custom
 * element, `a` to `x-a`, and the example is compared with the oracle as before. The names the
 * suite tests as names (`a_b`, `a-`, capitals) keep theirs, and those that markz rejects are
 * filed under `directive-name`.
 */
const NAMES: Record<string, boolean> = {
	directiveTextName: true,
	directiveLeafName: false,
	directiveContainerName: false
};

export function markzNames(markdown: string): string {
	let out = '';
	let at = 0;
	for (const t of tokens(markdown)) {
		const inline = NAMES[t.type];
		if (inline === undefined || !/^[a-z][a-z\d]*$/.test(t.text) || element(t.text, inline))
			continue;
		out += `${markdown.slice(at, t.start)}x-${t.text}`;
		at = t.end;
	}
	return out + markdown.slice(at);
}

function upstreamExample(
	source: Upstream,
	checks: Checks,
	vendored: { example: number; section: string; markdown: string; html: string }
): Example {
	const e =
		source === 'directive' ? { ...vendored, markdown: markzNames(vendored.markdown) } : vendored;
	const id = `${source}:${e.example}`;
	let home =
		sections[`${source}:${e.section}`] ??
		sections[`${source}:${e.section.split(' › ')[0]}`] ??
		sections[source];
	if (home === DIRECTIVE) home = directiveKind(e.markdown);
	if (home === MATH) {
		home = mathOracle(e.markdown).some((m) => m.block) ? 'math-block' : 'inline-math';
	}
	if (!home) throw new Error(`${source} section "${e.section}" is not mapped to syntax.md`);
	// micromark's tokens say nothing about a YAML block or a heading's id.
	const oracleTokens = checks === 'oracle' ? tokens(e.markdown) : [];
	const codes = new Set(parse(e.markdown).warnings.map((w) => w.code));
	// Where markz accepts what the token looked like (`*` touching a word), it isn't a cut.
	const token = cuts.find(([section, test]) => {
		const cut = row(section);
		return oracleTokens.some(test) && (!cut || codes.has(cut.code));
	});
	const found = listed[id] ?? token?.[0];
	// `filed` calls an example "oracle" when it stays in its own construct.
	const where = filed(found ?? home, found ? null : home);
	return {
		source,
		id,
		number: e.example,
		upstream: e.section,
		markdown: e.markdown,
		html: e.html,
		checks,
		warnings: [],
		category: null,
		rule: null,
		...where
	};
}

/** @prose
 * ## Loading
 *
 * Every example is read from its file by `fences.ts`. An upstream suite's metadata names what it
 * is checked by, and its examples keep the suite's numbers. markz's own, in `examples/markz/`,
 * are filed by their file, one per construct id, or in `not-supported.md` by the `##` warning code
 * above them. Each is numbered in its fence from one sequence, in the order the ids are listed, so
 * moving an example never renames it. They must give their expected HTML and warn over exactly
 * the text listed, or about nothing if none is.
 */
function upstream(source: Upstream, text: string): Example[] {
	const { meta, examples: fences } = readFences(text);
	const checks = meta['checks'] as Checks;
	if (!CHECKS.includes(checks)) throw new Error(`${source}: checked by "${checks}"`);
	const vendored = fences.map((f: Fence) => ({
		example: f.number!,
		section: f.section,
		markdown: f.markdown,
		html: f.expected
	}));
	// Each slugger fixture follows the ones before it in one document, so repeats are numbered.
	if (checks === 'slug') {
		for (const [i, e] of vendored.entries()) {
			e.markdown = fences
				.slice(0, i + 1)
				.map((f) => f.markdown)
				.join('');
		}
	}
	return vendored.map((e) => upstreamExample(source, checks, e));
}

const own = import.meta.glob<string>(['./examples/markz/*.md', '!**/README.md'], {
	query: '?raw',
	import: 'default',
	eager: true
});

function markz(): Example[] {
	const out = Object.entries(own).flatMap(([path, text]) => {
		const file = /([\w-]+)\.md$/.exec(path)![1]!;
		return readFences(text).examples.map((f): Example => {
			if (f.number === null) throw new Error(`${file}: an example without a number`);
			if (f.category && !CATEGORIES.includes(f.category as Category)) {
				throw new Error(`${file}: "${f.category}" is not a category`);
			}
			return {
				source: 'markz',
				id: `markz:${f.number}`,
				number: f.number,
				upstream: null,
				markdown: f.markdown,
				html: f.expected,
				checks: 'expected',
				warnings: f.warnings,
				category: f.category as Category | null,
				rule: f.rule,
				...filed(file === 'not-supported' ? f.section : file, null),
				kind: 'expected'
			};
		});
	});
	return out.sort((x, y) => x.number - y.number);
}

export const examples: Example[] = [
	...upstream('commonmark', commonmark),
	...upstream('gfm', gfm),
	...upstream('gfm-table', gfmTable),
	...upstream('gfm-strikethrough', gfmStrikethrough),
	...upstream('gfm-autolink-literal', gfmAutolinkLiteral),
	...upstream('gfm-footnote', gfmFootnote),
	...upstream('directive', directive),
	...upstream('frontmatter', frontmatter),
	...upstream('yaml', yamlSuite),
	...upstream('math', math),
	...upstream('slugger', slugger),
	...markz()
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
	if (e.checks === 'yaml') return againstYaml(e, doc);
	if (e.checks === 'slug') return againstSlugger(e, doc);
	if (e.checks === 'math') return againstMath(e, doc, markz);
	const oracle = e.checks === 'oracle' ? reference(e.markdown) : null;
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
		const missed = unwarned(code!, e.markdown, doc, !!oracleDiffers[e.id]);
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
 * ## One warning for each
 *
 * A document can hold many bare URLs or footnotes, so one warning isn't enough: each URL GFM
 * links, and each footnote call or definition it reads, must have its own warning, or a reader
 * loses one with no signal. They pair by overlap, not by exact text: where GFM trims a URL's tail
 * (a `;`, a `]`, an `&amp;`) is its autolink rule, the one the dialect cuts, and a warning a
 * character longer still points at the right URL.
 *
 * A bare-URL warning where GFM links nothing fails too, except where GitHub links more than the
 * oracle (`oracleDiffers`). A footnote warning never does: GFM makes `[^x]` a footnote only when
 * the document defines `x`, which markz, reading a paragraph at a time, doesn't look for, so it
 * reports all footnote syntax.
 */
const EACH: Record<string, string[]> = {
	'bare-url': ['literalAutolink'],
	footnote: ['gfmFootnoteCall', 'gfmFootnoteDefinitionLabel']
};

export function unwarned(
	code: string,
	markdown: string,
	doc: Document,
	github: boolean
): string | null {
	const types = EACH[code];
	if (!types) return null;
	const gfm = tokens(markdown).filter((t) => types.includes(t.type));
	if (!gfm.length) return null;
	const mine = doc.warnings.filter((w) => w.code === code);
	const overlaps = (a: Range, b: Range) => a.start < b.end && b.start < a.end;
	const missed = gfm.filter((t) => !mine.some((w) => overlaps(t, w)));
	const extra =
		github || code !== 'bare-url' ? [] : mine.filter((w) => !gfm.some((t) => overlaps(t, w)));
	if (!missed.length && !extra.length) return null;
	const text = (r: Range) => markdown.slice(r.start, r.end);
	return extra.length
		? `warned over ${JSON.stringify(extra.map(text))} where GFM links nothing`
		: `no \`${code}\` warning over ${JSON.stringify(missed.map(text))}`;
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

/** @prose
 * ## Math against micromark-extension-math
 *
 * The extension writes KaTeX's HTML, so a math example is held to structure instead: markz must
 * find the same math spans, inline or display, starting at the same place and holding the same TeX.
 * One that uses a math delimiter markz cuts holds when its warning fires. Where pandoc's rule, which
 * markz follows, and the extension's code-span-like dollar runs disagree, the example is filed as
 * differ under the construct.
 */
function againstMath(e: Example, doc: Document, markz: string): Result {
	const spans: MathSpan[] = [];
	const walk = (n: NodeId) => {
		if (doc.type(n) === 'math') {
			const d = doc.data(n, 'math');
			spans.push({ block: d.block, start: doc.start(n), value: collapse(d.value) });
		}
		for (const c of doc.children(n)) walk(c);
	};
	walk(doc.root);
	const show = (list: MathSpan[]) =>
		list.map((m) => `${m.start}: ${m.block ? `$$ ${m.value} $$` : `$${m.value}$`}`).join('\n');
	const oracle = show(mathOracle(e.markdown));
	const fired = doc.warnings.some((w) => w.code === e.section);
	const [status, detail]: [Status, string] =
		e.kind === 'differ'
			? ['differ', 'by design']
			: e.kind === 'not supported'
				? fired
					? ['warn', e.section]
					: ['fail', `no \`${e.section}\` warning`]
				: show(spans) === oracle
					? ['match', 'oracle']
					: ['fail', 'different math from micromark-extension-math'];
	return {
		status,
		detail,
		markz: `${show(spans)}\n\n${markz}`,
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
