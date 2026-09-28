/** @prose
 * # Size and speed
 *
 * What markz costs, measured on this commit's build while the site builds: to ship (the gzip the
 * size gate measures, against its budget), to hold (the tree for the CommonMark spec, beside its
 * source) and to run (parse + HTML on documents a reader can picture). The numbers come from the
 * build machine, so each is a range and the page names the machine. No other parser is here: the
 * page says what markz does, not how it ranks.
 *
 * Server-only, like the conformance data: it runs once, during the prerender.
 */
import { readdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { html, parse } from 'markz';
import { BUDGET, size } from '../../../../scripts/size';
import { documents } from '../../../../test/harness/corpus';
import { retained, time, warm } from '../../../../test/harness/speed';

// The build runs from `docs/`, and bundling moves this file, so the repo is found from there.
const root = join(process.cwd(), '..');
const DOCUMENTS = join(root, 'test/documents');
const WARM_MS = 1_000;
const BUDGET_MS = 200;

export interface Run {
	label: string;
	bytes: number;
	/** The middle half of the timed passes, in milliseconds. */
	low: number;
	high: number;
}

export interface Quality {
	size: { gzip: number; budget: number; held: number; source: number };
	speed: Run[];
	machine: string;
}

export async function quality(): Promise<Quality> {
	const docs = [
		...documents('agent', DOCUMENTS).values(),
		...documents('public', DOCUMENTS).values()
	].sort((a, b) => a.length - b.length);
	const typical = docs[docs.length >> 1]!;
	const site = [
		readFileSync(join(root, 'README.md'), 'utf8'),
		...readdirSync(join(root, 'prose'))
			.filter((f) => f.endsWith('.md'))
			.map((f) => readFileSync(join(root, 'prose', f), 'utf8'))
	];
	const spec = [...documents('spec', DOCUMENTS).values()][0]!;
	const runs: [string, string[]][] = [
		['A typical docs page', [typical]],
		["This site's pages, all of them", site],
		['The CommonMark spec', [spec]]
	];

	const run = (text: string) => html(parse(text));
	warm(run, [...docs, ...site, spec], WARM_MS);
	const speed = runs.map(([label, texts]) => {
		const t = time(run, texts, BUDGET_MS);
		return { label, bytes: texts.reduce((n, s) => n + s.length, 0), low: t.low, high: t.high };
	});
	return {
		size: {
			gzip: (await size(root)).gzip,
			budget: BUDGET,
			held: retained(parse, spec),
			source: spec.length
		},
		speed,
		machine: `${os.cpus()[0]?.model.trim() ?? os.arch()}, Node ${process.versions.node}`
	};
}
