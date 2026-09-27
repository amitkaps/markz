/** @prose
 * # The examples, checked
 *
 * Every example in `examples.ts`, whatever its source, must not fail. Around that, the filing is
 * held to `syntax.md`: every warning code is named there, each Not supported row's "Write instead"
 * is its code's, every construct and row has examples, the hand list names real examples, and
 * most upstream examples are still compared with the oracle, so a rule that swallowed a suite
 * would show. markz's own examples each have their own number. Each vendored file is exactly what `fences.ts` writes, so an edit by hand shows.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';
import { parse } from '../src/index';
import { check, examples, listed, type Example } from './examples';
import { readFences, writeFences } from './fences';
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

	it("numbers markz's own examples once each", () => {
		const numbers = examples.filter((e) => e.source === 'markz').map((e) => e.number);
		expect(numbers.length).toBe(new Set(numbers).size);
	});

	it('compares most upstream examples with the oracle', () => {
		const upstream = examples.filter((e) => e.source !== 'markz');
		const compared = upstream.filter((e) => e.kind === 'oracle');
		expect(compared.length).toBeGreaterThan(upstream.length * 0.4);
	});
});

describe('upstream files', () => {
	const dir = join(import.meta.dirname, 'examples/upstream');
	const files = ['', 'stress/'].flatMap((sub) =>
		readdirSync(join(dir, sub))
			.filter((f) => f.endsWith('.md') && f !== 'README.md')
			.map((f) => sub + f)
	);
	it.each(files)('%s is as fences.ts writes it', (file) => {
		const text = readFileSync(join(dir, file), 'utf8');
		const { title, meta, examples: fences } = readFences(text);
		expect(writeFences(title, meta, fences)).toBe(text);
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
