/** @prose
 * # Spec examples
 *
 * The CommonMark and GFM spec examples markz is compared on, and the checked list of the ones it
 * isn't. An example is excluded because it uses syntax the dialect cuts or changes, and its reason
 * names that place in `syntax.md`: a row of the "Not supported" table (by the start of its first
 * cell) or a heading under "Supported, with limits". The oracle test checks that every reason
 * resolves, so the list can't drift from the dialect.
 *
 * Most exclusions aren't listed by hand. The oracle's tokens show which examples use a construct
 * the dialect cuts (`cut`), and those carry that construct's row. The hand lists cover what tokens
 * can't show: whole sections, and dialect rules such as lazy lines that have no token of their own.
 */
import { tokens, type Token } from './oracle';
import commonmark from './spec/commonmark.json' with { type: 'json' };
import gfm from './spec/gfm.json' with { type: 'json' };

export type Suite = 'commonmark' | 'gfm';

export interface Example {
	suite: Suite;
	example: number;
	section: string;
	markdown: string;
	/** The spec's own expected HTML, kept to check the oracle against. */
	html: string;
}

export const all: Example[] = [
	...commonmark.map((e) => ({ ...e, suite: 'commonmark' as const })),
	...gfm.map((e) => ({ ...e, suite: 'gfm' as const }))
];

/** Keyed `suite:section`. */
export const excludedSections: Record<string, string> = {
	'commonmark:Setext headings': 'Setext headings',
	'commonmark:Indented code blocks': 'Indented code blocks',
	'commonmark:HTML blocks': 'Raw HTML blocks and inline tags',
	'commonmark:Raw HTML': 'Raw HTML blocks and inline tags',
	'commonmark:Link reference definitions': 'Reference links',
	'gfm:Autolinks': 'Bare URLs',
	'gfm:Disallowed Raw HTML': 'Raw HTML blocks and inline tags'
};

/** Keyed `suite:example`. */
export const excludedExamples: Record<string, string> = {
	// `\ ` is a non-breaking space in markz, a literal backslash and space in GFM.
	'commonmark:13': 'Non-breaking space',
	// A paragraph continuing without its `>` or its item's indentation.
	...Object.fromEntries(
		[232, 233, 238, 247, 250, 251, 291, 292, 293, 312].map((n) => [
			`commonmark:${n}`,
			'Lazy continuation lines'
		])
	)
};

/** @prose
 * Where the oracle and the spec's own HTML disagree on an included example, and why. markz is
 * still compared with the oracle there; this list only explains the oracle's self-check.
 */
export const oracleDiffers: Record<string, string> = {
	'gfm:279': 'cmark-gfm orders task-item input attributes differently and omits the void slash',
	'gfm:280': 'cmark-gfm orders task-item input attributes differently and omits the void slash'
};

/** @prose
 * ## Cut constructs
 *
 * Each rule names the oracle token that shows a construct the dialect cuts, and the `syntax.md`
 * row it falls under. The first matching rule is the reason.
 */
const first = (t: Token) => t.text.trimStart()[0];

export const cuts: [reason: string, test: (t: Token) => boolean][] = [
	['Comments', (t) => t.type === 'htmlFlow' && t.text.trimStart().startsWith('<!--')],
	['Raw HTML blocks and inline tags', (t) => t.type === 'htmlFlow' || t.type === 'htmlText'],
	['Setext headings', (t) => t.type === 'setextHeading'],
	['Indented code blocks', (t) => t.type === 'codeIndented'],
	['`~~~` fences', (t) => t.type === 'codeFencedFenceSequence' && t.text[0] === '~'],
	['Reference links', (t) => t.type === 'definition' || t.type === 'reference'],
	['Bare URLs', (t) => t.type === 'literalAutolink'],
	[
		'Named character references',
		(t) => t.type === 'characterReference' && !t.text.startsWith('&#')
	],
	['Two trailing spaces as a line break', (t) => t.type === 'hardBreakTrailing'],
	['`***`, `___`, `* * *` rules', (t) => t.type === 'thematicBreak' && first(t) !== '-'],
	['`__strong__`', (t) => t.type === 'strongSequence' && t.text[0] === '_'],
	['`*emphasis*`', (t) => t.type === 'emphasisSequence' && t.text[0] === '*'],
	['`~single~` strikethrough', (t) => t.type === 'strikethroughSequence' && t.text.length === 1]
];

/** @prose
 * ## Block-only examples
 *
 * Until the inline pass lands (`prose/plan.md`, step 5), markz is held to the oracle only on
 * examples with no inline syntax: none of the oracle's inline tokens, and none of the characters
 * that open markz's own inline constructs (`$` for math and expressions, `\ `, `{`).
 */
const INLINE = new Set([
	'autolink',
	'characterEscape',
	'characterReference',
	'codeText',
	'directiveText',
	'emphasis',
	'hardBreakEscape',
	'label',
	'strikethrough',
	'strong'
]);

export function blockOnly(e: Example): boolean {
	return !/[$]|\\ |\)\{/.test(e.markdown) && !tokens(e.markdown).some((t) => INLINE.has(t.type));
}

export function exclusion(e: Example): string | undefined {
	const listed =
		excludedExamples[`${e.suite}:${e.example}`] ?? excludedSections[`${e.suite}:${e.section}`];
	if (listed) return listed;
	const found = tokens(e.markdown);
	return cuts.find(([, test]) => found.some(test))?.[0];
}

export const included: Example[] = all.filter((e) => exclusion(e) === undefined);
