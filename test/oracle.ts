/** @prose
 * # Oracle
 *
 * The reference markz's `html()` is held to: micromark with GFM, directives and YAML frontmatter,
 * which are well-tested and dev-only (spec: Testing). Frontmatter writes nothing, as metadata
 * doesn't in `html()`, so every example checks that markz finds the same block. Two settings make it render what markz should, not
 * what micromark's own policy would:
 *
 * - `allowDangerousProtocol`: micromark blanks any URL outside its scheme allowlist, and markz
 *   instead drops a short blocklist (spec: Security). markz's own tests cover the blocklist, so
 *   the oracle writes every URL.
 * - A fallback directive handler that writes `syntax.md`'s shape: a `<div>` for leaf and container
 *   directives and a `<span>` for text ones, the name as the first class, then the attributes. A
 *   container's label comes first, in a `directive-label` div. Without the handler micromark drops
 *   every directive.
 * - Text directives named `sup`, `sub`, `ins`, `mark`, `kbd` or `abbr` are written as that element,
 *   with no name class.
 * - The same handler writes a bare text directive (`:name` with no label or attributes) back out
 *   as the text it was, since markz requires one or the other. micromark reports `:name{}` the same
 *   way, so an empty `{}` is the one input this can't tell apart.
 *
 * Raw HTML stays disallowed, as it is in markz. Examples that use it are excluded anyway.
 */
import { micromark, parse, postprocess, preprocess } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import { directive, directiveHtml, type Handle } from 'micromark-extension-directive';
import { frontmatter, frontmatterHtml } from 'micromark-extension-frontmatter';
import GithubSlugger from 'github-slugger';
import YAML from 'yaml';

const ELEMENTS = new Set(['sup', 'sub', 'ins', 'mark', 'kbd', 'abbr']);

const shape: Handle = function (d) {
	const attributes = Object.entries(d.attributes ?? {});
	if (d.type === 'textDirective' && d.label === undefined && attributes.length === 0) {
		this.raw(this.encode(`:${d.name}`));
		return true;
	}
	const element = d.type === 'textDirective' && ELEMENTS.has(d.name);
	const tag = element ? d.name : d.type === 'textDirective' ? 'span' : 'div';
	const classes = [element ? '' : d.name, d.attributes?.class].filter(Boolean).join(' ');
	let open = `<${tag}` + (classes ? ` class="${this.encode(classes)}"` : '');
	for (const [key, value] of attributes) {
		if (key !== 'class') open += ` ${key}="${this.encode(value)}"`;
	}
	this.tag(open + '>');
	if (d.type === 'containerDirective') {
		if (d.label) this.tag(`<div class="directive-label">${d.label}</div>`);
		this.raw(d.content ?? '');
	} else this.raw(d.label ?? '');
	this.tag(`</${tag}>`);
	return true;
};

const extensions = [gfm(), directive(), frontmatter()];

export function reference(markdown: string): string {
	return micromark(markdown, {
		extensions,
		htmlExtensions: [gfmHtml(), directiveHtml({ '*': shape }), frontmatterHtml()],
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
 * `&quot;`, as micromark escapes it. Heading ids go too, since
 * micromark writes none; markz's are tested on their own. `<pre>` content is compared exactly.
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
	/ ?(<\/?(?:p|li|ul|ol|blockquote|h[1-6]|pre|table|thead|tbody|tr|th|td|hr|div|section)\b[^>]*>) ?/g;

export function normalize(html: string): string {
	return html
		.split(/(<pre[\s>][\s\S]*?<\/pre>)/)
		.map((part, i) => (i % 2 === 1 ? part : part.replace(/\s+/g, ' ').replace(BLOCK_TAG, '$1')))
		.join('')
		.replace(/(<h[1-6])((?: [\w-]+="[^"]*")*?) id="[^"]*"/g, '$1$2')
		.replace(/[‘’“”–—…]/g, (c) => SMART[c]!)
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
