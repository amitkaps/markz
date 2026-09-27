/** @prose
 * # Benchmark results
 *
 * The published snapshot of `pnpm compare --deep`, as the site reads it. `bench.json` is written
 * only by `pnpm snapshot` and checked in, so the numbers the site shows change only in a
 * commit that means to change them. The shape is declared here rather than imported from
 * `bench/`, which would pull the benchmark's dependencies into the site's type check. These are
 * the fields the pages read. Until a snapshot is published there is none, and the pages say so
 * rather than failing the build.
 */

export type Mode = 'common' | 'dialect';
export type Measure = 'structured' | 'html';

export interface Throughput {
	mode: Mode;
	tier: string;
	name: string;
	bytes: number;
	parser: string;
	measure: Measure;
	/** One warm pass, the median; `null` when the parser threw, and `error` says what. */
	ms: number | null;
	/** The middle half of the passes' spread, as a fraction of the median; `null` after one pass. */
	noise: number | null;
	passes: number;
	mbPerSecond: number | null;
	error?: string;
	/** The middle half of the passes spread over half the median: a rough number. */
	noisy: boolean;
}

export interface Adapter {
	representation: string | null;
	configuration: string;
	capabilities: string[];
}

export interface Bench {
	settings: { deep: boolean; budgetMs: number; timeoutMs: number };
	environment: {
		date: string;
		os: string;
		arch: string;
		cpu: string;
		node: string;
		hyperfine?: string;
		markz: { version: string; commit: string; dirty: boolean };
		packages: Record<string, string>;
	};
	corpus: { hash: string };
	adapters: Record<string, Record<Mode, Adapter>>;
	throughput: Throughput[];
	constructs: {
		construct: string;
		origin: string;
		parser: string;
		bytes: number;
		mbPerSecond: number | null;
	}[];
	scaling: { parser: string; ratio: number; linear: boolean }[];
	memory: { mode: Mode; parser: string; sourceBytes: number; retained: number; rss: number }[];
	cold: { mode: Mode; parser: string; ms: number; stddevMs: number }[];
	pathological: {
		pattern: string;
		parser: string;
		n: number;
		bytes: number;
		outcome: 'ok' | 'timeout' | 'error';
		ms: number | null;
		error?: string;
	}[];
	size: {
		parser: string;
		mode: Mode;
		entry: string[];
		minified: number;
		gzip: number;
		brotli: number;
	}[];
}

const found = import.meta.glob<Bench>('./bench.json', { eager: true, import: 'default' });

/** The published snapshot, or `null` before the first one. */
export const bench: Bench | null = found['./bench.json'] ?? null;

export const PARSERS = bench ? Object.keys(bench.adapters) : [];

/** The headline tiers, read whole, in the order the page shows them. */
export const TIERS: [tier: string, label: string][] = [
	['agent', 'Agent-written docs (by coding agents, in real repos)'],
	['public', 'Public docs'],
	['spec', 'CommonMark spec'],
	['formatted', 'Agent docs after oxfmt']
];

export const throughput = (
	mode: Mode,
	measure: Measure,
	tier: string,
	name: string,
	parser: string
): Throughput | undefined =>
	bench?.throughput.find(
		(t) =>
			t.mode === mode &&
			t.measure === measure &&
			t.tier === tier &&
			t.name === name &&
			t.parser === parser
	);

export const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
