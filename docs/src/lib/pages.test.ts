/** @prose
 * The pages render with markz and link correctly on the site: titles and summaries come from the
 * files themselves, and repo-path links turn into routes or GitHub URLs.
 */
import { describe, expect, it } from 'vite-plus/test';
import { pages, rewriteLinks } from './pages';
import { REPO } from './site';

describe('pages', () => {
	it('take their titles from their first heading', () => {
		expect(pages.map((p) => [p.slug, p.title])).toEqual([
			['', 'markz'],
			['syntax', 'Syntax'],
			['grammar', 'Grammar'],
			['design', 'Design'],
			['lessons', 'Lessons']
		]);
	});

	it('render every file to HTML with a summary', () => {
		for (const page of pages) {
			expect(page.html).toContain('<h1');
			expect(page.summary.length).toBeGreaterThan(0);
		}
	});
});

describe('links', () => {
	it.each([
		['syntax.md', 'prose/markz.md', '/syntax'],
		['design.md#security', 'prose/syntax.md', '/design#security'],
		['../vite.config.ts', 'prose/lessons.md', `${REPO}/blob/main/vite.config.ts`],
		['#metadata', 'prose/syntax.md', '#metadata'],
		['https://example.com', 'prose/markz.md', 'https://example.com']
	])('%s from %s goes to %s', (href, file, target) => {
		expect(rewriteLinks(`<a href="${href}">x</a>`, file)).toBe(`<a href="${target}">x</a>`);
	});
});
