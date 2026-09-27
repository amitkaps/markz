/** @prose
 * # The comparison
 *
 * `pnpm compare` builds markz and the corpus, then starts one fresh process per parser and mode,
 * in turn (`worker.ts`), which runs every cell for that parser on a time budget, and collects what
 * comes back into `results/latest.json` with the environment it ran in. It is meant to run often,
 * in well under a minute: the document tiers, the scaling curve to 1 MB, one construct at a time,
 * retained memory and bundle size.
 *
 * `--deep` adds what takes longer, for a run to publish: the 10 MB size, the formatted tier, the
 * pathological inputs under a timeout, and the cold start, timed by Hyperfine as whole processes.
 * `--snapshot` copies the latest results to the site and regenerates the README's table of
 * adapters from them, which is how published numbers change: on purpose, in a commit of their own.
 * `--smoke` runs every adapter once and times nothing, so CI knows they still work.
 *
 * **Warm and cold.** Every throughput figure is warm: the median of repeated passes after one
 * unmeasured pass, in a process that has already loaded the parser, which is what a server or a
 * watch build pays per document. Cold is a whole new process reading the agent tier once, Node's
 * startup and the parser's import included, which is what a CLI or a one-off build step pays.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { build, CORPUS, type Entry, type Manifest } from './corpus.ts';
import { load, PARSERS, type Measure, type Mode } from './parsers.ts';
import { sizes, type Size } from './size.ts';
import type { Cell, CellResult, Job, MemoryResult } from './worker.ts';

const here = import.meta.dirname;
const root = join(here, '..');
const RESULTS = join(here, 'results');
const LATEST = join(RESULTS, 'latest.json');
const PUBLISHED = join(root, 'docs/src/lib/bench.json');
const README = join(here, 'README.md');
const MODES: Mode[] = ['common', 'dialect'];
const MEASURES: Measure[] = ['html', 'structured'];

export interface Settings {
	deep: boolean;
	/** How long a cell's timed passes may take; a slow parser still runs two. */
	budgetMs: number;
	/** How long a pathological run may take before it counts as a timeout. */
	timeoutMs: number;
}

const SETTINGS = { budgetMs: 40, timeoutMs: 10_000 };
/** Past this ratio of time per byte, from 100 KB to the largest size, scaling isn't linear. */
const LINEAR = 1.5;

export interface Adapter {
	representation: string | null;
	configuration: string;
	capabilities: string[];
}

export interface Throughput {
	mode: Mode;
	tier: string;
	/** `all` for a tier read whole, or the scaling size. */
	name: string;
	bytes: number;
	parser: string;
	measure: Measure;
	/** One warm pass, the median; `null` when the parser threw, and `error` says what. */
	ms: number | null;
	/** The passes' spread, as a fraction of the median; `null` when one pass was all it took. */
	noise: number | null;
	passes: number;
	mbPerSecond: number | null;
	error?: string;
	/** When the passes spread over half the median, which makes the number a rough one. */
	noisy: boolean;
}

/** One construct's document, structured parse, common mode. */
export interface ConstructTime {
	construct: string;
	origin: string;
	parser: string;
	bytes: number;
	mbPerSecond: number | null;
}

/** From 100 KB to the largest size: how time per byte grew, parse + HTML, common mode. */
export interface Scaling {
	parser: string;
	ratio: number;
	/** Approximately linear: time per byte grew by less than `LINEAR`. */
	linear: boolean;
}

export interface Memory extends MemoryResult {
	mode: Mode;
	parser: string;
}

export interface Cold {
	mode: Mode;
	parser: string;
	/** Median whole-process time, startup included. `none` is Node alone. */
	ms: number;
	stddevMs: number;
}

export interface Pathological {
	pattern: string;
	parser: string;
	n: number;
	bytes: number;
	outcome: 'ok' | 'timeout' | 'error';
	ms: number | null;
	error?: string;
}

