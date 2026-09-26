/** @prose
 * # Spec examples
 *
 * The CommonMark and GFM spec examples markz is compared on, and the checked list of the ones it
 * isn't. An example is excluded because it uses syntax the dialect cuts or changes, and its reason
 * names that place in `syntax.md`: a row of the "Not supported" table (by the start of its first
 * cell) or a heading under "Supported, with limits". The oracle test checks that every reason
 * resolves, so the list can't drift from the dialect.
 *
 * Whole sections go first; single examples are added as their sections are enabled in the oracle
 * test (`prose/plan.md`, steps 4–5), when a failure shows which dialect rule an example crosses.
 */
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
	// Autolinks: the ones that are text in CommonMark but bare URLs in GFM.
	'commonmark:602': 'Bare URLs',
	'commonmark:608': 'Bare URLs',
	'commonmark:611': 'Bare URLs',
	'commonmark:612': 'Bare URLs',
	// Inline HTML in other sections' examples.
	...Object.fromEntries(
		[21, 31, 344, 475, 476, 477, 491, 494, 524, 536, 642, 643].map((n) => [
			`commonmark:${n}`,
			'Raw HTML blocks and inline tags'
		])
	),
	// `<!-- -->` between two lists: a comment node in markz, escaped text to the oracle.
	'commonmark:308': 'Comments',
	'commonmark:309': 'Comments'
};

/** @prose
 * Where the oracle and the spec's own HTML disagree on an included example, and why. markz is
 * still compared with the oracle there; this list only explains the oracle's self-check.
 */
export const oracleDiffers: Record<string, string> = {
	'gfm:279': 'cmark-gfm orders task-item input attributes differently and omits the void slash',
	'gfm:280': 'cmark-gfm orders task-item input attributes differently and omits the void slash'
};

export function exclusion(e: Example): string | undefined {
	return excludedExamples[`${e.suite}:${e.example}`] ?? excludedSections[`${e.suite}:${e.section}`];
}

export const included: Example[] = all.filter((e) => exclusion(e) === undefined);
