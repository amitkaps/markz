/** @prose
 * # Speed
 *
 * `pnpm bench`: markz alone, on this working tree's `src/`, in about two seconds. It answers one
 * question while you work: did this change move it? Each cell is parse + HTML over some text, in
 * MB/s: each document tier read whole, and each construct over its own examples, repeated to a
 * size (`examples/markz/<id>.md`), so a slower construct shows by name.
 *
 * A cell runs one warm pass, then passes until its time budget is spent, at least three. Its speed
 * is the median pass, and its noise band the spread of the passes around it. The first run on a
 * machine is its baseline, kept in `node_modules/.cache/` (`--save` makes the current run the
 * baseline). Every later run shows each cell's change from it, marked only where the change is
 * wider than both runs' noise, and than 5%.
 *
 * No other parser runs here, and nothing here is published: that is `pnpm compare`'s (`bench/`).
 */
import './harness/node.ts';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { html, parse } = await import('../src/index.ts');
const { TIERS, documents, repeat } = await import('./harness/corpus.ts');
const { readFences } = await import('./harness/fences.ts');

const root = join(import.meta.dirname, '..');
const BASELINE = join(root, 'node_modules/.cache/markz/speed.json');
const BUDGET_MS = 25;
const CONSTRUCT_BYTES = 20_000;
/** No change under this is marked, however quiet both runs were. */
const FLOOR = 0.05;

interface Cell {
	name: string;
	texts: string[];
}

interface Speed {
	mbPerSecond: number;
	/** The passes' spread, as a fraction of the median. */
	noise: number;
}

const cells: Cell[] = TIERS.map((tier) => ({
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

function time(cell: Cell): Speed {
	const bytes = cell.texts.reduce((sum, t) => sum + t.length, 0);
	const pass = () => {
		const start = performance.now();
		for (const text of cell.texts) html(parse(text));
		return performance.now() - start;
	};
	pass();
	const passes: number[] = [];
	for (let spent = 0; spent < BUDGET_MS || passes.length < 3;) {
		const ms = pass();
		passes.push(ms);
		spent += ms;
	}
	passes.sort((a, b) => a - b);
	const median = passes[passes.length >> 1]!;
	return {
		mbPerSecond: bytes / 1e3 / median,
		noise: (passes.at(-1)! - passes[0]!) / median
	};
}

let baseline: Record<string, Speed> | null = null;
try {
	baseline = JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, Speed>;
} catch {
	// The first run on this machine becomes its baseline.
}

const started = performance.now();
const results: Record<string, Speed> = {};
const width = Math.max(...cells.map((c) => c.name.length)) + 2;
console.log(
	`${'MB/s, parse + HTML'.padEnd(width)}${'now'.padStart(8)}${'noise'.padStart(8)}  change`
);
for (const cell of cells) {
	const now = time(cell);
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
		`${cell.name.padEnd(width)}${now.mbPerSecond.toFixed(1).padStart(8)}${`±${(now.noise * 50).toFixed(0)}%`.padStart(8)}  ${change}`
	);
}

const save = !baseline || process.argv.includes('--save');
if (save) {
	mkdirSync(join(BASELINE, '..'), { recursive: true });
	writeFileSync(BASELINE, JSON.stringify(results, null, '\t'));
}
console.log(
	`\n${((performance.now() - started) / 1000).toFixed(1)} s · ${
		save ? 'saved as the baseline' : 'against the baseline; --save replaces it'
	}`
);
