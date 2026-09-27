/** @prose
 * # Stress
 *
 * The upstream examples curation leaves out, held only to what any input must satisfy: markz
 * finishes in well under a second, doesn't throw, and builds a valid tree. A bare URL GFM would
 * link must still be warned about, since that is the signal a reader relies on. Plan step 15 adds
 * generated and adversarial input here.
 */
import { describe, expect, it } from 'vite-plus/test';
import { parse } from '../src/index';
import { unwarnedUrls } from './examples';
import autolink from './stress/gfm-autolink-literal.json' with { type: 'json' };
import yaml from './stress/yaml.json' with { type: 'json' };
import { expectTree } from './tree';

const suites = { 'gfm-autolink-literal': autolink, yaml };

describe.each(Object.entries(suites))('%s', (suite, list) => {
	it.each(list.map((e) => [`${suite}:${e.example} ${e.section}`, e.markdown] as const))(
		'%s',
		(_, markdown) => {
			const start = performance.now();
			const doc = parse(markdown);
			expect(performance.now() - start).toBeLessThan(500);
			expectTree(doc);
			// GitHub links more than micromark in places, so only a missed link fails.
			if (suite === 'gfm-autolink-literal') expect(unwarnedUrls(markdown, doc, true)).toBe(null);
		}
	);
});
