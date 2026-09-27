/** @prose
 * # Corpus
 *
 * The documents every parser reads, written to `corpus/` (gitignored) with a manifest and one
 * hash over all of them, so two runs can be compared only when they read the same text. The
 * documents, their tiers and their variants are the test harness's (`test/harness/corpus.ts`),
 * so the benchmark times the same documents `documents.test.ts` holds markz to. Here they are
 * read with the built package, and two tiers are added for timing alone:
 *
 * - **formatted**: the agent documents after oxfmt, which is how the consumers store them.
 * - **scaling**: the agent and public documents repeated to 10 KB, 100 KB, 1 MB and 10 MB, for
 *   the curve.
 * - **pathological**: adversarial patterns from the complexity tests, each at a size and four
 *   times it, to show how each parser scales on input built to hurt. They aren't a workload.
 *
 * Every document but a pathological one comes in two variants, _dialect_ and _common_. A
 * pathological pattern has one, shared by both modes.
 *
 * A profile decides how much of this is built (`Profile`): *full* is all of it, for `run.ts`;
 * *fast* is what `compare.bench.ts` times, the document tiers and sizes to 1 MB; and *smoke* is
 * the least that exercises every adapter.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'markz';
import { PATTERNS } from '../test/harness/adversarial.ts';
import { documents, format, repeat, common as commonOf } from '../test/harness/corpus.ts';

export type Tier = 'agent' | 'public' | 'spec' | 'formatted' | 'scaling' | 'pathological';
export type Profile = 'smoke' | 'fast' | 'full';
export type Variant = 'common' | 'dialect';

export interface Entry {
	tier: Tier;
	/** Absent for a pathological pattern, which both modes read. */
	variant?: Variant;
	name: string;
	/** Relative to `corpus/`. */
	file: string;
	bytes: number;
	/** A pathological pattern's count. */
	n?: number;
}

export interface Manifest {
	hash: string;
	entries: Entry[];
}

const here = import.meta.dirname;
export const CORPUS = join(here, 'corpus');

export const SIZES: [string, number][] = [
	['10 KB', 10_000],
	['100 KB', 100_000],
	['1 MB', 1_000_000],
	['10 MB', 10_000_000]
];

/** @prose
 * ## Pathological patterns
 *
 * The complexity tests' patterns that mean something to every parser: unclosed openers, nesting
 * and long repeats in CommonMark and GFM. markz's own (`${`, `:span[`, `{…}` lines) are only
 * text to the others, so they'd show nothing. Each is sized to about 20 KB and then four times
 * that.
 */
export const PATHOLOGICAL = [
	'unclosed code',
	'unclosed link',
	'unclosed destination',
	'unclosed image',
	'unclosed inline comment',
	'unclosed autolink',
	'emphasis openers',
	'strikethrough openers',
	'nested emphasis',
	'nested brackets',
	'links in links',
	'nested blockquotes',
	'nested list items',
	'continuation of nested items',
	'table rows',
	'wide table',
	'reference definitions'
];
const PATHOLOGICAL_BYTES = 20_000;

export function build(profile: Profile): Manifest {
	rmSync(CORPUS, { recursive: true, force: true });
	const entries: Entry[] = [];
	const write = (entry: Omit<Entry, 'bytes'>, text: string) => {
		const path = join(CORPUS, entry.file);
		mkdirSync(join(path, '..'), { recursive: true });
		writeFileSync(path, text);
		entries.push({ ...entry, bytes: Buffer.byteLength(text) });
	};
	const both = (tier: Tier, documents: Map<string, string>) => {
		for (const [name, text] of documents) {
			for (const variant of ['dialect', 'common'] as const) {
				const out = variant === 'common' ? common(text) : text;
				write({ tier, variant, name, file: `${tier}/${variant}/${name}` }, out);
			}
		}
	};

	const agent = documents('agent');
	const published = documents('public');
	both('agent', agent);
	if (profile !== 'smoke') {
		both('public', published);
		both('spec', documents('spec'));
	}
	if (profile === 'full') both('formatted', format(agent));

	const sizes =
		profile === 'smoke' ? SIZES.slice(0, 1) : profile === 'fast' ? SIZES.slice(0, 3) : SIZES;
	for (const variant of ['dialect', 'common'] as const) {
		const mix = [...agent.values(), ...published.values()]
			.map((t) => (variant === 'common' ? common(t) : t))
			.join('\n\n');
		for (const [name, bytes] of sizes) {
			write(
				{ tier: 'scaling', variant, name, file: `scaling/${variant}/${bytes}.md` },
				repeat(mix, bytes)
			);
		}
	}

	const patterns =
		profile === 'smoke' ? PATHOLOGICAL.slice(0, 1) : profile === 'fast' ? [] : PATHOLOGICAL;
	for (const name of patterns) {
		const make = PATTERNS[name]!;
		const n = Math.round((PATHOLOGICAL_BYTES * 100) / make(100).length);
		for (const count of [n, 4 * n]) {
			const slug = name.replaceAll(' ', '-');
			write(
				{ tier: 'pathological', name, n: count, file: `pathological/${slug}-${count}.md` },
				make(count)
			);
		}
	}

	const manifest = { hash: hash(entries), entries };
	writeFileSync(join(CORPUS, 'manifest.json'), JSON.stringify(manifest, null, '\t'));
	return manifest;
}

export function manifest(): Manifest {
	return JSON.parse(readFileSync(join(CORPUS, 'manifest.json'), 'utf8')) as Manifest;
}

/** The common variant of `text`, read by the built package. */
const common = (text: string) => commonOf(parse(text));

function hash(entries: Entry[]): string {
	const h = createHash('sha256');
	for (const e of [...entries].sort((a, b) => a.file.localeCompare(b.file))) {
		h.update(e.file)
			.update('\0')
			.update(readFileSync(join(CORPUS, e.file)))
			.update('\0');
	}
	return h.digest('hex').slice(0, 16);
}

export const path = (entry: Entry) => join(CORPUS, entry.file);