export interface Results {
	settings: Settings;
	environment: Record<string, unknown>;
	corpus: { hash: string };
	adapters: Record<string, Record<Mode, Adapter>>;
	throughput: Throughput[];
	constructs: ConstructTime[];
	scaling: Scaling[];
	memory: Memory[];
	cold: Cold[];
	pathological: Pathological[];
	size: Size[];
}

const args = new Set(process.argv.slice(2));

if (args.has('--snapshot')) snapshot();
else if (args.has('--smoke')) await smoke();
else await main(args.has('--deep'));

/** @prose
 * ## Smoke
 *
 * Every adapter once, in this process: each parser's structured parse and HTML in both modes over
 * the agent tier, one worker with memory, one pathological run and the size entries. It times
 * nothing and writes no results, so numbers from it can't be published.
 */
async function smoke() {
	execFileSync('pnpm', ['build'], { cwd: root, stdio: 'ignore' });
	const manifest = await build('smoke');
	const agent = (variant: string) =>
		manifest.entries
			.filter((e) => e.tier === 'agent' && e.variant === variant)
			.map((e) => readFileSync(join(CORPUS, e.file), 'utf8'));
	for (const mode of MODES) {
		const sources = agent(mode);
		for (const name of PARSERS) {
			const parser = await load(name, mode);
			for (const run of [parser.structured, parser.html]) {
				if (run) for (const source of sources) await run(source);
			}
		}
	}
	const [small] = manifest.entries.filter((e) => e.tier === 'scaling');
	const cell: Cell = { key: 'smoke', measure: 'html', files: [path(small!)], budgetMs: 0 };
	const out = worker('markz', 'dialect', { cells: [cell], memory: path(small!) });
	if (out.cells[0]?.ms == null || !out.memory) throw new Error('the worker failed');
	const [pattern] = manifest.entries.filter((e) => e.tier === 'pathological');
	if (typeof once('markz', 'common', path(pattern!), 10_000) !== 'number') {
		throw new Error('the pathological run failed');
	}
	await sizes(PARSERS);
	console.log(`smoke: ${PARSERS.length} parsers, both modes, every measure`);
}

async function main(deep: boolean) {
	const settings: Settings = { deep, ...SETTINGS };
	const started = performance.now();
	if (deep && spawnSync('hyperfine', ['--version']).status !== 0) {
		throw new Error(
			'hyperfine is not on the PATH: `mise install` installs the version mise.toml pins'
		);
	}
	execFileSync('pnpm', ['build'], { cwd: root, stdio: 'ignore' });
	const manifest = await build(deep ? 'deep' : 'fast');
	const only = [...args]
		.find((a) => a.startsWith('--only='))
		?.slice(7)
		.split(',');
	const parsers = only ?? PARSERS;

	const results: Results = {
		settings,
		environment: environment(deep),
		corpus: { hash: manifest.hash },
		adapters: {},
		throughput: [],
		constructs: [],
		scaling: [],
		memory: [],
		cold: [],
		pathological: [],
		size: []
	};
	for (const parser of parsers) {
		const adapter = async (mode: Mode): Promise<Adapter> => {
			const { representation, configuration, capabilities } = await load(parser, mode);
			return { representation, configuration, capabilities };
		};
		results.adapters[parser] = {
			common: await adapter('common'),
			dialect: await adapter('dialect')
		};
	}

	for (const mode of MODES) {
		for (const parser of parsers) {
			const structured = results.adapters[parser]![mode].representation !== null;
			const { cells, at } = plan(manifest, mode, parser, structured, settings);
			const memory = manifest.entries.find(
				(e) => e.tier === 'scaling' && e.variant === mode && e.name === '10 KB'
			);
			const out = worker(parser, mode, {
				cells,
				memory: structured && memory ? path(memory) : undefined
			});
			for (const r of out.cells) {
				const where = at.get(r.key)!;
				const mbPerSecond = r.ms === null ? null : where.bytes / 1e3 / r.ms;
				if (where.tier === 'construct') {
					const { name, origin, bytes } = where;
					results.constructs.push({ construct: name, origin: origin!, parser, bytes, mbPerSecond });
				} else {
					const { measure, ...rest } = where;
					results.throughput.push({
						mode,
						...rest,
						parser,
						measure,
						ms: r.ms,
						noise: r.noise,
						passes: r.passes,
						mbPerSecond,
						...(r.error ? { error: r.error } : {}),
						noisy: (r.noise ?? 0) > 0.5
					});
				}
			}
			if (out.memory) results.memory.push({ mode, parser, ...out.memory });
			const headline = results.throughput.find(
				(t) => t.mode === mode && t.parser === parser && t.tier === 'agent' && t.measure === 'html'
			);
			log(`${mode} ${parser}: ${out.cells.length} cells, agent documents ${show(headline)} MB/s`);
		}
	}
	results.scaling = scaling(results.throughput, parsers);

	if (deep) {
		for (const mode of MODES) {
			const starts = cold(parsers, mode, join(CORPUS, 'agent', mode));
			results.cold.push(...starts);
			log(
				`${mode} cold start: ${starts.map((c) => `${c.parser} ${c.ms.toFixed(0)}`).join(', ')} ms`
			);
		}
		for (const entry of manifest.entries.filter((e) => e.tier === 'pathological')) {
			for (const parser of parsers) {
				results.pathological.push(pathological(parser, entry, settings.timeoutMs));
			}
			log(`pathological ${entry.name} at ${entry.n}`);
		}
	}

	results.size = await sizes(parsers);

	mkdirSync(RESULTS, { recursive: true });
	writeFileSync(LATEST, JSON.stringify(results, null, '\t') + '\n');
	report(results);
	console.log(`\n${((performance.now() - started) / 1000).toFixed(0)} s · wrote ${LATEST}`);
}

