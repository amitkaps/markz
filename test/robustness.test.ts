/** @prose
 * # Robustness
 *
 * Input no example chose, held to what must always be true of any document. Three generated
 * sources feed the same properties: noise drawn from Markdown's characters, known examples with
 * a few random edits, and documents written from the dialect's own grammar. Each must be sound
 * (`harness/sound.ts`). Where the grammar writes only CommonMark and GFM constructs, from plain
 * letters, markz must also match the oracle, unless it raised a Not supported warning: the side
 * rules often turn a generated document into a form the dialect cuts (a lazy line, `*` emphasis),
 * which markz reads differently on purpose and reports. The one rule that differs without a
 * warning is that emphasis runs never split, and a document that needs one is left out, as the
 * spec examples that need one differ.
 *
 * The upstream sweeps curation leaves off the Conformance page (`examples/upstream/stress/`) are
 * held to the same floor: markz finishes in well under a second, doesn't throw, and builds a
 * valid tree. A bare URL GFM would link, or a footnote it would read, must still be warned about,
 * since that is the signal a reader relies on. Adversarial input is `complexity.test.ts`'s.
 *
 * The search is `harness/generate.ts`'s: a fixed seed, and `SEARCH` and `SEED` to go further.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vite-plus/test';
import { html, parse } from '../src/index';
import { examples, unwarned } from './harness/examples';
import { readFences } from './harness/fences';
import { grammarDocument, mutated, noise, search } from './harness/generate';
import { normalize, reference, tokens, type Token } from './harness/oracle';
import { expectSound } from './harness/sound';
import { row } from './harness/syntax';
import { expectTree } from './harness/tree';

const settings = (({ runs, seed }) => ({ numRuns: runs, seed }))(search(300));
// A longer search needs longer than the default five seconds.
const timeout = Math.max(5000, settings.numRuns * 10);

describe('sound', () => {
	it('on noise', () => fc.assert(fc.property(noise, expectSound), settings), timeout);

	it(
		'on mutated examples',
		() => {
			const documents = examples.map((e) => e.markdown).filter((m) => m.length < 400);
			fc.assert(fc.property(mutated(documents), expectSound), settings);
		},
		timeout
	);

	it(
		'on documents from the grammar',
		() => {
			const alphabet = 'ab 1-*_`$:{}[]()<>!|\\&#."\'';
			fc.assert(fc.property(grammarDocument({ alphabet }), expectSound), settings);
		},
		timeout
	);
});

describe('the oracle', () => {
	it(
		'agrees on CommonMark and GFM documents from the grammar',
		() => {
			const shared = grammarDocument({ origins: ['CommonMark', 'GFM'], alphabet: 'ab ' });
			fc.assert(
				fc.property(shared, (markdown) => {
					// `\ ` is markz's non-breaking space, from djot, and a `\` before a line's trailing
					// spaces or tabs is a hard break, both of which the escape and line-break grammar list.
					fc.pre(!/\\[ \t]/.test(markdown));
					const doc = parse(markdown);
					// A cut form holds by its warning: markz reads it differently on purpose, and says so.
					if (doc.warnings.some((w) => row(w.code))) return;
					// micromark writes each line ending as it found it, so a CR ending one line and a LF
					// ending an empty next one become one CRLF on the page. Every line ending ends a line
					// the same way, so the oracle reads the document with LFs.
					const lf = markdown.replace(/\r\n?/g, '\n');
					const found = tokens(lf);
					if (APART.some(([, test]) => test(lf, found))) return;
					expect(normalize(html(doc))).toBe(normalize(reference(lf)));
				}),
				settings
			);
		},
		timeout
	);
});

/** @prose
 * ## Where they part by design or by the oracle
 *
 * Documents the comparison leaves out, each with its reason: one rule of the dialect, and the
 * places micromark parts from CommonMark's reference implementation, commonmark.js, which agrees
 * with markz.
 */
const SEQUENCES = new Set(['emphasisSequence', 'strongSequence', 'strikethroughSequence']);

const APART: [reason: string, test: (markdown: string, found: Token[]) => boolean][] = [
	[
		'emphasis runs never split (syntax.md: Emphasis), as the spec examples that need one differ',
		(markdown, found) =>
			found.some(
				(t) =>
					SEQUENCES.has(t.type) &&
					(markdown[t.start - 1] === t.text[0] || markdown[t.end] === t.text[0])
			)
	],
	[
		"micromark keeps a paragraph line's indentation inside a code span that crosses onto it",
		(_, found) => found.some((t) => t.type === 'codeText' && /\n[ \t]/.test(t.text))
	],
	[
		'micromark moves blank lines at the end of an unclosed fence inside a list item',
		(_, found) =>
			found.some((t) => t.type === 'listUnordered' || t.type === 'listOrdered') &&
			found.filter((t) => t.type === 'codeFencedFence').length <
				2 * found.filter((t) => t.type === 'codeFenced').length
	],
	[
		'micromark takes no `!` in an email autolink (`<a!b@c>`), where commonmark.js does',
		(markdown) => /<[^\s<>@]*![^\s<>]*@/.test(markdown)
	],
	[
		'after an opening `---` that never closes, the frontmatter extension leaves the next lines a paragraph',
		(markdown) => /^---[ \t]*\n/.test(markdown)
	]
];

const stress = Object.values(
	import.meta.glob<string>(['./examples/upstream/stress/*.md', '!**/README.md'], {
		query: '?raw',
		import: 'default',
		eager: true
	})
).map((text) => readFences(text));

describe.each(stress.map((f) => [f.meta['source'], f.examples] as const))(
	'stress %s',
	(suite, list) => {
		it.each(list.map((e) => [`${suite}:${e.number} ${e.section}`, e.markdown] as const))(
			'%s',
			(_, markdown) => {
				const start = performance.now();
				const doc = parse(markdown);
				expect(performance.now() - start).toBeLessThan(500);
				expectTree(doc);
				// GitHub links more than micromark in places, so only a missed URL or footnote fails.
				expect(unwarned('bare-url', markdown, doc, true)).toBe(null);
				expect(unwarned('footnote', markdown, doc, true)).toBe(null);
			}
		);
	}
);
