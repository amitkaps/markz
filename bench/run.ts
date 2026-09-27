/** @prose
 * # The full benchmark
 *
 * `pnpm bench:full` builds markz and the whole corpus, measures every parser four ways, each in
 * its own processes, and writes `results/latest.json` with the environment it ran in. Hyperfine
 * times; this script only decides what to run and collects what comes back, printing each
 * group's numbers as they land. It takes the better part of an hour, and its results are the only
 * ones the site publishes. For a quick look, `pnpm bench` runs `compare.bench.ts` in Vitest.
 *
 * - **Throughput**: each mode, tier and measure is one Hyperfine run over every parser's command
 *   at `k` and `2k` passes. The difference is `k` warm passes with startup cancelled, so a small
 *   document isn't swamped by the 40-odd milliseconds Node takes to start.
 * - **Cold start**: each parser once over the agent tier, as a whole process, beside a process
 *   that loads nothing, which is what a CLI or a build step pays.
 * - **Memory**: `memory.ts` on the 100 KB document, per parser and mode.
 * - **Pathological**: each pattern at a size and four times it, run once in-process under a
 *   timeout, since Hyperfine can't stop a run that has gone quadratic.
 * - **Size**: `size.ts`.
 *
 * `--smoke` runs every adapter once, without Hyperfine, so CI knows they still work. `--update`
 * copies the latest full results to the site, which is how published numbers change: on purpose,
 * in a commit of their own.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { build, CORPUS, type Entry, type Manifest } from './corpus.ts';
import { load, PARSERS, type Measure, type Mode } from './parsers.ts';
import { sizes, type Size } from './size.ts';

const here = import.meta.dirname;
const root = join(here, '..');
const RESULTS = join(here, 'results');
const LATEST = join(RESULTS, 'latest.json');
const PUBLISHED = join(root, 'docs/src/lib/bench.json');
const MODES: Mode[] = ['common', 'dialect'];
const MEASURES: Measure[] = ['structured', 'html'];

export interface Settings {
	/**
	 * How long `k` passes should take, in milliseconds. It is set well above the noise in a process's
	 * startup, which is what the `2k` − `k` difference has to rise out of.
	 */
	targetMs: number;
	warmup: number;
	runs: number;
	/** How long a pathological run may take before it counts as a timeout. */
	timeoutMs: number;
}

const SETTINGS: Settings = { targetMs: 500, warmup: 1, runs: 5, timeoutMs: 10_000 };
/** From this size a slow parser takes tens of seconds a pass, so the runs drop to two, unwarmed. */
const LARGE_BYTES = 5_000_000;
const SMOKE_TIMEOUT_MS = 10_000;

export interface Throughput {
	mode: Mode;
	tier: string;
	/** `all` for a tier read whole, or the scaling size. */
	name: string;
	bytes: number;
	parser: string;
	measure: Measure;
	k: number;
	/**
	 * Warm time of one pass, from the fastest runs: `(min t(2k) − min t(k)) / k`. `null` when the
	 * parser threw, or when noise swamped the difference.
	 */
	ms: number | null;
	/** The two runs' spreads combined, per pass. */
	stddevMs: number;
	mbPerSecond: number | null;
	/** What the parser threw on these documents, when it did: a result, not a failure of the suite. */
	error?: string;
	/** When the spread is over a quarter of the time itself, which makes the number a rough one. */
	noisy: boolean;
}

export interface Cold {
	mode: Mode;
	parser: string;
	/** Median whole-process time, startup included. `none` is Node alone. */
	ms: number;
	stddevMs: number;
}

export interface Memory {
	mode: Mode;
	parser: string;
	sourceBytes: number;
	retained: number;
	rss: number;
	gcCount: number;
	gcMs: number;
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
	representations: Record<string, string | null>;
	features: Record<string, Record<Mode, string>>;
	throughput: Throughput[];
	cold: Cold[];
	memory: Memory[];
	pathological: Pathological[];
	size: Size[];
}

const args = new Set(process.argv.slice(2));

if (args.has('--update')) {
	if (!existsSync(LATEST)) throw new Error('no results yet: run `pnpm bench` first');
	const latest = JSON.parse(readFileSync(LATEST, 'utf8')) as Results;
	if ((latest.environment.markz as { dirty: boolean }).dirty) {
		console.warn('warning: these results were measured with uncommitted changes');
	}
	copyFileSync(LATEST, PUBLISHED);
	console.log(`published ${LATEST} to ${PUBLISHED}`);
} else if (args.has('--smoke')) {
	await smoke();
} else {
	await main();
}

