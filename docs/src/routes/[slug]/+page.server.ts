/** @prose
 * Loads one Markdown page by its `[slug]`, and lists the slugs for prerendering: a dynamic route
 * only becomes static output when `entries` names every page.
 */
import { getPage, pages } from "#lib";
import { error } from "@sveltejs/kit";
import type { EntryGenerator, PageServerLoad } from "./$types";

export const entries: EntryGenerator = () =>
  pages.filter((p) => p.slug).map((p) => ({ slug: p.slug }));

export const load: PageServerLoad = ({ params }) => {
  const page = getPage(params.slug);
  if (!page || !page.slug) error(404, "Not found");
  return { page };
};
