/** @prose
 * The home page's content is the README page, loaded at build time like the others.
 */
import { getPage } from '#lib';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ page: getPage('')! });