/** @prose
 * ## Smoke
 *
 * Every adapter once, in this process: each parser's structured parse and HTML in both modes over
 * the agent tier, one memory probe and the size entries. It times nothing and writes no results,
 * so numbers from it can't be published.
 */
async function smoke() {
	execFileSync('pnpm', ['build'], { cwd: root, stdio: 'ignore' });
	const manifest = build('smoke');
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
	memory('markz', 'dialect', join(CORPUS, small!.file));
	const [pattern] = manifest.entries.filter((e) => e.tier === 'pathological');
	if (
		typeof run('markz', 'common', 'html', 1, join(CORPUS, pattern!.file), SMOKE_TIMEOUT_MS) !==
		'number'
	) {
		throw new Error('the pathological run failed');
	}
	await sizes(PARSERS);
	console.log(`smoke: ${PARSERS.length} parsers, both modes, every measure`);
}

async function main() {
	const settings = SETTINGS;
	if (spawnSync('hyperfine', ['--version']).status !== 0) {
		throw new Error(
			'hyperfine is not on the PATH: `mise install` installs the version mise.toml pins'
		);
	}
	execFileSync('pnpm', ['build'], { cwd: root, stdio: 'ignore' });
	const manifest = build('full');
	const only = [...args]
		.find((a) => a.startsWith('--only='))
		?.slice(7)
		.split(',');
	const parsers = only ?? PARSERS;

	const results: Results = {
		settings,
		environment: environment(),
		corpus: { hash: manifest.hash },
		representations: {},
		features: {},
		throughput: [],
		cold: [],
		memory: [],
		pathological: [],
		size: []
	};
	for (const parser of parsers) {
		const common = await load(parser, 'common');
		const dialect = await load(parser, 'dialect');
		results.representations[parser] = common.representation;
		results.features[parser] = { common: common.features, dialect: dialect.features };
	}

	for (const mode of MODES) {
		for (const target of targets(manifest, mode)) {
			for (const measure of MEASURES) {
				// Scaling is the curve the site draws: parse + HTML, common mode.
				if (target.tier === 'scaling' && (mode !== 'common' || measure !== 'html')) continue;
				const who = parsers.filter((p) => measure === 'html' || results.representations[p]);
				const group = time(who, mode, measure, target, settings);
				results.throughput.push(...group);
				log(
					`${mode} ${target.tier} ${target.name}, ${measure}: ` +
						group.map((t) => `${t.parser} ${show(t)}`).join(', ') +
						' MB/s'
				);
			}
		}
		const starts = cold(parsers, mode, join(CORPUS, 'agent', mode), settings);
		results.cold.push(...starts);
		log(`${mode} cold start: ${starts.map((c) => `${c.parser} ${c.ms.toFixed(0)}`).join(', ')} ms`);
		for (const parser of parsers) {
			if (!results.representations[parser]) continue;
			const file = manifest.entries.find(
				(e) => e.tier === 'scaling' && e.variant === mode && e.name === '100 KB'
			)!;
			const m = { mode, parser, ...memory(parser, mode, join(CORPUS, file.file)) };
			results.memory.push(m);
			log(
				`${mode} memory ${parser}: ${(m.retained / m.sourceBytes).toFixed(1)} bytes per source byte`
			);
		}
	}

	for (const entry of manifest.entries.filter((e) => e.tier === 'pathological')) {
		for (const parser of parsers) {
			const p = pathological(parser, entry, settings.timeoutMs);
			results.pathological.push(p);
			log(
				`pathological ${entry.name} at ${entry.n}, ${parser}: ${p.outcome === 'ok' ? `${p.ms!.toFixed(0)} ms` : p.outcome}`
			);
		}
	}

	log('size');
	results.size = await sizes(parsers);

	mkdirSync(RESULTS, { recursive: true });
	writeFileSync(LATEST, JSON.stringify(results, null, '\t') + '\n');
	report(results, settings);
	console.log(`\nwrote ${LATEST}`);
}

interface Target {
	tier: string;
	name: string;
	/** The file or directory the command reads. */
	path: string;
	bytes: number;
}

/** Each document tier read whole, and each scaling size on its own. */
function targets(manifest: Manifest, mode: Mode): Target[] {
	const variant = mode;
	const out: Target[] = [];
	for (const tier of ['agent', 'public', 'spec', 'formatted']) {
		const entries = manifest.entries.filter((e) => e.tier === tier && e.variant === variant);
		if (!entries.length) continue;
		out.push({
			tier,
			name: 'all',
			path: join(CORPUS, tier, variant),
			bytes: entries.reduce((sum, e) => sum + e.bytes, 0)
		});
	}
	for (const e of manifest.entries.filter((e) => e.tier === 'scaling' && e.variant === variant)) {
		out.push({ tier: 'scaling', name: e.name, path: join(CORPUS, e.file), bytes: e.bytes });
	}
	return out;
}

