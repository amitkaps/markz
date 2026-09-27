/** @prose
 * # Corpus
 *
 * The documents every parser reads, written to `corpus/` (gitignored) with a manifest and one
 * hash over all of them, so two runs can be compared only when they read the same text. The
 * tiers each answer their own question:
 *
 * - **agent**: markz's docs and those of the repos that consume it (base, prose, visdown), vendored
 *   in `fixtures/agent/`. All of it is written by coding agents, so it is one voice: long
 *   paragraphs, backticked names, tables. It is what markz reads day to day.
 * - **public**: human-written documentation in other styles, vendored in `fixtures/public/`:
 *   Node.js's API reference (dense links and code), the Rust book (narrative with listings) and
 *   Vite's guide (VitePress, with `:::` containers). This is the headline beside *agent*, so
 *   neither voice speaks for Markdown in general.
 * - **spec**: the CommonMark spec's own text, which commonmark.js and markdown-it benchmark on, so
 *   these numbers can be set beside theirs. It is dense with edge cases, not a typical document.
 * - **formatted**: the agent documents after oxfmt, which is how the consumers store them.
 * - **scaling**: the agent and public documents repeated to 10 KB, 100 KB, 1 MB and 10 MB, for
 *   the curve.
 * - **pathological**: adversarial patterns from the complexity tests, each at a size and four
 *   times it, to show how each parser scales on input built to hurt. They aren't a workload.
 *
 * Every document but a pathological one comes in two variants. *dialect* is the document as
 * written. *common* keeps only the top-level blocks every parser reads alike: markz's own tree
 * decides, dropping a block that holds a construct only markz's dialect has (metadata, comments,
 * directives, math, raw blocks, expressions, attributes, an explicit heading id), a task item or
 * a warning, which marks a form markz cuts and the others read. A pathological pattern has one
 * variant, shared by both modes.
 *
 * A profile decides how much of this is built (`Profile`): *full* is all of it, for `run.ts`;
 * *fast* is what `compare.bench.ts` times, the document tiers and sizes to 1 MB; and *smoke* is
 * the least that exercises every adapter.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse, walk, type Document, type NodeId } from 'markz';
import { PATTERNS } from '../test/fuzz/adversarial.ts';

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
const FIXTURES = join(here, 'fixtures');

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

	const agent = fixtures(join(FIXTURES, 'agent'));
	const published = fixtures(join(FIXTURES, 'public'));
	both('agent', agent);
	if (profile !== 'smoke') {
		both('public', published);
		both('spec', fixtures(join(FIXTURES, 'spec')));
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

/** The vendored documents under `dir`, named `<source>-<file>`, in a stable order. */
function fixtures(dir: string): Map<string, string> {
	const out = new Map<string, string>();
	for (const file of readdirSync(dir)) {
		if (file.endsWith('.md')) out.set(file, readFileSync(join(dir, file), 'utf8'));
	}
	for (const repo of readdirSync(dir, { withFileTypes: true })) {
		if (!repo.isDirectory()) continue;
		for (const file of readdirSync(join(dir, repo.name)).sort()) {
			if (file.endsWith('.md')) {
				out.set(`${repo.name}-${file}`, readFileSync(join(dir, repo.name, file), 'utf8'));
			}
		}
	}
	return new Map([...out].sort(([a], [b]) => a.localeCompare(b)));
}

/** The documents after oxfmt with the repo's settings, formatted in a scratch copy. */
function format(documents: Map<string, string>): Map<string, string> {
	const dir = mkdtempSync(join(tmpdir(), 'markz-bench-'));
	try {
		for (const [name, text] of documents) writeFileSync(join(dir, name), text);
		execFileSync(join(here, 'node_modules/.bin/vp'), ['fmt', dir], {
			cwd: join(here, '..'),
			stdio: 'ignore'
		});
		return new Map(
			[...documents.keys()].map((name) => [name, readFileSync(join(dir, name), 'utf8')])
		);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

/** @prose
 * ## The common variant
 *
 * A top-level block is kept when nothing in it is markz's alone or cut by markz. The kept blocks
 * are joined by blank lines, so each is still read as the block it was.
 */
const OWN = new Set(['metadata', 'comment', 'directive', 'math', 'raw', 'expression']);

export function common(text: string): string {
	const doc = parse(text);
	const kept: string[] = [];
	for (const block of doc.children(doc.root)) {
		const start = doc.start(block);
		const end = doc.end(block);
		const warned = doc.warnings.some((w) => w.start < end && w.end > start);
		if (!warned && shared(doc, block)) kept.push(text.slice(start, end));
	}
	return kept.join('\n\n') + '\n';
}

function shared(doc: Document, block: NodeId): boolean {
	let ok = true;
	walk(
		doc,
		{
			enter(node) {
				const type = doc.type(node);
				if (
					OWN.has(type) ||
					doc.attributes(node) ||
					(type === 'heading' && doc.data(node, 'heading').idExplicit) ||
					(type === 'listItem' && doc.data(node, 'listItem').checked !== null)
				) {
					ok = false;
				}
				return ok;
			}
		},
		block
	);
	return ok;
}

/** `text` repeated to `bytes` characters, cut at the end of a line. */
function repeat(text: string, bytes: number): string {
	let out = '';
	while (out.length < bytes) out += text + '\n\n';
	const cut = out.lastIndexOf('\n', bytes);
	return out.slice(0, cut > 0 ? cut + 1 : bytes);
}

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