function path(entry: Entry): string {
	return join(CORPUS, entry.file);
}

interface Where {
	tier: string;
	name: string;
	bytes: number;
	measure: Measure;
	origin?: string;
}

/** @prose
 * ## A parser's cells
 *
 * Each document tier read whole, in each measure the parser has; the scaling sizes, parse + HTML
 * in the common mode, which is the curve the site draws; and in the common mode, each construct's
 * document, structured parse, for markz, and for markdown-exit where the construct is CommonMark's
 * or GFM's and it reads it too.
 */
function plan(
	manifest: Manifest,
	mode: Mode,
	parser: string,
	structured: boolean,
	settings: Settings
): { cells: Cell[]; at: Map<string, Where> } {
	const cells: Cell[] = [];
	const at = new Map<string, Where>();
	const add = (where: Where, files: string[]) => {
		const key = `${where.tier} ${where.name} ${where.measure}`;
		cells.push({ key, measure: where.measure, files, budgetMs: settings.budgetMs });
		at.set(key, where);
	};
	// Smallest first, so a slow parser's rate is known before its largest cell.
	for (const tier of ['spec', 'agent', 'formatted', 'public']) {
		const entries = manifest.entries.filter((e) => e.tier === tier && e.variant === mode);
		if (!entries.length) continue;
		const bytes = entries.reduce((sum, e) => sum + e.bytes, 0);
		for (const measure of MEASURES) {
			if (measure === 'html' || structured) {
				add({ tier, name: 'all', bytes, measure }, [join(CORPUS, tier, mode)]);
			}
		}
	}
	if (mode === 'common') {
		for (const e of manifest.entries.filter((e) => e.tier === 'scaling' && e.variant === mode)) {
			add({ tier: 'scaling', name: e.name, bytes: e.bytes, measure: 'html' }, [path(e)]);
		}
		for (const e of manifest.entries.filter((e) => e.tier === 'construct')) {
			const shared = e.origin === 'CommonMark' || e.origin === 'GFM';
			if (parser === 'markz' || (parser === 'markdown-exit' && shared)) {
				const where = { tier: 'construct', name: e.name, bytes: e.bytes, origin: e.origin };
				add({ ...where, measure: 'structured' }, [path(e)]);
			}
		}
	}
	return { cells, at };
}

