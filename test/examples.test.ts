/** @prose
 * # The examples, checked
 *
 * Every example in `examples.ts`, whatever its source, must not fail. Around that, the filing is
 * held to `syntax.md`: every construct and every Not supported row has examples, the hand list
 * names real examples, and most upstream examples are still compared with the oracle, so a rule
 * that swallowed a suite would show.
 */
import { describe, expect, it } from 'vite-plus/test';
import { parse } from '../src/index';
import { check, examples, listed, type Example } from './examples';
import { constructs, rows } from './syntax';
import { expectTree } from './tree';

describe('filing', () => {
	it.each(Object.values(constructs).flat())('construct %s has examples', (name) => {
		expect(examples.some((e) => e.section === name)).toBe(true);
	});

	it.each(rows.map((r) => r.syntax))('row %s has examples', (syntax) => {
		const matching = examples.filter(
			(e) => e.part === 'Not supported' && syntax.startsWith(e.section)
		);
		expect(matching.length).toBeGreaterThan(0);
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
