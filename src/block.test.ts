/** @prose
 * The block pass on what an example's HTML can't show: exact source ranges, node data (heading
 * ids, code bodies, directive labels, list tightness, table cells) and the order of warnings.
 * What the block constructs write is in `test/dialect/block.md`. Every parsed document is also
 * held to the tree invariants.
 */
import { describe, expect, it } from 'vite-plus/test';
import { html, parse, type Document, type NodeId, type NodeType } from './index';
import { expectTree } from '../test/tree';

/** The tree as `type "source"` lines, indented by depth. */
function outline(doc: Document, node: NodeId = doc.root, depth = 0): string[] {
	const text = doc.source.slice(doc.start(node), doc.end(node));
	const lines = [`${'  '.repeat(depth)}${doc.type(node)} ${JSON.stringify(text)}`];
	for (const child of doc.children(node)) lines.push(...outline(doc, child, depth + 1));
	return lines;
}

function parsed(source: string): Document {
	const doc = parse(source);
	expectTree(doc);
	return doc;
}

const first = (doc: Document, type: NodeType): NodeId => {
	for (let n = 0; n < doc.size; n++) if (doc.type(n) === type) return n;
	throw new Error(`no ${type}`);
};

const messages = (source: string) => parsed(source).warnings.map((d) => d.message);

describe('ranges', () => {
	it('cover markers, and a block never its line ending', () => {
		expect(outline(parsed('# Title #\n\n> quote\n> more\n\n- a\n\n  b\n'))).toEqual([
			'document "# Title #\\n\\n> quote\\n> more\\n\\n- a\\n\\n  b\\n"',
			'  heading "# Title #"',
			'    text "Title"',
			'  blockquote "> quote\\n> more"',
			'    paragraph "quote\\n> more"',
			// A soft break's text covers the line ending, and never the next line's `> `.
			'      text "quote\\n"',
			'      text "more"',
			'  list "- a\\n\\n  b"',
			'    listItem "- a\\n\\n  b"',
			'      paragraph "a"',
			'        text "a"',
			'      paragraph "b"',
			'        text "b"'
		]);
	});

	it('handle CRLF and a lone CR', () => {
		const doc = parsed('# A\r\n\r\npara\rline\r\n');
		expect(outline(doc).slice(1)).toEqual([
			'  heading "# A"',
			'    text "A"',
			'  paragraph "para\\rline"',
			// One text node: the lines touch in the source, and the lone CR reads as `\n`.
			'    text "para\\rline"'
		]);
		expect(doc.data(first(doc, 'text') + 2, 'text').value).toBe('para\nline');
	});

	it('give a code block its body range and a stripped value', () => {
		const source = '> ```js meta\n> a\n>\tb\n> ```\n';
		const doc = parsed(source);
		const code = first(doc, 'code');
		const data = doc.data(code, 'code');
		expect(data).toMatchObject({ lang: 'js', meta: 'meta', value: 'a\n  b\n' });
		expect(source.slice(data.body.start, data.body.end)).toBe('a\n>\tb');
		expect(source.slice(doc.start(code), doc.end(code))).toBe('```js meta\n> a\n>\tb\n> ```');
	});
});

describe('attributes', () => {
	it('decorate the next block, across blank lines', () => {
		const doc = parsed('{#pricing .center}\n\n## Pricing\n');
		const heading = first(doc, 'heading');
		expect(doc.data(heading, 'heading')).toEqual({ depth: 2, id: 'pricing', idExplicit: true });
		expect(html(doc)).toBe('<h2 id="pricing" class="center">Pricing</h2>\n');
	});
});

describe('directives', () => {
	it('keep the container label as plain text', () => {
		const doc = parsed(':::info-box[a *b*]\n:::\n');
		const d = doc.data(first(doc, 'directive'), 'directive');
		expect(d).toMatchObject({ kind: 'container', name: 'info-box', label: { value: 'a *b*' } });
		expect(doc.firstChild(first(doc, 'directive'))).toBe(-1);
	});

	it('nest with a longer outer fence', () => {
		expect(outline(parsed('::::div\n:::aside\nx\n:::\ny\n::::\n')).slice(1)).toEqual([
			'  directive "::::div\\n:::aside\\nx\\n:::\\ny\\n::::"',
			'    directive ":::aside\\nx\\n:::"',
			'      paragraph "x"',
			'        text "x"',
			'    paragraph "y"',
			'      text "y"'
		]);
	});

	it('keep the label in the AST where html() has no place for it', () => {
		const doc = parsed(':::section[Intro]\nx\n:::\n');
		expect(doc.data(first(doc, 'directive'), 'directive').label?.value).toBe('Intro');
		expect(doc.warnings.map((w) => w.code)).toEqual(['directive-label']);
		expect(html(doc)).toBe('<section><p>x</p>\n</section>\n');
	});
});

describe('fences', () => {
	it('write ```=html verbatim and skip other formats', () => {
		expect(html('```=html\n<b>hi</b>\n```\n\n```=latex\n\\x\n```\n')).toBe('<b>hi</b>\n');
		const doc = parsed('```=latex\n\\x\n```\n');
		expect(doc.data(first(doc, 'raw'), 'raw')).toMatchObject({ format: 'latex', value: '\\x\n' });
	});
});

describe('lists', () => {
	it('mark task items and keep the marker out of the paragraph', () => {
		const doc = parsed('- [x] done\n- [ ] todo\n- [ ]\n');
		const items = [...doc.children(first(doc, 'list'))];
		expect(items.map((i) => doc.data(i, 'listItem').checked)).toEqual([true, false, null]);
		expect(
			doc.source.slice(doc.start(first(doc, 'paragraph')), doc.end(first(doc, 'paragraph')))
		).toBe('done');
	});

	it('are loose with a blank line between items, and not after the last', () => {
		const tight = (source: string) => parsed(source).data(1, 'list').tight;
		expect(tight('- a\n- b\n\n')).toBe(true);
		expect(tight('- a\n\n- b\n')).toBe(false);
		expect(tight('- a\n\n  b\n')).toBe(false);
		expect(tight('- a\n  > b\n  >\n- c\n')).toBe(true);
	});
});

describe('tables', () => {
	it('split on unescaped pipes only', () => {
		const doc = parsed('| a \\| b | c |\n| - | - |\n');
		const cells = [...doc.children(first(doc, 'tableRow'))];
		expect(cells.map((c) => doc.source.slice(doc.start(c), doc.end(c)))).toEqual(['a \\| b', 'c']);
	});
});

describe('warnings', () => {
	it('come in source order', () => {
		// The paragraph's `*a*` is found when it closes, after the lazy line that closes it.
		expect(messages('> *a* b\nlazy\n\n~~~')).toEqual([
			'`*emphasis*`',
			'lazy continuation line',
			'`~~~` fence'
		]);
	});
});