function worker(
	parser: string,
	mode: Mode,
	job: Job
): { cells: CellResult[]; memory?: MemoryResult } {
	mkdirSync(RESULTS, { recursive: true });
	const file = join(RESULTS, '.job.json');
	writeFileSync(file, JSON.stringify(job));
	try {
		const out = execFileSync(
			process.execPath,
			['--expose-gc', join(here, 'worker.ts'), parser, mode, file],
			{ encoding: 'utf8', maxBuffer: 1 << 24 }
		);
		return JSON.parse(out) as { cells: CellResult[]; memory?: MemoryResult };
	} finally {
		rmSync(file, { force: true });
	}
}

/** From 100 KB to the largest size, each parser's growth in time per byte. */
function scaling(throughput: Throughput[], parsers: string[]): Scaling[] {
	return parsers.flatMap((parser) => {
		const points = throughput
			.filter((t) => t.tier === 'scaling' && t.parser === parser && t.ms !== null)
			.sort((a, b) => a.bytes - b.bytes);
		const from = points.find((t) => t.name === '100 KB');
		const to = points.at(-1);
		if (!from || !to || to === from) return [];
		const ratio = to.ms! / to.bytes / (from.ms! / from.bytes);
		return [{ parser, ratio, linear: ratio < LINEAR }];
	});
}

/** @prose
 * ## Cold start and pathological input (deep)
 *
 * Cold start is one Hyperfine invocation per mode: Node alone (`none`), then each parser reading
 * the agent tier once, as whole processes, so they share the machine's state as closely as
 * separate processes can. `-N` runs each without a shell, which would add its own startup.
 *
 * A pathological input runs once per parser, at its defaults (the common mode) and to HTML, since
 * that is what every parser does, under a timeout, since a run that has gone quadratic can't be
 * stopped from inside. A timeout, or a crash such as a stack overflow on deep nesting, is a
 * result, not a failure of the run.
 */
function cold(parsers: string[], mode: Mode, dir: string): Cold[] {
	const command = (parser: string) =>
		`${process.execPath} ${join(here, 'worker.ts')} ${parser} ${mode} --once ${dir}`;
	const commands = ['-n', 'none', `${process.execPath} -e 0`];
	for (const parser of parsers) commands.push('-n', parser, command(parser));
	const file = join(RESULTS, '.hyperfine.json');
	mkdirSync(RESULTS, { recursive: true });
	execFileSync(
		'hyperfine',
		['-N', '--warmup', '1', '--runs', '10', '--export-json', file, '--style', 'none', ...commands],
		{ stdio: 'ignore' }
	);
	const json = JSON.parse(readFileSync(file, 'utf8')) as {
		results: { command: string; median: number; stddev: number | null }[];
	};
	rmSync(file);
	return json.results.map((r) => ({
		mode,
		parser: r.command,
		ms: r.median * 1000,
		stddevMs: (r.stddev ?? 0) * 1000
	}));
}

function pathological(parser: string, entry: Entry, timeoutMs: number): Pathological {
	const result = once(parser, 'common', path(entry), timeoutMs);
	const base = { pattern: entry.name, parser, n: entry.n!, bytes: entry.bytes };
	if (typeof result === 'number') return { ...base, outcome: 'ok', ms: result };
	return { ...base, ...result, ms: null };
}

