/** @prose
 * The differential harness (`prose/plan.md`, step 3). It checks three things:
 *
 * - the exclusion list itself: every key names a real section or example, and every reason
 *   resolves to `syntax.md`.
 * - the oracle, against the spec's own HTML on every included example, and against `syntax.md`'s
 *   directive shapes, so a normalization or configuration bug can't hide behind it.
 * - markz's `html()` against the oracle, section by section. `ready` lists the sections held to
 *   that; each step of the parser adds the ones it completes.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vite-plus/test';
import { html } from '../src/index';
import { all, excludedExamples, excludedSections, included, oracleDiffers } from './examples';
import { normalize, reference } from './oracle';

const ready = new Set<string>([]);

const syntax = readFileSync(new URL('../prose/syntax.md', import.meta.url), 'utf8');
// Between two known headings, since the samples in syntax.md contain `##` lines of their own.
const section = (from: string, to: string) =>
	syntax.split(`\n## ${from}\n`)[1]!.split(`\n## ${to}\n`)[0]!;
const notSupported = [
	...section('Not supported', 'Canonical form').matchAll(/^\| (.+?) +\|/gm)
].map((m) => m[1]!);
const withLimits = [
	...section('Supported, with limits', 'Not supported').matchAll(/^### (.+)$/gm)
].map((m) => m[1]!);

describe('exclusions', () => {
	it.each(Object.entries({ ...excludedSections, ...excludedExamples }))(
		'%s resolves to syntax.md (%s)',
		(key, reason) => {
			const [suite, rest] = key.split(':') as [string, string];
			const exists = all.some(
				(e) => e.suite === suite && (e.section === rest || String(e.example) === rest)
			);
			expect(exists, `${key} is not in the ${suite} suite`).toBe(true);
			const resolves =
				notSupported.some((row) => row.startsWith(reason)) || withLimits.includes(reason);
			expect(resolves, `"${reason}" is not a row or heading in syntax.md`).toBe(true);
		}
	);

	it('leaves most examples in', () => {
		expect(included.length).toBeGreaterThan(all.length / 2);
	});
});

describe('oracle', () => {
	it.each(included.filter((e) => !oracleDiffers[`${e.suite}:${e.example}`]))(
		'$suite $example ($section) matches the spec',
		(e) => {
			expect(normalize(reference(e.markdown))).toBe(normalize(e.html));
		}
	);
});

describe('oracle directive shape', () => {
	it.each([
		['hello :world at 10:30\n', '<p>hello :world at 10:30</p>'],
		[':span[x]{.y #z}\n', '<p><span class="span y" id="z">x</span></p>'],
		['::toc\n', '<div class="toc"></div>'],
		['H:sub[2]O and x:sup[2]{.big}\n', '<p>H<sub>2</sub>O and x<sup class="big">2</sup></p>'],
		[':abbr[HTML]{title="HyperText"}\n', '<p><abbr title="HyperText">HTML</abbr></p>'],
		['::mark\n', '<div class="mark"></div>'],
		[
			':::callout[Warning]{.important}\nBody **here**.\n:::\n',
			'<div class="callout important"><div class="directive-label">Warning</div><p>Body <strong>here</strong>.</p></div>'
		]
	])('%j', (markdown, expected) => {
		expect(normalize(reference(markdown))).toBe(expected);
	});
});

describe('markz', () => {
	const examples = included.filter((e) => ready.has(`${e.suite}:${e.section}`));
	if (examples.length === 0) it.todo('matches the oracle (sections are enabled from step 4)');
	else
		it.each(examples)('$suite $example ($section)', (e) => {
			expect(normalize(html(e.markdown))).toBe(normalize(reference(e.markdown)));
		});
});
