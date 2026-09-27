/** @prose
 * # One timed command
 *
 * `node cli.ts <parser> <mode> <measure> <k> <file…>` reads the files (a directory stands for its
 * Markdown files), loads one parser, and runs
 * the measure over every file `k` times. This is what Hyperfine times, as a whole process, so a run
 * includes Node's startup and the parser's import. `run.ts` times each command at `k` and `2k`
 * and takes the difference, which leaves `k` passes of warm code. The parser `none` loads and
 * parses nothing, as the baseline for a cold start.
 *
 * It also prints the in-process time of its loop, in milliseconds, which is what the pathological
 * suite reads, since that suite runs each parse once under a timeout rather than under Hyperfine.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { load, type Measure, type Mode } from './parsers.ts';

const [name, mode, measure, k, ...files] = process.argv.slice(2);
// A directory stands for its Markdown files, in order.
const paths = files.flatMap((f) =>
	statSync(f).isDirectory()
		? readdirSync(f)
				.filter((n) => n.endsWith('.md'))
				.sort()
				.map((n) => join(f, n))
		: [f]
);
const sources = paths.map((f) => readFileSync(f, 'utf8'));

if (name !== 'none') {
	const parser = await load(name!, mode as Mode);
	const run = (measure as Measure) === 'structured' ? parser.structured : parser.html;
	if (!run) throw new Error(`${name} has no structured parse`);
	// Each result is kept until the next, so no engine can drop a parse whose output goes unused.
	let kept: unknown;
	const pass = async () => {
		for (const source of sources) {
			kept = run(source);
			if (kept instanceof Promise) kept = await kept;
		}
	};
	const start = performance.now();
	for (let i = 0; i < Number(k); i++) await pass();
	const ms = performance.now() - start;
	process.stdout.write(`${JSON.stringify({ ms, kept: kept !== undefined })}\n`);
}