/** One process, one pass, its own time, or why it didn't finish. */
function once(
	parser: string,
	mode: Mode,
	file: string,
	timeout: number
): number | { outcome: 'timeout' | 'error'; error?: string } {
	const child = spawnSync(
		process.execPath,
		[join(here, 'worker.ts'), parser, mode, '--once', file],
		{ encoding: 'utf8', timeout, maxBuffer: 1 << 20 }
	);
	if (child.error && (child.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
		return { outcome: 'timeout' };
	}
	if (child.status !== 0) {
		const lines = child.stderr.trim().split('\n');
		const message = lines.find((l) => /^\w*Error\b/.test(l)) ?? lines.at(-1) ?? 'exited';
		return { outcome: 'error', error: message.slice(0, 200) };
	}
	return (JSON.parse(child.stdout) as { ms: number }).ms;
}

function environment(deep: boolean): Record<string, unknown> {
	const git = (...a: string[]) => execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim();
	const version = (name: string) =>
		(
			JSON.parse(readFileSync(join(here, 'node_modules', name, 'package.json'), 'utf8')) as {
				version: string;
			}
		).version;
	const bench = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8')) as {
		devDependencies: Record<string, string>;
	};
	const packages = Object.fromEntries(
		Object.keys(bench.devDependencies)
			.filter((name) => !['markz', 'vite-plus', 'typescript', '@types/node'].includes(name))
			.sort()
			.map((name) => [name, version(name)])
	);
	return {
		date: new Date().toISOString(),
		os: `${os.type()} ${os.release()}`,
		arch: os.arch(),
		cpu: os.cpus()[0]?.model ?? 'unknown',
		cores: os.availableParallelism(),
		memoryGB: Math.round(os.totalmem() / 2 ** 30),
		node: process.version,
		v8: process.versions.v8,
		...(deep
			? { hyperfine: execFileSync('hyperfine', ['--version'], { encoding: 'utf8' }).trim() }
			: {}),
		markz: {
			version: (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string })
				.version,
			commit: git('rev-parse', '--short', 'HEAD'),
			dirty: git('status', '--porcelain', '--', 'src').length > 0
		},
		packages
	};
}

/** @prose
 * ## Snapshot
 *
 * The site shows only a snapshot a commit checked in. It should come from a deep run on a quiet
 * machine, and it says when it didn't. The README's table of adapters is rewritten from the same
 * results, between its markers, so it lists what ran rather than what someone remembered.
 */
function snapshot() {
	if (!existsSync(LATEST)) throw new Error('no results yet: run `pnpm compare --deep` first');
	const latest = JSON.parse(readFileSync(LATEST, 'utf8')) as Results;
	if (!latest.settings.deep)
		console.warn('warning: not a deep run, so it has no cold start or pathological input');
	if ((latest.environment.markz as { dirty: boolean }).dirty) {
		console.warn('warning: these results were measured with uncommitted changes');
	}
	writeFileSync(PUBLISHED, JSON.stringify(latest, null, '\t') + '\n');
	const readme = readFileSync(README, 'utf8');
	const [before, rest] = readme.split('<!-- adapters -->');
	const [, after] = rest!.split('<!-- /adapters -->');
	writeFileSync(
		README,
		`${before}<!-- adapters -->\n\n${table(latest.adapters)}\n<!-- /adapters -->${after}`
	);
	execFileSync(join(root, 'node_modules/.bin/vp'), ['fmt', README], { cwd: root, stdio: 'ignore' });
	console.log(`published ${LATEST} to ${PUBLISHED}, and the adapters to ${README}`);
}

function table(adapters: Results['adapters']): string {
	const lines = [
		'| Parser | Structured parse | Common: configuration | Dialect: configuration | Dialect: reads beyond CommonMark |',
		'| --- | --- | --- | --- | --- |'
	];
	for (const [parser, a] of Object.entries(adapters)) {
		lines.push(
			`| ${parser} | ${a.common.representation ?? 'none'} | ${a.common.configuration} | ${a.dialect.configuration} | ${a.dialect.capabilities.join(', ')} |`
		);
	}
	return lines.join('\n') + '\n';
}

/** MB/s, marked when noisy, or `error` when the parser threw. */
function show(t?: { mbPerSecond: number | null; noisy?: boolean }): string {
	if (!t) return '—';
	return t.mbPerSecond === null ? 'error' : `${t.mbPerSecond.toFixed(1)}${t.noisy ? '?' : ''}`;
}

function log(message: string) {
	process.stderr.write(`· ${message}\n`);
}

