/** @prose
 * # One construct at a time
 *
 * Where markz's time goes, by construct. Each document is one construct over and over: the cases
 * `test/cases.ts` writes from the grammar that markz reads cleanly, each where its reading puts it
 * (a block on its own, an inline construct between words), joined by blank lines to about 200 KB.
 * markz's structured parse is timed on each, and markdown-exit's beside it for the constructs
 * CommonMark and GFM define, which it reads too. The corpus benchmarks say how fast markz is on
 * real documents; this says which constructs make it so.
 *
 * A quick look in `pnpm bench`, never published: generated documents are nothing anyone writes.
 * Metadata is left out, since a document holds only one block of it.
 */
import { test, type BenchRegistration } from 'vite-plus/test';
import { judge, reading, valid } from '../test/cases.ts';
import { CONSTRUCTS } from '../test/grammar.ts';
import { load } from './parsers.ts';

const SIZE = 200_000;
const OPTIONS = { time: 300, iterations: 5, warmupTime: 100, warmupIterations: 1 };

function document(id: string): string {
	const r = reading(id);
	const cases = valid(id, 200, 20260927)
		.filter((s) => {
			const v = judge(id, s);
			return v.agree && v.accepted;
		})
		.map((s) => r.wrap(s).replace(/\s*$/, '\n'));
	if (!cases.length) return '';
	let out = '';
	for (let i = 0; out.length < SIZE; i++) out += `${cases[i % cases.length]!}\n`;
	return out;
}

for (const c of CONSTRUCTS.filter((c) => c.id !== 'metadata')) {
	const source = document(c.id);
	const shared = c.origin === 'CommonMark' || c.origin === 'GFM';
	test.skipIf(!source)(`structured parse · ${c.id}`, { timeout: 120_000 }, async ({ bench }) => {
		const names = shared ? (['markz', 'markdown-exit'] as const) : (['markz'] as const);
		const registrations: BenchRegistration<string>[] = [];
		for (const name of names) {
			const parser = await load(name, 'common');
			const run = parser.structured!;
			registrations.push(bench(name, () => run(source)));
		}
		// A construct only markz reads is timed alone; `compare` needs two.
		const periods =
			registrations.length > 1
				? await bench
						.compare(...registrations, OPTIONS)
						.then((results) => registrations.map((r) => results.get(r.name).period))
				: [(await registrations[0]!.run(OPTIONS)).period];
		const line = registrations
			.map((r, i) => `${r.name} ${(source.length / 1e3 / periods[i]!).toFixed(1)}`)
			.join(', ');
		process.stdout.write(`\n${c.id}: ${line} MB/s\n`);
	});
}
