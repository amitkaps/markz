/** @prose
 * # Pages
 *
 * The site's Markdown pages, rendered by markz at build time. They aren't copies: every page is
 * a `prose/` doc read in place, the home page `prose/markz.md`, so the site can't drift from the
 * documents the repo is designed by. The repo's `README.md` is for GitHub only. Adding a page is adding a row to `SOURCES`.
 *
 * A page's title is its first heading, unless its row names a shorter one for the nav, and its
 * summary is its first paragraph, both read from the markz AST, so the files need no metadata
 * block of their own.
 */
import { html, parse, textContent, type Document, type NodeId } from '@amitkaps/markz';
import home from '../../../prose/markz.md?raw';
import syntax from '../../../prose/syntax.md?raw';
import grammar from '../../../prose/grammar.md?raw';
import design from '../../../prose/design.md?raw';
import lessons from '../../../prose/lessons.md?raw';
import { REPO } from './site';

export interface Page {
	/** The route, without its leading slash; empty for the home page. */
	slug: string;
	/** The repo path the page is rendered from. */
	file: string;
	title: string;
	summary: string;
	html: string;
}

const SOURCES: { slug: string; file: string; source: string; title?: string }[] = [
	{ slug: '', file: 'prose/markz.md', source: home },
	{ slug: 'syntax', file: 'prose/syntax.md', source: syntax },
	{ slug: 'grammar', file: 'prose/grammar.md', source: grammar },
	{ slug: 'design', file: 'prose/design.md', source: design },
	{ slug: 'lessons', file: 'prose/lessons.md', source: lessons }
];

function first(doc: Document, type: 'heading' | 'paragraph'): NodeId | undefined {
	for (const node of doc.children(doc.root)) if (doc.type(node) === type) return node;
	return undefined;
}

/** @prose
 * ## Links between pages
 *
 * The documents link to each other by repo path (`prose/syntax.md`, `design.md#security`), which
 * is right on GitHub. On the site, a link to another page's file goes to that page's route, and
 * any other relative link goes to the file on GitHub, so no link breaks in either place.
 */
export function rewriteLinks(out: string, file: string): string {
	return out.replace(/ href="([^"]*)"/g, (whole, href: string) => {
		if (/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return whole;
		const url = new URL(href, `https://repo.invalid/${file}`);
		const path = url.pathname.slice(1);
		const page = SOURCES.find((s) => s.file === path);
		const target = page ? `/${page.slug}${url.hash}` : `${REPO}/blob/main/${path}${url.hash}`;
		return ` href="${target}"`;
	});
}

function render({ slug, file, source, title }: (typeof SOURCES)[number]): Page {
	const doc = parse(source);
	const heading = first(doc, 'heading');
	const paragraph = first(doc, 'paragraph');
	return {
		slug,
		file,
		title: title ?? (heading === undefined ? file : textContent(doc, heading)),
		summary: paragraph === undefined ? '' : textContent(doc, paragraph).replace(/\s+/g, ' '),
		html: rewriteLinks(html(doc), file)
	};
}

export const pages: Page[] = SOURCES.map(render);

export const getPage = (slug: string): Page | undefined => pages.find((p) => p.slug === slug);
