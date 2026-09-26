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
 * - A fallback directive handler that writes `syntax.md`'s shape (a `<div>` for leaf and container
 *   directives, a `<span>` for text ones, the name as the first class, then the attributes).
 *   Without it micromark drops every directive.
 *
 * Raw HTML stays disallowed, as it is in markz. Examples that use it are excluded anyway.
 */
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import { directive, directiveHtml, type Handle } from 'micromark-extension-directive';

const shape: Handle = function (d) {
	const tag = d.type === 'textDirective' ? 'span' : 'div';
	const { class: classes, ...rest } = d.attributes ?? {};
	let open = `<${tag} class="${this.encode([d.name, classes].filter(Boolean).join(' '))}"`;
	for (const [key, value] of Object.entries(rest)) open += ` ${key}="${this.encode(value)}"`;
	this.tag(open + '>');
	this.raw((d.type === 'containerDirective' ? d.content : d.label) ?? '');
	this.tag(`</${tag}>`);
	return true;
};
/** @note A container directive's `[label]` is dropped until `syntax.md`'s pending decision on it
 * is made. */

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
