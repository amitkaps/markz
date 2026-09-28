/** @prose
 * # Oracle
 *
 * The reference markz's `html()` is held to: micromark with GFM and YAML frontmatter,
 * which are well-tested and dev-only (design: Testing). Frontmatter writes nothing, as metadata
 * doesn't in `html()`, so every example checks that markz finds the same block. Two settings make it render what markz should, not
 * what micromark's own policy would:
 *
 * - `allowDangerousProtocol`: micromark blanks any URL outside its scheme allowlist, and markz
 *   instead drops a short blocklist (design: Security). markz's own tests cover the blocklist, so
 *   the oracle writes every URL.
 *
 * There is no directive extension: colon directives are a form markz cuts, so micromark leaves
 * them as the literal text markz keeps. Raw HTML stays disallowed, as it is in markz. Examples that use it are excluded anyway.
 */
import { micromark, parse, postprocess, preprocess } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import { frontmatter, frontmatterHtml } from 'micromark-extension-frontmatter';
import { math } from 'micromark-extension-math';
import GithubSlugger from 'github-slugger';
import YAML from 'yaml';

const extensions = [gfm(), frontmatter()];

export function reference(markdown: string): string {
	return micromark(markdown, {
		extensions,
		htmlExtensions: [gfmHtml(), frontmatterHtml()],
		allowDangerousProtocol: true
	});
}

/** @prose
 * ## Normalization
 *
 * What counts as the same output. Whitespace runs outside `<pre>` collapse to one space, and a
 * space next to a block-level tag goes, so line layout never fails a test. A space between inline
 * tags (`<em>a</em> <em>b</em>`) is content and stays. Smart punctuation goes back to straight
 * characters, since micromark doesn't do it and markz always does; a double quote goes back to
 * `&quot;`, as micromark escapes it. An empty attribute value goes (`open=""` is `open`), since
 * micromark can't tell a bare key from an empty one. Heading ids go too, since
 * micromark writes none; markz's are tested on their own. `<pre>` content is compared exactly,
 * except that a CR or CRLF is a LF, as the HTML parser reads it before building the page.
 */
const SMART: Record<string, string> = {
	'‘': "'",
	'’': "'",
	'“': '&quot;',
	'”': '&quot;',
	'–': '--',
	'—': '---',
	'…': '...'
};

const BLOCK_TAG =
	/ ?(<\/?(?:p|li|ul|ol|blockquote|h[1-6]|pre|table|thead|tbody|tr|th|td|hr|div|section|article|aside|header|footer|nav|main|address|hgroup|search|details|summary|figure|figcaption|dl|dt|dd)\b[^>]*>) ?/g;

