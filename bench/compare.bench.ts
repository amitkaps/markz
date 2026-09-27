/** @prose
 * # The fast benchmark
 *
 * `pnpm bench`: every parser on the same documents, through Vitest's benchmark runner (Tinybench),
 * in a minute or two. Each group is one `bench.compare`: a mode, a tier and a measure, with every
 * parser that has that measure. Vitest prints the table (operations per second, percentiles,
 * margin of error), and each group adds a line in MB/s, the unit the full suite and the site use.
 *
 * markz is also compared with itself. Each run writes markz's result to `results/baseline/`, and
 * the next run adds it to the table as `markz (last run)`, which answers whether a change moved
 * it. The baseline belongs to this machine and is gitignored.
 *
 * This is for looking, not for publishing. Every parser runs in the same worker, one after another,
 * so one library's garbage and heap state can colour the next one's numbers. The full suite
 * (`run.ts`) gives each parser its own process, times with Hyperfine, and adds memory,
 * pathological input and size; only its results reach the site.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'vite-plus/test';
import { build, CORPUS, type Entry } from './corpus.ts';
import { load, PARSERS, type Measure, type Mode } from './parsers.ts';

const manifest = build('fast');
// At least three timed passes after one warm one: the slowest parsers take seconds a pass.
const OPTIONS = { time: 500, iterations: 3, warmupTime: 200, warmupIterations: 1 };
const TIERS = ['agent', 'public', 'spec'];

interface Group {
	mode: Mode;
	measure: Measure;
	label: string;
	entries: Entry[];
}

const groups: Group[] = [];
for (const measure of ['html', 'structured'] as const) {
	for (const mode of ['common', 'dialect'] as const) {
		for (const tier of TIERS) {
			const entries = manifest.entries.filter((e) => e.tier === tier && e.variant === mode);
			groups.push({ mode, measure, label: `${tier} docs`, entries });
		}
	}
}
// The scaling curve the site draws: parse + HTML, common mode.
for (const e of manifest.entries.filter((e) => e.tier === 'scaling' && e.variant === 'common')) {
	groups.push({ mode: 'common', measure: 'html', label: `scaling ${e.name}`, entries: [e] });
}

for (const group of groups) {
	const { mode, measure, label, entries } = group;
	const sources = entries.map((e) => readFileSync(join(CORPUS, e.file), 'utf8'));
	const bytes = entries.reduce((sum, e) => sum + e.bytes, 0);
	const title = `${measure === 'html' ? 'parse + HTML' : 'structured parse'} · ${mode} · ${label}`;

	test(title, { timeout: 600_000 }, async ({ bench }) => {
		const registrations = [];
		const failed: string[] = [];
		for (const name of PARSERS) {
			const parser = await load(name, mode);
			const run = measure === 'html' ? parser.html : parser.structured;
			if (!run) continue;
			// One pass first: a parser that throws on these documents is reported, not timed.
			let async = false;
			try {
				for (const source of sources) {
					const out = run(source);
					if (out instanceof Promise) {
						async = true;
						await out;
					}
				}
			} catch (error) {
				failed.push(`${name} error (${String(error).split('\n')[0]!.slice(0, 80)})`);
				continue;
			}
			const pass = async
				? async () => {
						for (const source of sources) await run(source);
					}
				: () => {
						for (const source of sources) run(source);
					};
			const options =
				name === 'markz' ? { writeResult: baseline(title) } : ({} as Record<string, never>);
			registrations.push(bench(name, options, pass));
		}
		const previous = baseline(title);
		if (existsSync(join(import.meta.dirname, previous))) {
			registrations.push(bench.from('markz (last run)', previous));
		}
		const results = await bench.compare(...registrations, OPTIONS);
		const line = registrations
			.map((r) => {
				const ms = results.get(r.name).period;
				return `${r.name} ${(bytes / 1e6 / (ms / 1000)).toFixed(1)}`;
			})
			.join(', ');
		process.stdout.write(`\n${title}: ${line} MB/s${failed.map((f) => `, ${f}`).join('')}\n`);
	});
}

/** Where markz's result for a group is kept, relative to this package. */
function baseline(title: string): string {
	return `results/baseline/${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
}
