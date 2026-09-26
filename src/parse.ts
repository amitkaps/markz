/** @prose
 * # Parse
 *
 * Source text to `Document`: the block pass, the inline pass per leaf, then heading ids (spec:
 * Parser foundation). A leading BOM is part of the source and falls before the root's start.
 *
 * Until the block pass lands (`prose/plan.md`, step 4) the document is only its root.
 */
import { Builder, type Document } from './ast';

export function parse(source: string): Document {
	return new Builder(source, source.charCodeAt(0) === 0xfeff ? 1 : 0).finish();
}
