/** @prose
 * The inline pass on what the oracle can't check: markz's own inline constructs (math,
 * expressions, text directives, attributes on links and images, smart punctuation, `\ `), the
 * `*` rule, the rejected forms and their diagnostics, heading ids, and exact offsets. Every parsed
 * document is also held to the tree invariants.
 */
import { describe, expect, it } from 'vite-plus/test';
import { html, parse, type Document, type NodeId, type NodeType } from './index';
import { expectTree } from '../test/tree';

function parsed(source: string): Document {
	const doc = parse(source);
	expectTree(doc);
	return doc;
}

/** The inline HTML of a one-paragraph document. */
const inline = (source: string) => html(parsed(source)).replace(/^<p>|<\/p>\n$/g, '');
const messages = (source: string) => parsed(source).diagnostics.map((d) => d.message);

function first(doc: Document, type: NodeType): NodeId {
	for (let n = 0; n < doc.size; n++) if (doc.type(n) === type) return n;
	throw new Error(`no ${type}`);
}

const text = (doc: Document, node: NodeId) => doc.source.slice(doc.start(node), doc.end(node));

describe('math', () => {
	it('reads $…$ by pandoc’s rule', () => {
		expect(inline('$x^2$ and $a$')).toBe(
			'<code class="language-math math-inline">x^2</code> and <code class="language-math math-inline">a</code>'
		);
	});

	it('leaves currency alone', () => {
		expect(inline('costs $5 and $10')).toBe('costs $5 and $10');
		expect(inline('$ x$ and $x $')).toBe('$ x$ and $x $');
	});

	it('keeps the raw TeX and its range', () => {
		const doc = parsed('a $\\frac{1}{2}$');
		const math = first(doc, 'math');
		expect(doc.data(math, 'math')).toMatchObject({ block: false, value: '\\frac{1}{2}' });
		expect(text(doc, math)).toBe('$\\frac{1}{2}$');
	});
});

describe('expressions', () => {
	it('bind tighter than emphasis and keep their code', () => {
		const doc = parsed('_a ${x * y * z} b_');
		const node = first(doc, 'expression');
		expect(doc.data(node, 'expression').code).toBe('x * y * z');
		expect(html(doc)).toBe('<p><em>a ${x * y * z} b</em></p>\n');
	});

	it('skip braces in strings, templates and comments', () => {
		const doc = parsed('${f("}", `${"}"}`, /* } */ {a: 1})} after');
		expect(doc.data(first(doc, 'expression'), 'expression').code).toBe(
			'f("}", `${"}"}`, /* } */ {a: 1})'
		);
	});

	it('are text when unclosed or escaped, and inert in code', () => {
		expect(parsed('${a').size).toBe(3);
		expect(inline('\\${a}')).toBe('${a}');
		expect(inline('`${a}`')).toBe('<code>${a}</code>');
	});

	it('sit in link destinations', () => {
		const doc = parsed('[x](/u/${id}/edit)');
		const link = doc.data(first(doc, 'link'), 'link');
		expect(link.destination).toBe('/u/${id}/edit');
		expect(link.expressions.map((r) => doc.source.slice(r.start, r.end))).toEqual(['${id}']);
	});
});

describe('text directives', () => {
	it('need a label or attributes', () => {
		expect(inline('at 10:30 and hello :world')).toBe('at 10:30 and hello :world');
		expect(inline(':span[x]{.y}')).toBe('<span class="span y">x</span>');
		expect(inline(':badge{n=3}')).toBe('<span class="badge" n="3"></span>');
	});

	it('write the six element names as their element, mid-word too', () => {
		expect(inline('H:sub[2]O and x:sup[2]')).toBe('H<sub>2</sub>O and x<sup>2</sup>');
		expect(inline(':abbr[HTML]{title="HyperText"}')).toBe('<abbr title="HyperText">HTML</abbr>');
	});

	it('parse the label as inline content', () => {
		expect(inline(':note[a _b_]')).toBe('<span class="note">a <em>b</em></span>');
	});

	it('never start with a digit, so ports stay text', () => {
		expect(inline('[http://localhost:8000](http://localhost:8000)')).toBe(
			'<a href="http://localhost:8000">http://localhost:8000</a>'
		);
	});
});

describe('links and images', () => {
	it('take attributes directly after the )', () => {
		expect(inline('[docs](/docs){target=_blank}')).toBe('<a href="/docs" target="_blank">docs</a>');
		expect(inline('![hero](h.png){.wide width=600}')).toBe(
			'<img src="h.png" alt="hero" class="wide" width="600" />'
		);
		expect(inline('[docs](/docs) {.x}')).toBe('<a href="/docs">docs</a> {.x}');
	});

	it('write an empty URL for an unsafe scheme', () => {
		expect(inline('[x](javascript:alert(1))')).toBe('<a href="">x</a>');
		expect(inline('![x](data:image/png;base64,AA)')).toBe(
			'<img src="data:image/png;base64,AA" alt="x" />'
		);
	});

	it('report reference links and definitions', () => {
		expect(messages('[x][y] and [z][]')).toEqual(['reference link', 'reference link']);
		expect(messages('[y]: /url')).toEqual(['reference definition']);
		expect(messages('[sic]')).toEqual([]);
	});
});

