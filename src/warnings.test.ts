/** @prose
 * # Warnings
 *
 * Holds the parser to syntax.md's "Not supported" table, row by row: every form listed there stays
 * text, is reported over exactly the characters that make it up, and its `instead` is the
 * table's "Write instead" cell, word for word. The table is read from syntax.md, so a row added
 * without a case here, or a message that drifts from the table, fails.
 *
 * The other half is quiet input: the supported forms beside each rejected one, and prose that
 * only looks like a rejected form (`[sic]`, braces, times, `a@b`), must produce no warning.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vite-plus/test';
import { parse, type Document } from './index';
import { expectTree } from '../test/tree';

const syntax = readFileSync(new URL('../prose/syntax.md', import.meta.url), 'utf8');
const section = syntax.slice(
	syntax.indexOf('\n## Not supported'),
	syntax.indexOf('\n## Canonical')
);
/** The table's rows as [Syntax, Write instead], from its body lines. */
const rows = section
	.split('\n')
	.filter((l) => l.startsWith('| ') && !l.startsWith('| Syntax') && !l.startsWith('| ---'))
	.map((l) => l.split(/ +\| +/).map((c) => c.replace(/^\| /, '')) as [string, string]);

/** Each row, by the start of its Syntax cell: inputs and the slices each one reports. */
const cases: Record<string, [input: string, reported: string[]][]> = {
	'Raw HTML': [
		['<div>\nhi\n</div>', ['<div>', '</div>']],
		['a <b>c</b> and <!-- x -->', ['<b>', '</b>', '<!-- x -->']],
		['</about>', ['</about>']]
	],
	'Setext headings': [
		['Title\n===', ['===']],
		['Title\n---', ['---']]
	],
	'Indented code': [
		['    code', ['code']],
		['para\n\n    more', ['more']]
	],
	'`~~~` fences': [['~~~\nx\n~~~', ['~~~', '~~~']]],
	'Reference links': [
		['[x][y] and [z][]', ['[x][y]', '[z][]']],
		['[y]: /url', ['[y]:']]
	],
	'Bare URLs': [
		['see https://a.com/x_(y). ok', ['https://a.com/x_(y)']],
		['or www.a.com, and http://b.io', ['www.a.com', 'http://b.io']],
		['mail me@example.com.', ['me@example.com']],
		['_at https://a.com_', ['https://a.com']]
	],
	'Relative autolinks': [['go </docs/intro>', ['</docs/intro>']]],
	'Named character': [['&copy; &amp; &nbsp;', ['&copy;', '&amp;', '&nbsp;']]],
	'Two trailing spaces': [['a  \nb', ['  ']]],
	'`__strong__`': [['__b__', ['__b__']]],
	'`*emphasis*`': [['*a* and *b*', ['*a*', '*b*']]],
	'`***`': [
		['***', ['***']],
		['___', ['___']],
		['* * *', ['* * *']]
	],
	'`~single~`': [['~a~', ['~a~']]],
	'Trailing heading attributes': [['## Title {#id}', ['{#id}']]],
	'Multi-line attributes': [['{.a\n.b}\n# x', ['{.a\n.b}']]],
	'Attributes after': [
		['word{.x}', ['{.x}']],
		['`c`{.x} _e_{#y}', ['{.x}', '{#y}']],
		['[text]{.x}', ['{.x}']]
	],
	MDX: [['<Chart data="x" /> and </Chart>', ['<Chart data="x" />', '</Chart>']]],
	Footnotes: [
		['a claim[^1].', ['[^1]']],
		['[^1]: the note', ['[^1]:']]
	],
	'TOML metadata': [['+++\ntitle = "x"\n+++\n# t', ['+++\ntitle = "x"\n+++']]],
	'Lazy continuation': [
		['> a\nb', ['b']],
		['- a\nb', ['b']]
	]
};

/** Supported forms, and prose that looks like a rejected one. */
const quiet = [
	'[sic] and [x] and [^]',
	'a {b} f{x} {x} and ${x}',
	'at 10:30, x.y, a@b and a.b@c',
	'[https://a.com](https://a.com) and ![www.a.com](a.png)',
	'<https://a.com> <me@example.com>',
	'[docs](/docs){.x} ![a](b.png){.w} :span[x]{.y}',
	'_foo *bar* baz_ a*b*c **b** ~~d~~',
	'a\\\nb',
	'```\n<div>&copy;</div>\n    code\n```',
	'`https://a.com` and `<b>`',
	'---\ntitle: x\n---\n\n{#top}\n# A #',
	'> a\n> b\n\n- a\n  b'
];

function parsed(source: string): Document {
	const doc = parse(source);
	expectTree(doc);
	return doc;
}

describe('syntax.md: Not supported', () => {
	it('has a case for every row, and a row for every case', () => {
		const keys = Object.keys(cases);
		for (const [syntax] of rows) {
			expect(
				keys.filter((k) => syntax.startsWith(k)),
				syntax
			).toHaveLength(1);
		}
		for (const key of keys) {
			expect(
				rows.filter(([syntax]) => syntax.startsWith(key)),
				key
			).toHaveLength(1);
		}
	});

	describe.each(rows)('%s', (syntax, instead) => {
		const key = Object.keys(cases).find((k) => syntax.startsWith(k));
		it.each(key ? cases[key]! : [])('%j', (input, reported) => {
			const doc = parsed(input);
			expect(doc.warnings.map((d) => input.slice(d.start, d.end))).toEqual(reported);
			for (const d of doc.warnings) {
				expect(d.instead).toBe(instead);
				// Stays text: nothing but text, or a paragraph holding it, starts inside the range.
				for (let n = 1; n < doc.size; n++) {
					if (doc.start(n) >= d.start && doc.start(n) < d.end) {
						expect(['text', 'paragraph']).toContain(doc.type(n));
					}
				}
			}
		});
	});
});

describe('quiet input', () => {
	it.each(quiet)('%j reports nothing', (input) => {
		expect(parsed(input).warnings).toEqual([]);
	});
});

describe('warnings', () => {
	it('come in source order', () => {
		const doc = parsed('> *a* b\nlazy\n\n~~~');
		expect(doc.warnings.map((d) => d.message)).toEqual([
			'`*emphasis*`',
			'lazy continuation line',
			'`~~~` fence'
		]);
	});
});
