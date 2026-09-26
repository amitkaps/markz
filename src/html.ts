/** @prose
 * # HTML
 *
 * `html()` is a fold over the document into a string, the output prose and base consume (spec:
 * HTML output). It never touches the DOM, so it runs the same in Node, Workers and the browser.
 * The markup is micromark's for everything markz shares with GFM, so the oracle can compare them,
 * and syntax.md's shapes for the rest.
 *
 * It grows with the passes (`prose/plan.md`, steps 4–5). A node type it can't write yet is an
 * error rather than silent output, so the oracle harness reports it as a failure.
 */
import { type Attributes, type Document, type NodeId } from './ast';
import { parse } from './parse';

export function html(input: string | Document): string {
	const doc = typeof input === 'string' ? parse(input) : input;
	return render(doc, doc.root);
}

function children(doc: Document, node: NodeId): string {
	let out = '';
	for (const child of doc.children(node)) out += render(doc, child);
	return out;
}

/** @prose
 * ## Nodes
 *
 * One case per node type. A paragraph directly in an item of a tight list is written without its
 * `<p>`, as GFM does, and a task item's checkbox goes at the start of its first paragraph.
 * Comments and metadata write nothing, and a raw block writes its content only when its format is
 * `html`.
 */
function render(doc: Document, node: NodeId): string {
	const type = doc.type(node);
	const a = doc.attributes(node);
	switch (type) {
		case 'document':
			return children(doc, node);
		case 'metadata':
		case 'comment':
			return '';
		case 'paragraph': {
			const parent = doc.parent(node);
			let prefix = '';
			if (doc.type(parent) === 'listItem') {
				const { checked } = doc.data(parent, 'listItem');
				if (checked !== null && doc.firstChild(parent) === node) {
					prefix = `<input type="checkbox" disabled=""${checked ? ' checked=""' : ''} /> `;
				}
				if (doc.data(doc.parent(parent), 'list').tight) return prefix + children(doc, node);
			}
			return `<p${attributes(a)}>${prefix}${children(doc, node)}</p>\n`;
		}
		case 'heading': {
			const { depth, id } = doc.data(node, 'heading');
			const idAttribute = id ? ` id="${escape(id)}"` : '';
			return `<h${depth}${idAttribute}${attributes(a, [], true)}>${children(doc, node)}</h${depth}>\n`;
		}
		case 'text':
			return escape(doc.data(node, 'text').value);
		case 'blockquote':
			return `<blockquote${attributes(a)}>\n${children(doc, node)}</blockquote>\n`;
		case 'list': {
			const { ordered, start } = doc.data(node, 'list');
			const tag = ordered ? 'ol' : 'ul';
			const startAttribute = ordered && start !== 1 ? ` start="${start}"` : '';
			return `<${tag}${startAttribute}${attributes(a)}>\n${children(doc, node)}</${tag}>\n`;
		}
		case 'listItem':
			return `<li${attributes(a)}>${children(doc, node)}</li>\n`;
		case 'thematicBreak':
			return `<hr${attributes(a)} />\n`;
		case 'code': {
			const { lang, value } = doc.data(node, 'code');
			const cls = lang ? ` class="language-${escape(lang)}"` : '';
			return `<pre${attributes(a)}><code${cls}>${escape(value)}</code></pre>\n`;
		}
		case 'raw': {
			const { format, value } = doc.data(node, 'raw');
			return format === 'html' ? value : '';
		}
		case 'math': {
			const { block, value } = doc.data(node, 'math');
			return block
				? `<pre${attributes(a)}><code class="language-math math-display">${escape(value)}</code></pre>\n`
				: `<code class="language-math math-inline">${escape(value)}</code>`;
		}
		case 'table':
			return table(doc, node, a);
		case 'directive':
			return directive(doc, node, a);
		default:
			throw new Error(`html: no output for ${type} yet`);
	}
}

/** @prose
 * ## Tables
 *
 * The first row is the header. Body rows are padded with empty cells to the header's width, and
 * every cell carries its column's alignment.
 */
function table(doc: Document, node: NodeId, a: Attributes | undefined): string {
	const { align } = doc.data(node, 'table');
	const row = (r: NodeId, tag: 'th' | 'td') => {
		let out = '<tr>\n';
		let column = 0;
		for (const cell of doc.children(r)) {
			out += `<${tag}${alignment(align[column++])}>${children(doc, cell)}</${tag}>\n`;
		}
		for (; column < align.length; column++) out += `<${tag}${alignment(align[column])}></${tag}>\n`;
		return out + '</tr>\n';
	};
	const [head, ...body] = doc.children(node);
	let out = `<table${attributes(a)}>\n<thead>\n${row(head!, 'th')}</thead>\n`;
	if (body.length > 0) out += `<tbody>\n${body.map((r) => row(r, 'td')).join('')}</tbody>\n`;
	return out + '</table>\n';
}

const alignment = (align: string | null | undefined) => (align ? ` align="${align}"` : '');

/** @prose
 * ## Directives
 *
 * A `<div>` for leaf and container directives and a `<span>` for text ones, with the name as the
 * first class. The six element names (`sup`, `sub`, `ins`, `mark`, `kbd`, `abbr`) are written as
 * that element when used as text directives. A container's label comes first, in its own
 * `directive-label` div.
 */
const ELEMENTS = new Set(['sup', 'sub', 'ins', 'mark', 'kbd', 'abbr']);

function directive(doc: Document, node: NodeId, a: Attributes | undefined): string {
	const { kind, name, label } = doc.data(node, 'directive');
	const element = kind === 'text' && ELEMENTS.has(name);
	const tag = element ? name : kind === 'text' ? 'span' : 'div';
	let out = `<${tag}${attributes(a, element ? [] : [name])}>`;
	if (kind === 'container' && label) {
		out += `<div class="directive-label">${escape(label.value)}</div>\n`;
	}
	return out + children(doc, node) + `</${tag}>` + (kind === 'text' ? '' : '\n');
}

/** @prose
 * ## Attributes
 *
 * Classes accumulate, and for any other key the later value wins, in the order keys first
 * appear. `class` is written first. Event handlers (`on*`) are dropped, and so is any value with
 * an unsafe scheme: `javascript:`, `vbscript:`, and `data:` other than a raster image (spec:
 * Security). A heading's id comes from its data, so an `id` item is skipped there.
 */
function attributes(a: Attributes | undefined, classes: string[] = [], skipId = false): string {
	const cls = [...classes];
	const other = new Map<string, string>();
	for (const { key, value } of a?.items ?? []) {
		if (key === 'class') cls.push(value);
		else if (!(skipId && key === 'id')) other.set(key, value);
	}
	let out = cls.length > 0 ? ` class="${escape(cls.join(' '))}"` : '';
	for (const [key, value] of other) {
		if (/^on/i.test(key) || unsafe(value)) continue;
		out += ` ${key}="${escape(value)}"`;
	}
	return out;
}

function unsafe(value: string): boolean {
	// Browsers ignore whitespace and control characters inside a scheme.
	// eslint-disable-next-line no-control-regex
	const v = value.replace(/[\u0000- ]/g, '').toLowerCase();
	return (
		/^(?:javascript|vbscript):/.test(v) ||
		(v.startsWith('data:') && !/^data:image\/(?:png|gif|jpe?g|webp|avif|bmp)[;,]/.test(v))
	);
}

function escape(text: string): string {
	return text.replace(/[&<>"]/g, (c) => ESCAPES[c]!);
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
