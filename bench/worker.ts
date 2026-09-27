/** @prose
 * # One parser's process
 *
 * `node --expose-gc worker.ts <parser> <mode> <job.json>` loads one parser, set up for one mode,
 * and runs every cell of the job in that fresh process, then reports on stdout. The runner starts
 * one per parser and mode, in turn, so no parser's heap or JIT state colours another's numbers.
 *
 * A cell is one measure over some files (a directory stands for its Markdown files). It runs one
 * warm pass, then passes until its time budget is spent, at least two, and reports the median
 * pass and how widely the passes spread around it. A slow parser on a large file would otherwise
 * take most of the run, so where an earlier cell of the same measure has warmed the process and
 * says one pass will outlast the budget, the cell skips its warm pass and times one, with no
 * spread to report. A warm pass is what a server or a watch build
 * pays for each document once it is running.
 *
 * The job may also ask for **retained memory after parse**: what holding a structured result keeps
 * alive. The one source string is parsed `HELD` times and every result held; the heap after a full
 * collection, less the heap before, divided by `HELD`, is the figure. Every parse gets the same
 * string, so a parser that keeps a reference to its source pays nothing for it and one that copies
 * it does. The RSS change over the same run is the process's view of it.
 *
 * `worker.ts <parser> <mode> --once <file…>` runs one pass and prints its time: what Hyperfine
 * times for a cold start, and what a pathological input gets under a timeout.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { load, type Measure, type Mode } from './parsers.ts';

export interface Cell {
	key: string;
	measure: Measure;
	files: string[];
	budgetMs: number;
}

export interface Job {
	cells: Cell[];
	/** The file to measure retained memory on, when the parser has a structured parse. */
	memory?: string;
}

export interface CellResult {
	key: string;
	/** The median pass, or `null` when the parser threw; `error` says what. */
	ms: number | null;
	/** The passes' spread, as a fraction of the median; `null` after one pass. */
	noise: number | null;
	passes: number;
	error?: string;
}

export interface MemoryResult {
	sourceBytes: number;
	retained: number;
	rss: number;
}

const HELD = 20;

const read = (files: string[]) =>
	files
		.flatMap((f) =>
			statSync(f).isDirectory()
				? readdirSync(f)
						.filter((n) => n.endsWith('.md'))
						.sort()
						.map((n) => join(f, n))
				: [f]
		)
		.map((f) => readFileSync(f, 'utf8'));

const [name, mode, ...rest] = process.argv.slice(2);
const parser = await load(name!, mode as Mode);
// Each result is kept until the next, so no engine can drop a parse whose output goes unused.
let kept: unknown;

async function pass(run: (s: string) => unknown, sources: string[]): Promise<number> {
	const start = performance.now();
	for (const source of sources) {
		kept = run(source);
		if (kept instanceof Promise) kept = await kept;
	}
	return performance.now() - start;
}

const runner = (measure: Measure) => (measure === 'structured' ? parser.structured : parser.html);

if (rest[0] === '--once') {
	const ms = await pass(runner('html')!, read(rest.slice(1)));
	process.stdout.write(`${JSON.stringify({ ms, kept: kept !== undefined })}\n`);
} else {
	const job = JSON.parse(readFileSync(rest[0]!, 'utf8')) as Job;
	const cells: CellResult[] = [];
	/** Milliseconds per byte, by measure, from the last cell that ran it. */
	const rate = new Map<Measure, number>();
	for (const cell of job.cells) {
		const run = runner(cell.measure);
		if (!run) continue;
		const sources = read(cell.files);
		const bytes = sources.reduce((sum, s) => sum + s.length, 0);
		const predicted = (rate.get(cell.measure) ?? 0) * bytes;
		try {
			const slow = predicted >= cell.budgetMs;
			if (!slow) await pass(run, sources);
			const least = slow ? 1 : 2;
			const passes: number[] = [];
			for (let spent = 0; spent < cell.budgetMs || passes.length < least;) {
				const ms = await pass(run, sources);
				passes.push(ms);
				spent += ms;
			}
			passes.sort((a, b) => a - b);
			const median = passes[passes.length >> 1]!;
			rate.set(cell.measure, median / bytes);
			const noise = passes.length > 1 ? (passes.at(-1)! - passes[0]!) / median : null;
			cells.push({ key: cell.key, ms: median, noise, passes: passes.length });
		} catch (error) {
			const message = String(error).split('\n')[0]!.slice(0, 200);
			cells.push({ key: cell.key, ms: null, noise: null, passes: 0, error: message });
		}
	}
	let memory: MemoryResult | undefined;
	if (job.memory && parser.structured) memory = await retained(parser.structured, job.memory);
	process.stdout.write(`${JSON.stringify({ cells, memory })}\n`);
}

async function retained(parse: (s: string) => unknown, file: string): Promise<MemoryResult> {
	const gc = globalThis.gc;
	if (!gc) throw new Error('run with node --expose-gc');
	const source = readFileSync(file, 'utf8');
	const once = async () => {
		const out = parse(source);
		return out instanceof Promise ? await out : out;
	};
	// Warm up, so compiled code and caches aren't counted as retained.
	for (let i = 0; i < 3; i++) await once();
	kept = undefined;
	gc();
	gc();
	const heap = process.memoryUsage().heapUsed;
	const rss = process.memoryUsage().rss;
	const held: unknown[] = [];
	for (let i = 0; i < HELD; i++) held.push(await once());
	gc();
	gc();
	const after = process.memoryUsage();
	// Read after measuring, so the results are alive until then.
	if (held.length !== HELD) throw new Error('lost a result');
	return {
		sourceBytes: Buffer.byteLength(source),
		retained: (after.heapUsed - heap) / HELD,
		rss: (after.rss - rss) / HELD
	};
}
