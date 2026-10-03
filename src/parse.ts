/** @prose
 * # Parse
 *
 * Source text to `Document`, in the block pass, which runs the inline pass on each leaf and
 * settles each heading's id as it closes (design: Parser foundation). Nothing runs after it. A leading BOM is part of the source and
 * falls before the root's start.
 */
import { Builder, type Document } from "./ast";
import { blocks } from "./block";

/** Parses markz Markdown into a read-only `Document`. */
export function parse(source: string): Document {
  const start = source.charCodeAt(0) === 0xfeff ? 1 : 0;
  const b = new Builder(source, start);
  blocks(b, source, start);
  return b.finish();
}