function cli(parser: string, mode: Mode, measure: Measure, k: number, path: string): string {
	return `${process.execPath} ${join(here, 'cli.ts')} ${parser} ${mode} ${measure} ${k} ${path}`;
}

/** @prose
 * ## Timing a group
 *
 * One Hyperfine invocation per group, every parser at `k` and `2k`, so they share the machine's
 * state as closely as separate processes can. `-N` runs each command without a shell, which
 * would otherwise add its own startup to every run.
 *
 * Each side of the difference is its fastest run, not its median. Interference from the rest of the
 * machine only ever adds time, so the fastest run is the closest to the parser's own; the spread
 * is still reported, and marks a number as rough. A difference that comes out at or below zero is
 * recorded as unmeasurable, not as a speed.
 *
 * `k` is each parser's own, calibrated from one pass timed in-process, so that `k` passes take
 * about `targetMs` however fast the parser is. A fixed `k` leaves a fast parser's passes lost in
 * startup noise, where the difference can even come out negative.
 */
function time(
	parsers: string[],
	mode: Mode,
	measure: Measure,
	target: Target,
	settings: Settings
): Throughput[] {
	const ks = new Map<string, number>();
	const errors = new Map<string, string>();
	const commands: string[] = [];
	for (const parser of parsers) {
		const probe = run(parser, mode, measure, 1, target.path, 120_000);
		if (typeof probe !== 'number') {
			errors.set(parser, probe.error ?? probe.outcome);
			continue;
		}
		const k = Math.max(1, Math.round(settings.targetMs / probe));
		ks.set(parser, k);
		commands.push('-n', `${parser} ${k}`, cli(parser, mode, measure, k, target.path));
		commands.push('-n', `${parser} ${2 * k}`, cli(parser, mode, measure, 2 * k, target.path));
	}
	const large = target.bytes >= LARGE_BYTES;
	const results = hyperfine(commands, large ? 0 : settings.warmup, large ? 2 : settings.runs);
	const at = { mode, tier: target.tier, name: target.name, bytes: target.bytes, measure };
	return parsers.map((parser) => {
		const error = errors.get(parser);
		if (error !== undefined) {
			return { ...at, parser, k: 0, ms: null, stddevMs: 0, mbPerSecond: null, error, noisy: false };
		}
		const k = ks.get(parser)!;
		const one = results.get(`${parser} ${k}`)!;
		const two = results.get(`${parser} ${2 * k}`)!;
		const ms = ((two.min - one.min) / k) * 1000;
		const stddevMs = (Math.hypot(one.stddev, two.stddev) / k) * 1000;
		if (ms <= 0) {
			const error = 'unmeasurable: the machine was too noisy for the difference to show';
			return { ...at, parser, k, ms: null, stddevMs, mbPerSecond: null, error, noisy: true };
		}
		return {
			mode,
			tier: target.tier,
			name: target.name,
			bytes: target.bytes,
			parser,
			measure,
			k,
			ms,
			stddevMs,
			mbPerSecond: target.bytes / 1e6 / (ms / 1000),
			noisy: ms <= 0 || stddevMs > ms / 4
		};
	});
}

function cold(parsers: string[], mode: Mode, path: string, settings: Settings): Cold[] {
	const commands = ['-n', 'none', cli('none', mode, 'html', 1, path)];
	for (const parser of parsers) commands.push('-n', parser, cli(parser, mode, 'html', 1, path));
	const results = hyperfine(commands, settings.warmup, settings.runs * 2);
	return ['none', ...parsers].map((parser) => {
		const r = results.get(parser)!;
		return { mode, parser, ms: r.median * 1000, stddevMs: r.stddev * 1000 };
	});
}

interface Timing {
	min: number;
	median: number;
	stddev: number;
}

function hyperfine(commands: string[], warmup: number, runs: number): Map<string, Timing> {
	const file = join(RESULTS, '.hyperfine.json');
	mkdirSync(RESULTS, { recursive: true });
	execFileSync(
		'hyperfine',
		[
			'-N',
			'--warmup',
			String(warmup),
			'--runs',
			String(runs),
			'--export-json',
			file,
			'--style',
			'none',
			...commands
		],
		{ stdio: 'ignore' }
	);
	const json = JSON.parse(readFileSync(file, 'utf8')) as {
		results: { command: string; min: number; median: number; stddev: number | null }[];
	};
	rmSync(file);
	return new Map(
		json.results.map((r) => [r.command, { min: r.min, median: r.median, stddev: r.stddev ?? 0 }])
	);
}

