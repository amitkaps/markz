/** @prose
 * # Stress
 *
 * The upstream examples curation leaves out, held only to what any input must satisfy: markz
 * finishes in well under a second, doesn't throw, and builds a valid tree. A bare URL GFM would
 * link, or a footnote it would read, must still be warned about, since that is the signal a
 * reader relies on. Plan step 16 adds
 * generated and adversarial input here.
 */
import { describe, expect, it } from 'vite-plus/test';
import { parse } from '../src/index';
import { unwarned } from './examples';
import directive from './stress/directive.json' with { type: 'json' };
import footnote from './stress/gfm-footnote.json' with { type: 'json' };
import autolink from './stress/gfm-autolink-literal.json' with { type: 'json' };
import yaml from './stress/yaml.json' with { type: 'json' };
import { expectTree } from './tree';

const suites = { directive, 'gfm-autolink-literal': autolink, 'gfm-footnote': footnote, yaml };

describe.each(Object.entries(suites))('%s', (suite, list) => {
	it.each(list.map((e) => [`${suite}:${e.example} ${e.section}`, e.markdown] as const))(
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
