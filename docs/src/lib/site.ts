/** @prose
 * Constants and shared types that are safe in the browser. Everything else in `lib` runs at build
 * time only, and the conformance page, the one route that ships JavaScript, imports from here
 * rather than from those modules, so markz, micromark and the Markdown sources stay out of its
 * bundle.
 */
export const REPO = 'https://github.com/amitkaps/markz';

export type Status = 'pass' | 'fail' | 'excluded';

export interface Row {
	suite: 'commonmark' | 'gfm';
	example: number;
	section: string;
	markdown: string;
	status: Status;
	/** The `syntax.md` reason, for an excluded example. */
	reason: string | null;
	oracle: string;
	markz: string;
	/** Both outputs normalized, for a failing example. */
	normalized: [oracle: string, markz: string] | null;
	diagnostics: string[];
}