export function normalize(html: string): string {
	return html
		.replace(/\r\n?/g, '\n')
		.split(/(<pre[\s>][\s\S]*?<\/pre>)/)
		.map((part, i, parts) => {
			if (i % 2 === 1) return part;
			let out = part.replace(/\s+/g, ' ').replace(BLOCK_TAG, '$1');
			// `<pre>` is a block tag too, split off above.
			if (i > 0) out = out.replace(/^ /, '');
			if (i < parts.length - 1) out = out.replace(/ $/, '');
			return out;
		})
		.join('')
		.replace(/(<h[1-6])((?: [\w-]+="[^"]*")*?) id="[^"]*"/g, '$1$2')
		.replace(/[‘’“”–—…]/g, (c) => SMART[c]!)
		.replace(/<[a-z][^<>]*>/g, (tag) => tag.replace(/ ([\w:-]+)=""/g, ' $1'))
		.trim();
}

/** @prose
 * ## Tokens
 *
 * What the oracle recognised in an example: each token it opened, with its source text and range. The
 * example list reads these to tell which examples use syntax the dialect cuts, and which have no
 * inline syntax at all, rather than keeping those lists by hand.
 */
export interface Token {
	type: string;
	text: string;
	start: number;
	end: number;
}

export function tokens(markdown: string): Token[] {
	const chunks = preprocess()(markdown, undefined, true);
	const events = postprocess(parse({ extensions }).document().write(chunks));
	return events
		.filter(([kind]) => kind === 'enter')
		.map(([, t]) => ({
			type: t.type,
			text: markdown.slice(t.start.offset, t.end.offset),
			start: t.start.offset,
			end: t.end.offset
		}));
}

/** @prose
 * ## Math
 *
 * micromark-extension-math writes KaTeX's HTML, so what is compared is structure: each math span
 * it finds, display or inline, where it starts (so `$$b$$` isn't taken for `$` and `$b$`), and
 * the TeX inside, read from its tokens with whitespace collapsed.
 */
export interface MathSpan {
	block: boolean;
	start: number;
	value: string;
}

export function mathOracle(markdown: string): MathSpan[] {
	const chunks = preprocess()(markdown, undefined, true);
	const events = postprocess(
		parse({ extensions: [gfm(), math()] })
			.document()
			.write(chunks)
	);
	const out: MathSpan[] = [];
	let current: string[] | null = null;
	for (const [kind, t] of events) {
		if (t.type === 'mathFlow' || t.type === 'mathText') {
			if (kind === 'enter') current = [];
			else {
				const block = t.type === 'mathFlow';
				out.push({ block, start: t.start.offset, value: collapse(current!.join(' ')) });
				current = null;
			}
		} else if (current && kind === 'enter') {
			// A flow's value is a token per line, after any container prefix; text data may split
			// at line endings, so it is joined the same way.
			if (t.type === 'mathFlowValue' || t.type === 'mathTextData') {
				current.push(markdown.slice(t.start.offset, t.end.offset));
			}
		}
	}
	return out;
}

export const collapse = (tex: string) => tex.replace(/\s+/g, ' ').trim();

/** @prose
 * ## Metadata
 *
 * The oracle for a metadata block's body is the `yaml` package, as the metadata rule says: what
 * YAML 1.2 reads, or why it refuses.
 */
export function metadataOracle(body: string): { value: unknown } | { error: string } {
	try {
		return { value: YAML.parse(body, { logLevel: 'error' }) };
	} catch (error) {
		return { error: (error as Error).message.split('\n')[0]! };
	}
}

/** @prose
 * ## Heading ids
 *
 * GitHub's ids, as github-slugger computes them: each text slugged in order, a repeat numbered past
 * the ids already taken.
 */
export function slugOracle(texts: string[]): string[] {
	const slugger = new GithubSlugger();
	return texts.map((t) => slugger.slug(t));
}

/** @prose
 * ## Where they part by design or by the oracle
 *
 * Input the comparison with micromark leaves out, each with its reason: one rule of the dialect,
 * and the places micromark parts from CommonMark's reference implementation, commonmark.js, which
 * agrees with markz. The fuzzer and the documents both use them, so each is written once.
 */
const SEQUENCES = new Set(['emphasisSequence', 'strongSequence', 'strikethroughSequence']);

export const APART: [reason: string, test: (markdown: string, found: Token[]) => boolean][] = [
	[
		'emphasis runs never split (syntax.md: Emphasis), as the spec examples that need one differ',
		(markdown, found) =>
			found.some(
				(t) =>
					SEQUENCES.has(t.type) &&
					(markdown[t.start - 1] === t.text[0] || markdown[t.end] === t.text[0])
			)
	],
	[
		"micromark keeps a paragraph line's indentation inside a code span that crosses onto it",
		(_, found) => found.some((t) => t.type === 'codeText' && /\n[ \t]/.test(t.text))
	],
	[
		'micromark moves blank lines at the end of an unclosed fence inside a list item',
		(_, found) =>
			found.some((t) => t.type === 'listUnordered' || t.type === 'listOrdered') &&
			found.filter((t) => t.type === 'codeFencedFence').length <
				2 * found.filter((t) => t.type === 'codeFenced').length
	],
	[
		'micromark drops the line endings inside a fence that follows a line of a tight list item',
		(markdown, found) => {
			const lists = found.filter((t) => t.type === 'listUnordered' || t.type === 'listOrdered');
			return found.some(
				(t) =>
					t.type === 'codeFenced' &&
					lists.some((l) => l.start < t.start && t.start < l.end) &&
					/[^\n]\n[ \t]*$/.test(markdown.slice(0, t.start))
			);
		}
	],
	[
		'micromark takes no `!` in an email autolink (`<a!b@c>`), where commonmark.js does',
		(markdown) => /<[^\s<>@]*![^\s<>]*@/.test(markdown)
	],
	[
		'after an opening `---` that never closes, the frontmatter extension leaves the next lines a paragraph',
		(markdown) => /^---[ \t]*\n/.test(markdown)
	]
];

/** The reason the oracle can't judge `markdown`, if one of `APART` applies. */
export function apart(markdown: string, found = tokens(markdown)): string | null {
	return APART.find(([, test]) => test(markdown, found))?.[0] ?? null;
}
