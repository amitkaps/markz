/** @prose
 * The nav, from the page list. It is loaded on the server so the layout carries titles, not the
 * page module: the conformance page hydrates this layout, and would otherwise ship markz and every
 * Markdown source to the browser.
 */
import { pages } from "#lib";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = () => ({
  nav: pages.filter((p) => p.slug).map(({ slug, title }) => ({ slug, title })),
});
