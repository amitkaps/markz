/** @prose
 * # The examples, checked
 *
 * Every example in `examples.ts`, whatever its source, must not fail. Around that, the filing is
 * held to `syntax.md`: every warning code is named there, each Not supported row's "Write instead"
 * is its code's, every construct and row has examples, the hand list names real examples, and
 * most upstream examples are still compared with the oracle, so a rule that swallowed a suite
 * would show.
 */
import { describe, expect, it } from 'vite-plus/test';
import { parse } from '../src/index';
import { check, examples, listed, type Example } from './examples';
import { WARNINGS } from '../src/warnings';
import { CONSTRUCTS } from './grammar';
import { named, rows } from './syntax';
import { expectTree } from './tree';

describe('warning codes', () => {
	it.each(Object.keys(WARNINGS))('%s is named in syntax.md', (code) => {
		expect(named(code)).toBe(true);
	});

	it.each(rows)('row $code writes instead what the code does', (r) => {
		expect(WARNINGS[r.code]?.[1]).toBe(r.instead);
	});
});

describe('filing', () => {
	it.each(CONSTRUCTS.map((c) => c.id))('construct %s has examples', (id) => {
		expect(examples.some((e) => e.section === id)).toBe(true);
	});

	it.each(rows.map((r) => r.code))('row %s has examples', (code) => {
		expect(examples.some((e) => e.section === code)).toBe(true);
	});

	it.each(Object.keys(listed))('%s is a real example', (id) => {
		expect(examples.some((e) => e.id === id)).toBe(true);
	});

	it('compares most upstream examples with the oracle', () => {
		const upstream = examples.filter((e) => e.source !== 'markz');
		const compared = upstream.filter((e) => e.kind === 'oracle');
		expect(compared.length).toBeGreaterThan(upstream.length * 0.4);
	});
});

const label = (e: Example) => `${e.id} ${e.part} › ${e.section} (${e.kind})`;

describe('examples', () => {
	it.each(examples.map((e) => [label(e), e] as const))('%s', (_, e) => {
		expectTree(parse(e.markdown));
		const result = check(e);
		expect(
			result.problem,
			result.problem ? `${result.markz}\n${result.oracle ?? e.html}` : ''
		).toBe(null);
	});
});