describe('emphasis', () => {
	it('uses _ and ** everywhere', () => {
		expect(inline('_a_ **b** ~~c~~')).toBe('<em>a</em> <strong>b</strong> <del>c</del>');
	});

	it('keeps * inside _…_ and mid-word, as formatters write it', () => {
		expect(inline('_foo *bar* baz_')).toBe('<em>foo <em>bar</em> baz</em>');
		expect(inline('a*b*c')).toBe('a<em>b</em>c');
		expect(messages('_foo *bar* baz_ a*b*c')).toEqual([]);
	});

	it('reports *a*, __a__ and ~a~ and keeps them as text', () => {
		expect(inline('*a* __b__ ~c~')).toBe('*a* __b__ ~c~');
		expect(messages('*a* __b__ ~c~')).toEqual([
			'`*emphasis*`',
			'`__strong__`',
			'`~single~` strikethrough'
		]);
	});

	it('never opens _ inside a word', () => {
		expect(inline('snake_case_name')).toBe('snake_case_name');
	});
});

describe('text', () => {
	it('curls quotes and joins dashes and dots', () => {
		expect(inline('"Hi," she said -- it\'s 1990--2000... --- done')).toBe(
			'“Hi,” she said – it’s 1990–2000… — done'
		);
	});

	it('keeps escaped punctuation straight', () => {
		expect(inline('\\"a\\" \\-\\-')).toBe('&quot;a&quot; --');
	});

	it('reads \\ before a space as a non-breaking space', () => {
		const doc = parsed('10\\ km');
		expect(doc.data(first(doc, 'text'), 'text').value).toBe('10 km');
	});

	it('decodes numeric references and reports named ones', () => {
		expect(inline('&#169; &#x2014; &#0;')).toBe('© — �');
		expect(inline('&copy;')).toBe('&amp;copy;');
		expect(messages('&copy;')).toEqual(['named character reference `&copy;`']);
	});

	it('keeps raw HTML as one piece of text, and reports it', () => {
		expect(inline('<span title="_x_">y</span>')).toBe(
			'&lt;span title=&quot;_x_&quot;&gt;y&lt;/span&gt;'
		);
		expect(messages('a <b>c</b>')).toEqual(['raw HTML', 'raw HTML']);
	});

	it('maps every text node back to the characters typed', () => {
		const doc = parsed('> a &#169; \\*b\\*\n> "c"');
		const nodes = [...Array(doc.size).keys()].filter((n) => doc.type(n) === 'text');
		expect(nodes.map((n) => [text(doc, n), doc.data(n, 'text').value])).toEqual([
			['a &#169; \\*b\\*\n', 'a © *b*\n'],
			['"c"', '“c”']
		]);
	});
});

describe('heading ids', () => {
	const ids = (source: string) => {
		const doc = parsed(source);
		return [...doc.children(doc.root)]
			.filter((n) => doc.type(n) === 'heading')
			.map((n) => doc.data(n, 'heading').id);
	};

	it('follow the golden table', () => {
		expect(
			ids(
				[
					'## Foo',
					'## Foo',
					'## Foo 1',
					'## Café au lait',
					'## शुरुआत करें',
					'## 日本語の見出し',
					'## 1. Rename',
					'## See [docs](https://example.com)',
					'## ???'
				].join('\n\n')
			)
		).toEqual([
			'foo',
			'foo-1',
			'foo-1-1',
			'café-au-lait',
			'शुरुआत-करें',
			'日本語の見出し',
			'1-rename',
			'see-docs',
			'section'
		]);
	});

	it('number past a heading whose own text looks like a suffix', () => {
		expect(ids('# foo-1\n\n# foo\n\n# foo')).toEqual(['foo-1', 'foo', 'foo-2']);
	});

	it('slug apostrophes the same straight or curled', () => {
		expect(ids("## Don't\n\n## Don’t")).toEqual(['dont', 'dont-1']);
	});

	it('take an explicit id as written, and report one already used', () => {
		expect(ids('{#top}\n# A\n\n# Pricing\n\n{#pricing}\n# B')).toEqual([
			'top',
			'pricing',
			'pricing'
		]);
		expect(messages('# Pricing\n\n{#pricing}\n# B')).toEqual([
			'id `pricing` is already used by an earlier heading'
		]);
	});

	it('are written into the HTML', () => {
		expect(html('## Hello _world_')).toBe('<h2 id="hello-world">Hello <em>world</em></h2>\n');
	});
});
