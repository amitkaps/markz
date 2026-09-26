/** @prose
 * The block pass on what the oracle can't check: markz's own block constructs (attributes,
 * directives, raw blocks, math, comments), the rejected forms and their diagnostics, and exact
 * source offsets. Every parsed document is also held to the tree invariants.
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

const messages = (source: string) => parsed(source).diagnostics.map((d) => d.message);

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

	it('merge across consecutive lines, classes accumulating', () => {
		expect(html('{.a key=1}\n{.b key=2}\n| x |\n| - |\n')).toContain('<table class="a b" key="2">');
	});

	it('are text inside a paragraph', () => {
		expect(html('para\n{.x}\n')).toBe('<p>para\n{.x}</p>\n');
	});

	it('stay text when they decorate nothing', () => {
		expect(html('> {.x}\n')).toBe('<blockquote>\n<p>{.x}</p>\n</blockquote>\n');
		expect(messages('{.x}\n')).toEqual(['block attributes with no block after them']);
	});

	it('are text when they do not parse', () => {
		expect(html('{a, b}\n')).toBe('<p>{a, b}</p>\n');
	});

	it('keep a verse paragraph’s line breaks', () => {
		expect(html('{.verse}\nMoko kahan\nMain to\n')).toBe(
			'<p class="verse">Moko kahan\nMain to</p>\n'
		);
	});

	it('drop event handlers and unsafe URLs', () => {
		expect(
			html('{onclick=x href="javascript:alert(1)" src="data:image/png;base64,AA" ok=1}\npara\n')
		).toBe('<p src="data:image/png;base64,AA" ok="1">para</p>\n');
	});
});

describe('directives', () => {
	it('write leaf and container shapes', () => {
		expect(html('::chart{data=sales type="bar"}\n')).toBe(
			'<div class="chart" data="sales" type="bar"></div>\n'
		);
		expect(html(':::callout[Warn \\*x]{.important}\nBody\n:::\n')).toBe(
			'<div class="callout important"><div class="directive-label">Warn *x</div>\n<p>Body</p>\n</div>\n'
		);
	});

	it('keep the container label as plain text', () => {
		const doc = parsed(':::box[a *b*]\n:::\n');
		const d = doc.data(first(doc, 'directive'), 'directive');
		expect(d).toMatchObject({ kind: 'container', name: 'box', label: { value: 'a *b*' } });
		expect(doc.firstChild(first(doc, 'directive'))).toBe(-1);
	});

	it('nest with a longer outer fence', () => {
		expect(outline(parsed('::::a\n:::b\nx\n:::\ny\n::::\n')).slice(1)).toEqual([
			'  directive "::::a\\n:::b\\nx\\n:::\\ny\\n::::"',
			'    directive ":::b\\nx\\n:::"',
			'      paragraph "x"',
			'        text "x"',
			'    paragraph "y"',
			'      text "y"'
		]);
	});

	it('close at the outermost directive the fence can close, as micromark does', () => {
		expect(html(':::a\n:::b\nx\n:::\ny\n')).toBe(
			'<div class="a"><div class="b"><p>x</p>\n</div>\n</div>\n<p>y</p>\n'
		);
	});

	it('are text when the line has more on it', () => {
		expect(html('::a[x]{.y} z\n')).toBe('<p>::a[x]{.y} z</p>\n');
		expect(messages('::a[x]{.y} z\n')).toEqual([]);
	});
});

describe('fences', () => {
	it('write ```=html verbatim and skip other formats', () => {
		expect(html('```=html\n<b>hi</b>\n```\n\n```=latex\n\\x\n```\n')).toBe('<b>hi</b>\n');
		const doc = parsed('```=latex\n\\x\n```\n');
		expect(doc.data(first(doc, 'raw'), 'raw')).toMatchObject({ format: 'latex', value: '\\x\n' });
	});

	it('read $$ as block math', () => {
		expect(html('$$\nx^2\n$$\n')).toBe(
			'<pre><code class="language-math math-display">x^2\n</code></pre>\n'
		);
	});

	it('run to the end of their container when unclosed', () => {
		expect(html('> ```\n> a\nb\n')).toBe(
			'<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<p>b</p>\n'
		);
	});
});

describe('comments', () => {
	it('write nothing, on one line or several', () => {
		expect(html('<!-- one -->\n\n<!-- two\nlines -->\npara\n')).toBe('<p>para</p>\n');
	});

	it('are text when they share a line with text', () => {
		expect(html('<!-- a --> b\n')).toBe('<p>&lt;!-- a --&gt; b</p>\n');
	});

	it('report text after a closing -->', () => {
		expect(messages('<!-- a\nb --> c\n')).toEqual(['text after `-->` is part of the comment']);
	});
});

describe('rejected forms stay text and report', () => {
	it.each([
		['Title\n===\n', '<p>Title\n===</p>', 'setext heading underline'],
		// Still text, and text gets smart punctuation.
		['Title\n---\n', '<p>Title\n—</p>', 'setext heading underline'],
		['    code\n', '<p>code</p>', 'indented code block'],
		['***\n', '<p>***</p>', '`***` rule'],
		['* * *\n', '<p>* * *</p>', '`***` rule'],
		['___\n', '<p>___</p>', '`___` rule'],
		['~~~\nx\n~~~\n', '<p>~~~\nx\n~~~</p>', '`~~~` fence'],
		['> a\nb\n', '<blockquote>\n<p>a</p>\n</blockquote>\n<p>b</p>', 'lazy continuation line'],
		['a  \nb\n', '<p>a\nb</p>', 'two trailing spaces as a line break']
	])('%j', (source, output, message) => {
		expect(html(source)).toBe(`${output}\n`);
		expect(messages(source)).toContain(message);
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
	it('take the paragraph’s last line as header, and pad short rows', () => {
		expect(html('intro\n| a | b |\n| :- | -: |\n| 1 |\n')).toBe(
			'<p>intro</p>\n<table>\n<thead>\n<tr>\n<th align="left">a</th>\n<th align="right">b</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td align="left">1</td>\n<td align="right"></td>\n</tr>\n</tbody>\n</table>\n'
		);
	});

	it('split on unescaped pipes only', () => {
		const doc = parsed('| a \\| b | c |\n| - | - |\n');
		const cells = [...doc.children(first(doc, 'tableRow'))];
		expect(cells.map((c) => doc.source.slice(doc.start(c), doc.end(c)))).toEqual(['a \\| b', 'c']);
	});
});
