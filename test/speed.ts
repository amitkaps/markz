/** @prose
 * # Speed
 *
 * `pnpm bench`: markz alone, on this working tree's `src/`, in a few seconds. It answers one
 * question while you work: did this change move it? Each cell is parse + HTML over some text, in
 * MB/s: each document tier read whole, and each construct over its own examples, repeated to a
 * size (`examples/markz/<id>.md`), so a slower construct shows by name. Last comes what holding
 * the CommonMark spec's tree costs, as a multiple of its source.
 *
 * A cell's speed is its median pass, and its noise the middle half of the passes around it
 * (`harness/speed.ts`). The first run on a machine is its baseline, kept in `node_modules/.cache/`
 * (`--save` makes the current run the baseline). Every later run shows each cell's change from
 * it, marked only where the change is wider than both runs' noise, and than 5%.
 *
 * `--compare` times markz beside the parsers in `harness/parsers.ts` on each tier's common
 * variant, each parser in a fresh process of its own (`--parser <name>`), so no parser's heap or
 * JIT state colours another's numbers. It is for our own insight: nothing here is published.
 */
import './harness/node.ts';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { html, parse } = await import('../src/index.ts');
const { TIERS, common, documents, repeat } = await import('./harness/corpus.ts');
const { readFences } = await import('./harness/fences.ts');
const { OTHERS, load } = await import('./harness/parsers.ts');
const { retained, time, warm } = await import('./harness/speed.ts');

const root = join(import.meta.dirname, '..');
const BASELINE = join(root, 'node_modules/.cache/markz/speed.json');
const BUDGET_MS = 25;
const WARM_MS = 1_000;
const CONSTRUCT_BYTES = 20_000;
/** No change under this is marked, however quiet both runs were. */
const FLOOR = 0.05;

interface Speed {
	mbPerSecond: number;
	/** The middle half of the passes' spread, as a fraction of the median. */
	noise: number;
}

function speed(run: (text: string) => unknown, texts: string[]): Speed {
	const bytes = texts.reduce((sum, t) => sum + t.length, 0);
	const t = time(run, texts, BUDGET_MS, 3);
	return { mbPerSecond: bytes / 1e3 / t.ms, noise: (t.high - t.low) / t.ms };
}

const argv = process.argv.slice(2);
const flag = (name: string) => argv.indexOf(name);
const mb = (n: number | undefined) => (n === undefined ? '—' : n.toFixed(1));

if (flag('--parser') >= 0) {
	// One parser's process: warm up on every tier, time each, and report on stdout.
	const tiers = JSON.parse(readFileSync(argv[flag('--parser') + 2]!, 'utf8')) as Record<
		string,
		string[]
	>;
	const run = await load(argv[flag('--parser') + 1]!);
	warm(run, Object.values(tiers).flat(), WARM_MS);
	const out: Record<string, number> = {};
	for (const [tier, texts] of Object.entries(tiers)) out[tier] = speed(run, texts).mbPerSecond;
	process.stdout.write(JSON.stringify(out));
} else if (flag('--compare') >= 0) {
	const dir = mkdtempSync(join(tmpdir(), 'markz-compare-'));
	const file = join(dir, 'tiers.json');
	const tiers = Object.fromEntries(
		TIERS.map((tier) => [tier, [...documents(tier).values()].map((d) => common(parse(d)))])
	);
	writeFileSync(file, JSON.stringify(tiers));
	const width = 16;
	console.log(
		`${'MB/s, parse + HTML'.padEnd(width + 8)}${TIERS.map((t) => t.padStart(8)).join('')}`
	);
	console.log('common variant, warm, each parser in its own process\n');
	try {
		for (const parser of ['markz', ...OTHERS]) {
			const child = spawnSync(
				process.execPath,
				[join(import.meta.dirname, 'speed.ts'), '--parser', parser, file],
				{ encoding: 'utf8' }
			);
			if (child.status !== 0) {
				console.log(`${parser.padEnd(width + 8)}failed: ${child.stderr.split('\n')[0]}`);
				continue;
			}
			const out = JSON.parse(child.stdout) as Record<string, number>;
			console.log(
				`${parser.padEnd(width + 8)}${TIERS.map((t) => mb(out[t]).padStart(8)).join('')}`
			);
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
} else {
	const run = (text: string) => html(parse(text));
	const cells = TIERS.map((tier) => ({
		name: `${tier} documents`,
		texts: [...documents(tier).values()]
	}));
	const own = join(root, 'test/examples/markz');
	for (const file of readdirSync(own).sort()) {
		if (!file.endsWith('.md') || file === 'README.md' || file === 'not-supported.md') continue;
		const examples = readFences(readFileSync(join(own, file), 'utf8')).examples;
		const text = examples.map((e) => e.markdown.replace(/\s*$/, '\n')).join('\n');
		cells.push({ name: file.slice(0, -3), texts: [repeat(text, CONSTRUCT_BYTES)] });
	}

	let baseline: Record<string, Speed> | null = null;
	try {
		baseline = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, Speed>;
	} catch {
		// The first run on this machine becomes its baseline.
	}

	const started = performance.now();
	warm(
		run,
		cells.flatMap((c) => c.texts),
		WARM_MS
	);
	const results: Record<string, Speed> = {};
	const width = Math.max(...cells.map((c) => c.name.length)) + 2;
	console.log(
		`${'MB/s, parse + HTML'.padEnd(width)}${'now'.padStart(8)}${'noise'.padStart(8)}  change`
	);
	for (const cell of cells) {
		const now = speed(run, cell.texts);
		results[cell.name] = now;
		const before = baseline?.[cell.name];
		let change = '';
		if (before) {
			const delta = now.mbPerSecond / before.mbPerSecond - 1;
			const band = Math.max(now.noise, before.noise, FLOOR);
			change = `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(0)}%`;
			if (Math.abs(delta) > band) change += delta > 0 ? '  faster' : '  SLOWER';
		}
		console.log(
			`${cell.name.padEnd(width)}${mb(now.mbPerSecond).padStart(8)}${`±${(now.noise * 50).toFixed(0)}%`.padStart(8)}  ${change}`
		);
	}

	const spec = [...documents('spec').values()][0]!;
	console.log(
		`\nholding the CommonMark spec's tree: ${(retained(parse, spec) / spec.length).toFixed(1)}× its source`
	);

	const save = !baseline || argv.includes('--save');
	if (save) {
		mkdirSync(join(BASELINE, '..'), { recursive: true });
		writeFileSync(BASELINE, JSON.stringify(results, null, '\t'));
	}
	console.log(
		`${((performance.now() - started) / 1000).toFixed(1)} s · ${
			save ? 'saved as the baseline' : 'against the baseline; --save replaces it'
		}`
	);
}
