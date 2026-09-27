/** @prose
 * # Benchmark results
 *
 * The published snapshot of `pnpm bench:full`, as the site reads it. `bench.json` is written only
 * by `pnpm bench:update-results` and checked in, so the numbers the site shows change only in a
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
	/** `null` when the parser threw on these documents; `error` says what. */
	ms: number | null;
	stddevMs: number;
	mbPerSecond: number | null;
	error?: string;
	/** The spread is over a quarter of the time: a rough number. */
	noisy: boolean;
}

export interface Bench {
	environment: {
		date: string;
		os: string;
		arch: string;
		cpu: string;
		node: string;
		hyperfine: string;
		markz: { version: string; commit: string; dirty: boolean };
		packages: Record<string, string>;
	};
	corpus: { hash: string };
	representations: Record<string, string | null>;
	features: Record<string, Record<Mode, string>>;
	throughput: Throughput[];
	cold: { mode: Mode; parser: string; ms: number; stddevMs: number }[];
	memory: {
		mode: Mode;
		parser: string;
		sourceBytes: number;
		retained: number;
		rss: number;
		gcCount: number;
		gcMs: number;
	}[];
	pathological: {
		pattern: string;
		parser: string;
		n: number;
		bytes: number;
		outcome: 'ok' | 'timeout' | 'error';
		ms: number | null;
		error?: string;
	}[];
	size: { parser: string; mode: Mode; minified: number; gzip: number; brotli: number }[];
}

const found = import.meta.glob<Bench>('./bench.json', { eager: true, import: 'default' });

/** The published snapshot, or `null` before the first one. */
export const bench: Bench | null = found['./bench.json'] ?? null;

export const PARSERS = bench ? Object.keys(bench.representations) : [];

/** The headline tiers, read whole, in the order the page shows them. */
export const TIERS: [tier: string, label: string][] = [
	['agent', 'Agent-written docs'],
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
