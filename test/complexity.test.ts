/** @prose
 * # Complexity
 *
 * markz is linear in its input, and these tests hold it there. Each adversarial pattern is
 * parsed and rendered at a size and at four times that size, and the larger must take less than
 * eight times as long: linear work takes about four, and quadratic work sixteen, so the check
 * sits between them with room for a noisy machine. Each size is timed at its best of three after
 * a warm-up, so a garbage collection or a cold JIT doesn't decide it, and a few milliseconds of
 * slack keeps a fast pattern from failing on timer noise alone.
 *
 * A multi-megabyte document of every construct guards the ordinary path the same way.
 */
import { describe, expect, it } from 'vite-plus/test';
import { html, parse } from '../src/index';
import { examples } from './examples';
import { PATTERNS } from './fuzz/adversarial';

const time = (input: string): number => {
	let best = Infinity;
	for (let i = 0; i < 3; i++) {
		const start = performance.now();
		html(parse(input));
		best = Math.min(best, performance.now() - start);
	}
	return best;
};

/** How much longer four times the input may take. */
const RATIO = 8;
const SLACK_MS = 10;

function expectLinear(make: (n: number) => string, n: number): void {
	time(make(n));
	const small = time(make(n));
	const large = time(make(4 * n));
	expect(large, `${small.toFixed(1)} ms, then ${large.toFixed(1)} ms`).toBeLessThan(
		RATIO * small + SLACK_MS
	);
}

describe('adversarial input', () => {
	it.each(Object.entries(PATTERNS))('%s', (_, make) => expectLinear(make, 2000), 30_000);
});

describe('a large document', () => {
	const all = examples.map((e) => e.markdown).join('\n\n');
	const document = (n: number) => {
		let out = '';
		while (out.length < n) out += all;
		return out.slice(0, n);
	};

	it('stays linear to megabytes', () => expectLinear(document, 1_000_000), 60_000);
});
