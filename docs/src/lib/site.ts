/** @prose
 * Constants and shared types that are safe in the browser. Everything else in `lib` runs at build
 * time only, and the conformance page, the one route that ships JavaScript, imports from here
 * rather than from those modules, so markz, micromark and the Markdown sources stay out of its
 * bundle.
 */
export const REPO = 'https://github.com/amitkaps/markz';

export type Status = 'match' | 'warn' | 'differ' | 'fail';
export const STATUSES: Status[] = ['match', 'warn', 'differ', 'fail'];
export type Part = 'Metadata' | 'Block' | 'Inline' | 'Not supported';
export const PARTS: Part[] = ['Metadata', 'Block', 'Inline', 'Not supported'];

/** A construct's generated edges, from the grammar, and why it has no hand-written one it can't have. */
export interface Edges {
	valid: number;
	boundary: number;
	'near-miss': number;
	/** Cases markz and the grammar read differently that nothing settles; the tests hold it at 0. */
	unsettled: number;
	none: Partial<Record<'ambiguous' | 'unclosed', string>>;
}

export interface Row {
	/** The upstream suite (`commonmark`, `gfm`, `gfm-table`, …), or `markz` for its own examples. */
	source: string;
	id: string;
	number: number;
	part: Part;
	/** The construct id or Not supported code the example is filed under. */
	section: string;
	/** What the page shows for it: the construct's `syntax.md` heading, or the code. */
	title: string;
	/** The upstream suite's own section. */
	upstream: string | null;
	/** How it is checked: `oracle`, `differ`, `not supported` or `expected`. */
	kind: string;
	/** For markz's own: the edge it tries, and for an ambiguous one the side rule that settles it. */
	category: string | null;
	rule: string | null;
	markdown: string;
	status: Status;
	/** What it matched, the codes it warned with, or why it fails. */
	detail: string;
	/** Who holds it: `micromark`, `micromark-extension-math`, `yaml` or `github-slugger` for an upstream example, else `markz`. */
	oracle: string;
	/** What markz is held to: the oracle's output, or markz's own expected HTML. */
	expected: string;
	markz: string;
	/** The metadata markz read, as JSON, when a Markdown example has any. */
	metadata: string | null;
	/** Both outputs normalized, for a failing example. */
	normalized: [expected: string, markz: string] | null;
	warnings: string[];
	/** The warning codes, for search. */
	codes: string[];
}
