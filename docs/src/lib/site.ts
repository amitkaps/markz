/** @prose
 * Constants and shared types that are safe in the browser. Everything else in `lib` runs at build
 * time only, and the conformance page, the one route that ships JavaScript, imports from here
 * rather than from those modules, so markz, micromark and the Markdown sources stay out of its
 * bundle.
 */
export const REPO = 'https://github.com/amitkaps/markz';

export type Status = 'pass' | 'fail' | 'differs';
export type Part = 'Metadata' | 'Block' | 'Inline' | 'Not supported';
export const PARTS: Part[] = ['Metadata', 'Block', 'Inline', 'Not supported'];

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
	/** How it is checked: `oracle`, `differs`, `not supported` or `expected`. */
	kind: string;
	markdown: string;
	status: Status;
	/** Why it fails. */
	problem: string | null;
	/** What markz is held to: the oracle's HTML, or markz's own expected HTML. */
	expected: string;
	markz: string;
	/** Both outputs normalized, for a failing example. */
	normalized: [expected: string, markz: string] | null;
	warnings: string[];
}
