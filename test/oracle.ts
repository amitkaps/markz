/** @prose
 * # Oracle
 *
 * The reference markz's `html()` is held to: micromark with GFM and directives, which are
 * well-tested and dev-only (spec: Testing). Two settings make it render what markz should, not
 * what micromark's own policy would:
 *
 * - `allowDangerousProtocol`: micromark blanks any URL outside its scheme allowlist, and markz
 *   instead drops a short blocklist (spec: Security). markz's own tests cover the blocklist, so
 *   the oracle writes every URL.
 * - A fallback directive handler that writes `syntax.md`'s shape: a `<div>` for leaf and container
 *   directives and a `<span>` for text ones, the name as the first class, then the attributes. A
 *   container's label comes first, in a `directive-label` div. Without the handler micromark drops
 *   every directive.
 * - The same handler writes a bare text directive (`:name` with no label or attributes) back out
 *   as the text it was, since markz requires one or the other. micromark reports `:name{}` the same
 *   way, so an empty `{}` is the one input this can't tell apart.
 *
 * Raw HTML stays disallowed, as it is in markz. Examples that use it are excluded anyway.
 */
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import { directive, directiveHtml, type Handle } from 'micromark-extension-directive';

const shape: Handle = function (d) {
	const attributes = Object.entries(d.attributes ?? {});
	if (d.type === 'textDirective' && d.label === undefined && attributes.length === 0) {
		this.raw(this.encode(`:${d.name}`));
		return true;
	}
	const tag = d.type === 'textDirective' ? 'span' : 'div';
	const classes = [d.name, d.attributes?.class].filter(Boolean).join(' ');
	let open = `<${tag} class="${this.encode(classes)}"`;
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

export function reference(markdown: string): string {
	return micromark(markdown, {
		extensions: [gfm(), directive()],
		htmlExtensions: [gfmHtml(), directiveHtml({ '*': shape })],
		allowDangerousProtocol: true
	});
}

/** @prose
 * ## Normalization
 *
 * What counts as the same output. Whitespace runs outside `<pre>` collapse to one space, and a
 * space next to a block-level tag goes, so line layout never fails a test. A space between inline
 * tags (`<em>a</em> <em>b</em>`) is content and stays. Smart punctuation goes back to straight
 * characters, since micromark doesn't do it and markz always does. `<pre>` content is compared
 * exactly.
 */
const SMART: Record<string, string> = {
	'‘': "'",
	'’': "'",
	'“': '"',
	'”': '"',
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
		.replace(/[‘’“”–—…]/g, (c) => SMART[c]!)
		.trim();
}