/** The console summary, table by table, as the site shows it. */
function report(r: Results) {
	const parsers = Object.keys(r.adapters);
	const row = (cells: string[]) => console.log(cells.map((c, i) => c.padEnd(i ? 14 : 30)).join(''));
	console.log(
		`\n${String(r.environment.cpu)}, Node ${String(r.environment.node)}, corpus ${r.corpus.hash}`
	);
	for (const measure of MEASURES) {
		console.log(
			`\nMB/s warm, ${measure === 'html' ? 'parse + HTML' : 'structured parse'} (? marks passes spread over half the median)`
		);
		row(['', ...parsers]);
		for (const mode of MODES) {
			const keys = [
				...new Set(
					r.throughput
						.filter((t) => t.mode === mode && t.measure === measure)
						.map((t) => `${t.tier} ${t.name}`)
				)
			];
			for (const key of keys) {
				row([
					`${mode} ${key}`,
					...parsers.map((p) =>
						show(
							r.throughput.find(
								(t) =>
									t.mode === mode &&
									`${t.tier} ${t.name}` === key &&
									t.parser === p &&
									t.measure === measure
							)
						)
					)
				]);
			}
		}
	}
	console.log(
		`\nScaling, 100 KB to the largest: time per byte grew by (under ${LINEAR} is approximately linear)`
	);
	row(['', ...parsers]);
	row([
		'ratio',
		...parsers.map((p) => r.scaling.find((s) => s.parser === p)?.ratio.toFixed(2) ?? '—')
	]);
	console.log('\nMB/s warm, structured parse, one construct at a time (common mode)');
	const constructParsers = [...new Set(r.constructs.map((c) => c.parser))];
	row(['', ...constructParsers]);
	for (const construct of new Set(r.constructs.map((c) => c.construct))) {
		row([
			construct,
			...constructParsers.map((p) =>
				show(r.constructs.find((c) => c.construct === construct && c.parser === p))
			)
		]);
	}
	console.log('\nRetained memory after parse, bytes per source byte (10 KB document)');
	row(['', ...parsers]);
	for (const mode of MODES) {
		row([
			mode,
			...parsers.map((p) => {
				const m = r.memory.find((m) => m.mode === mode && m.parser === p);
				return m ? (m.retained / m.sourceBytes).toFixed(1) : '—';
			})
		]);
	}
	if (r.cold.length) {
		console.log('\nCold start, ms (a whole process reading the agent tier once)');
		row(['', 'none', ...parsers]);
		for (const mode of MODES) {
			row([
				mode,
				...['none', ...parsers].map(
					(p) => r.cold.find((c) => c.mode === mode && c.parser === p)?.ms.toFixed(0) ?? '—'
				)
			]);
		}
	}
	if (r.pathological.length) {
		console.log('\nPathological, ms at n and 4n (common mode, parse + HTML)');
		row(['', ...parsers]);
		for (const pattern of new Set(r.pathological.map((p) => p.pattern))) {
			row([
				pattern,
				...parsers.map((parser) => {
					const [a, b] = r.pathological.filter((p) => p.pattern === pattern && p.parser === parser);
					const one = (p?: Pathological) =>
						!p
							? '—'
							: p.outcome === 'ok'
								? p.ms!.toFixed(0)
								: p.outcome === 'timeout'
									? 'timeout'
									: 'error';
					return `${one(a)} → ${one(b)}`;
				})
			]);
		}
	}
	console.log('\nBundle size, parse + HTML entry, KB (minified · gzip · brotli)');
	for (const mode of MODES) {
		for (const p of parsers) {
			const s = r.size.find((s) => s.parser === p && s.mode === mode);
			if (!s) continue;
			const kb = (n: number) => (n / 1024).toFixed(1);
			const sizes = `${kb(s.minified)} · ${kb(s.gzip)} · ${kb(s.brotli)}`;
			console.log(`${`${mode} ${p}`.padEnd(30)}${sizes.padEnd(24)}${s.entry.join(', ')}`);
		}
	}
}
