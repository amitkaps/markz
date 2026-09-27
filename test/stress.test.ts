/** @prose
 * # Stress
 *
 * The upstream examples curation leaves out, held only to what any input must satisfy: markz
 * finishes in well under a second, doesn't throw, and builds a valid tree. A bare URL GFM would
 * link, or a footnote it would read, must still be warned about, since that is the signal a
 * reader relies on. Generated and adversarial input is `fuzz.test.ts`'s and `complexity.test.ts`'s.
 */
import { describe, expect, it } from 'vite-plus/test';
import { parse } from '../src/index';
import { unwarned } from './examples';
import directive from './examples/upstream/stress/directive.md?raw';
import footnote from './examples/upstream/stress/gfm-footnote.md?raw';
import autolink from './examples/upstream/stress/gfm-autolink-literal.md?raw';
import yaml from './examples/upstream/stress/yaml.md?raw';
import { readFences } from './fences';
import { expectTree } from './tree';

const suites = { directive, 'gfm-autolink-literal': autolink, 'gfm-footnote': footnote, yaml };

describe.each(Object.entries(suites))('%s', (suite, text) => {
	const list = readFences(text).examples;
	it.each(list.map((e) => [`${suite}:${e.number} ${e.section}`, e.markdown] as const))(
		'%s',
		(_, markdown) => {
			const start = performance.now();
			const doc = parse(markdown);
			expect(performance.now() - start).toBeLessThan(500);
			expectTree(doc);
			// GitHub links more than micromark in places, so only a missed URL or footnote fails.
			expect(unwarned('bare-url', markdown, doc, true)).toBe(null);
			expect(unwarned('footnote', markdown, doc, true)).toBe(null);
		}
	);
});
