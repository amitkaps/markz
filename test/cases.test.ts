/** @prose
 * # Cases by construct, checked
 *
 * Each construct at its edges. Its generated cases and their one-character neighbours must each
 * be read as the grammar reads them, or be settled by a named side rule or a Not supported row,
 * and between them they must reach all three generated edges: a valid case markz reads, a
 * boundary neighbour it still reads, and a near miss it doesn't. The two edges the grammar can't
 * write, ambiguous and unclosed, are hand-written dialect examples, and each construct has one of
 * each or says why it can't.
 *
 * `CASES_RUNS` and `CASES_SEED` search longer or elsewhere, as `FUZZ_RUNS` does for the fuzzer.
 */
import { describe, expect, it } from 'vite-plus/test';
import { WARNINGS } from '../src/warnings';
import {
	EDGES,
	EVERYWHERE,
	SETTLED,
	WARNED,
	constructIds,
	judge,
	neighbours,
	sideRules,
	valid
} from './cases';
import { examples } from './examples';
import { row } from './syntax';

const runs = Number(process.env.CASES_RUNS ?? 8);
const seed = Number(process.env.CASES_SEED ?? 20260927);
// A longer search needs longer than a minute: link and directive cases are the slowest to judge.
const timeout = Math.max(60_000, runs * 1000);

describe('edges', () => {
	it.each(constructIds)(
		'%s is read as the grammar reads it, or a side rule says why not',
		(id) => {
			const reached = { valid: 0, boundary: 0, 'near-miss': 0 };
			const unsettled: string[] = [];
			for (const s of valid(id, runs, seed)) {
				const v = judge(id, s);
				if (v.agree && v.accepted) reached.valid++;
				else if (!v.agree && !v.settled) unsettled.push(`valid ${JSON.stringify(s)}`);
				for (const n of neighbours(id, s)) {
					const w = judge(id, n);
					if (w.agree) reached[w.accepted ? 'boundary' : 'near-miss']++;
					else if (!w.settled) {
						const side = w.grammar ? 'grammar accepts' : 'markz reads';
						unsettled.push(`only ${side} ${JSON.stringify(n)}`);
					}
				}
			}
			expect(unsettled.slice(0, 10)).toEqual([]);
			expect(reached.valid, 'valid cases markz reads').toBeGreaterThan(0);
			expect(reached.boundary, 'boundary cases markz still reads').toBeGreaterThan(0);
			expect(reached['near-miss'], "near misses markz doesn't read").toBeGreaterThan(0);
		},
		timeout
	);
});

describe('hand-written edges', () => {
	const cases = (id: string, category: string) =>
		examples.filter((e) => e.section === id && e.category === category);

	it.each(constructIds.flatMap((id) => (['ambiguous', 'unclosed'] as const).map((c) => [id, c])))(
		'%s has %s examples, or says why it has none',
		(id, category) => {
			const reason = EDGES[id]?.[category as 'ambiguous' | 'unclosed'];
			if (reason) expect(cases(id, category), `${id} gives a reason and has examples`).toEqual([]);
			else expect(cases(id, category).length).toBeGreaterThan(0);
		}
	);

	it('name a real side rule for each ambiguous example', () => {
		const ambiguous = examples.filter((e) => e.category === 'ambiguous');
		expect(ambiguous.filter((e) => !e.rule || !sideRules.has(e.rule)).map((e) => e.id)).toEqual([]);
	});
});

describe('settling', () => {
	it('names only real side rules', () => {
		const names = [
			...Object.keys(EVERYWHERE),
			...Object.values(SETTLED).flatMap((rules) => Object.keys(rules)),
			...Object.values(WARNED)
		];
		expect(names.filter((n) => !sideRules.has(n))).toEqual([]);
	});

	it('maps every warning that is not a Not supported row to its side rule', () => {
		const construct = Object.keys(WARNINGS).filter((code) => !row(code));
		expect(construct.filter((code) => !WARNED[code])).toEqual([]);
	});
});
