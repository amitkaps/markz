/** @prose
 * # Memory
 *
 * `node --expose-gc memory.ts <parser> <mode> <file>` reports what a parser's structured result
 * keeps alive, in its own process. It parses the one source string `HELD` times and holds every
 * result. The heap after a full collection, minus the heap before, divided by `HELD`, is the
 * **retained heap per document**. The source is read before the first measurement, and every parse
 * gets that same string, so a parser that keeps a reference to it pays nothing for it. A parser that
 * copies it does. This is everything the result keeps alive, not an AST's size in the abstract:
 * strings, side tables and whatever else each parser chooses to hold. The RSS delta over the same
 * run is the process's view of it.
 *
 * GC count and time come from a second loop that parses without holding results. They are
 * diagnostics only, since how often V8 collects depends on its version and heuristics as much as
 * on the parser.
 */
import { readFileSync } from 'node:fs';
import { PerformanceObserver } from 'node:perf_hooks';
import { load, type Mode } from './parsers.ts';

const HELD = 50;
const LOOP = 100;

const gc = globalThis.gc;
if (!gc) throw new Error('run with node --expose-gc');

const [name, mode, file] = process.argv.slice(2);
const source = readFileSync(file!, 'utf8');
const parser = await load(name!, mode as Mode);
const parse = parser.structured;
if (!parse) throw new Error(`${name} has no structured parse`);
const once = async () => {
	const out = parse(source);
	return out instanceof Promise ? await out : out;
};

// Warm up, so compiled code and caches aren't counted as retained.
for (let i = 0; i < 5; i++) await once();

gc();
gc();
const heapBefore = process.memoryUsage().heapUsed;
const rssBefore = process.memoryUsage().rss;
const held: unknown[] = [];
for (let i = 0; i < HELD; i++) held.push(await once());
gc();
gc();
const retained = (process.memoryUsage().heapUsed - heapBefore) / HELD;
const rss = (process.memoryUsage().rss - rssBefore) / HELD;
held.length = 0;
gc();

let count = 0;
let ms = 0;
const observer = new PerformanceObserver((list) => {
	for (const entry of list.getEntries()) {
		count++;
		ms += entry.duration;
	}
});
observer.observe({ entryTypes: ['gc'] });
for (let i = 0; i < LOOP; i++) await once();
// GC entries arrive asynchronously; let the last ones land.
await new Promise((resolve) => setTimeout(resolve, 50));
observer.disconnect();

process.stdout.write(
	`${JSON.stringify({ retained, rss, gcCount: count / LOOP, gcMs: ms / LOOP, sourceBytes: Buffer.byteLength(source) })}\n`
);