function memory(parser: string, mode: Mode, file: string): Omit<Memory, 'mode' | 'parser'> {
	const out = execFileSync(
		process.execPath,
		['--expose-gc', join(here, 'memory.ts'), parser, mode, file],
		{
			encoding: 'utf8'
		}
	);
	return JSON.parse(out) as Omit<Memory, 'mode' | 'parser'>;
}

/** @prose
 * ## Pathological input
 *
 * Every parser at its defaults (the common mode), rendering to HTML, since that is what all of
 * them do. A run past the timeout is recorded as a timeout, and a crash (a stack overflow on deep
 * nesting, say) as an error with its message. Both are results, not failures of the suite.
 */
function pathological(parser: string, entry: Entry, timeoutMs: number): Pathological {
	const result = run(parser, 'common', 'html', 1, join(CORPUS, entry.file), timeoutMs);
	const base = { pattern: entry.name, parser, n: entry.n!, bytes: entry.bytes };
	if (typeof result === 'number') return { ...base, outcome: 'ok', ms: result };
	return { ...base, ...result, ms: null };
}

/** One process, its own in-process time, or why it didn't finish. */
function run(
	parser: string,
	mode: Mode,
	measure: Measure,
	k: number,
	path: string,
	timeout: number
): number | { outcome: 'timeout' | 'error'; error?: string } {
	const child = spawnSync(
		process.execPath,
		[join(here, 'cli.ts'), parser, mode, measure, String(k), path],
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

function environment(): Record<string, unknown> {
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
		hyperfine: execFileSync('hyperfine', ['--version'], { encoding: 'utf8' }).trim(),
		markz: {
			version: (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string })
				.version,
			commit: git('rev-parse', '--short', 'HEAD'),
			dirty: git('status', '--porcelain', '--', 'src').length > 0
		},
		packages
	};
}

/** MB/s, marked when noisy, or `error` when the parser threw. */
function show(t: Throughput): string {
	return t.mbPerSecond === null ? 'error' : `${t.mbPerSecond.toFixed(1)}${t.noisy ? '?' : ''}`;
}

function log(message: string) {
	process.stderr.write(`· ${message}\n`);
}

/** The console summary: MB/s per parser for the headline and scaling tiers, then the rest. */
function report(r: Results, settings: Settings) {
	const parsers = Object.keys(r.representations);
	const pad = (s: string, n: number) => s.padEnd(n);
	const row = (cells: string[]) => console.log(cells.map((c, i) => pad(c, i ? 14 : 34)).join(''));
	console.log(
		`\n${String(r.environment.cpu)}, Node ${String(r.environment.node)}, corpus ${r.corpus.hash}`
	);
	for (const measure of MEASURES) {
		console.log(
			`\nMB/s, ${measure === 'html' ? 'parse + HTML' : 'structured parse'} (? marks a spread over a quarter of the time)`
		);
		row(['', ...parsers]);
		for (const mode of MODES) {
			const keys = [
				...new Set(r.throughput.filter((t) => t.mode === mode).map((t) => `${t.tier} ${t.name}`))
			];
			for (const key of keys) {
				row([
					`${mode} ${key}`,
					...parsers.map((p) => {
						const t = r.throughput.find(
							(t) =>
								t.mode === mode &&
								`${t.tier} ${t.name}` === key &&
								t.parser === p &&
								t.measure === measure
						);
						return t ? show(t) : '—';
					})
				]);
			}
		}
	}
	if (r.cold.length) {
		console.log('\nCold start, ms (the agent tier, whole process)');
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
	console.log('\nRetained heap per document, bytes per source byte');
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
	console.log('\nPathological, ms at n and 4n (common mode, parse + HTML)');
	row(['', ...parsers]);
	for (const pattern of new Set(r.pathological.map((p) => p.pattern))) {
		row([
			pattern,
			...parsers.map((parser) => {
				const [a, b] = r.pathological.filter((p) => p.pattern === pattern && p.parser === parser);
				const show = (p?: Pathological) =>
					!p
						? '—'
						: p.outcome === 'ok'
							? p.ms!.toFixed(0)
							: p.outcome === 'timeout'
								? `>${settings.timeoutMs / 1000}s`
								: 'error';
				return `${show(a)} → ${show(b)}`;
			})
		]);
	}
	console.log('\nBundle, parse + HTML, KB gzip');
	row(['', ...parsers]);
	for (const mode of MODES) {
		row([
			mode,
			...parsers.map((p) => {
				const s = r.size.find((s) => s.parser === p && s.mode === mode);
				return s ? (s.gzip / 1024).toFixed(1) : '—';
			})
		]);
	}
}
