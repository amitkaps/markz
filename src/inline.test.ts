/** @prose
 * The inline pass on what an example's HTML can't show: node data (math and expression values,
 * link expressions, text values), exact ranges, and heading ids. What the inline constructs write
 * is in `test/dialect/inline.md`. Every parsed document is also held to the tree invariants.
 */
import { describe, expect, it } from 'vite-plus/test';
import { html, parse, type Document, type NodeId, type NodeType } from './index';
import { expectTree } from '../test/tree';

function parsed(source: string): Document {
	const doc = parse(source);
	expectTree(doc);
	return doc;
}

const messages = (source: string) => parsed(source).warnings.map((d) => d.message);

function first(doc: Document, type: NodeType): NodeId {
	for (let n = 0; n < doc.size; n++) if (doc.type(n) === type) return n;
	throw new Error(`no ${type}`);
}

const text = (doc: Document, node: NodeId) => doc.source.slice(doc.start(node), doc.end(node));

describe('math', () => {
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

	it('sit in link destinations', () => {
		const doc = parsed('[x](/u/${id}/edit)');
		const link = doc.data(first(doc, 'link'), 'link');
		expect(link.destination).toBe('/u/${id}/edit');
		expect(link.expressions.map((r) => doc.source.slice(r.start, r.end))).toEqual(['${id}']);
	});
});

describe('text', () => {
	it('reads \\ before a space as a non-breaking space', () => {
		const doc = parsed('10\\ km');
		expect(doc.data(first(doc, 'text'), 'text').value).toBe('10 km');
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
});
