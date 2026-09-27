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
 * - A fallback directive handler that writes `syntax.md`'s shape: the name as the element, then
 *   the attributes, class first. A container's label goes in `<summary>` for `details`, in
 *   `<figcaption>` for `figure`, in a `directive-label` div for a custom element, and nowhere for
 *   any other block. Without the handler micromark drops every directive. It writes any name
 *   micromark accepts; the examples whose names markz rejects are filed under `directive-name`
 *   and not compared.
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
import { math } from 'micromark-extension-math';
import GithubSlugger from 'github-slugger';
import YAML from 'yaml';
import { custom } from '../src/elements';

const LABEL: Record<string, string> = { details: 'summary', figure: 'figcaption' };

const shape: Handle = function (d) {
	const attributes = Object.entries(d.attributes ?? {});
	if (d.type === 'textDirective' && d.label === undefined && attributes.length === 0) {
		this.raw(this.encode(`:${d.name}`));
		return true;
	}
	let open =
		`<${d.name}` + (d.attributes?.class ? ` class="${this.encode(d.attributes.class)}"` : '');
	for (const [key, value] of attributes) {
		if (key !== 'class') open += ` ${key}="${this.encode(value)}"`;
	}
	this.tag(open + '>');
	if (d.type === 'containerDirective') {
		const inner = LABEL[d.name];
		if (d.label && inner) this.tag(`<${inner}>${d.label}</${inner}>`);
		else if (d.label && custom(d.name)) this.tag(`<div class="directive-label">${d.label}</div>`);
		this.raw(d.content ?? '');
	} else this.raw(d.label ?? '');
	this.tag(`</${d.name}>`);
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
