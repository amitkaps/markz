/** @prose
 * Computes the conformance rows at build time. The page is prerendered, so micromark and the
 * spec suites run once, during the build, and never on the Worker.
 */
import { conformance } from '#lib/server/conformance.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	rows: conformance(),
	built: new Date().toISOString()
});
