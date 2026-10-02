/** @prose
 * Computes the Quality page at build time: the conformance rows and each construct's edges, and
 * markz's size and speed. The page is prerendered, so micromark, the spec suites and the timing
 * run once, during the build, and never on the Worker.
 */
import { conformance, constructEdges } from "#lib/server/conformance.ts";
import { quality } from "#lib/server/quality.ts";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  rows: conformance(),
  edges: constructEdges(),
  built: new Date().toISOString(),
  quality: await quality(),
});
