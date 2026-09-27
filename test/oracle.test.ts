/** @prose
 * The oracles checked before anything is held to them: micromark against the suite's own HTML on
 * every example compared with it that has some, `yaml` against the yaml-test-suite's JSON or
 * `fail`, and against `syntax.md`'s directive shapes (the name as the element, and the label in
 * `<summary>`, `<figcaption>`, a custom element's `directive-label` or nowhere), so a normalization or
 * configuration bug can't hide behind it. markz itself is checked in `examples.test.ts`.
 */
import { describe, expect, it } from 'vite-plus/test';
import { examples, headingTexts, oracleDiffers } from './examples';
import { metadataOracle, normalize, reference, slugOracle } from './oracle';

describe('oracle', () => {
	it.each(
		examples.filter(
			(e) =>
				e.kind === 'oracle' &&
				e.checks !== 'yaml' &&
				e.checks !== 'slug' &&
				e.html &&
				!oracleDiffers[e.id]
		)
	)('$id ($upstream) matches the spec', (e) => {
		expect(normalize(reference(e.markdown))).toBe(normalize(e.html));
	});
});

describe('metadata oracle', () => {
	it.each(examples.filter((e) => e.checks === 'yaml' && e.html && !oracleDiffers[e.id]))(
		'$id ($upstream) matches the suite',
		(e) => {
			const oracle = metadataOracle(e.markdown.slice(4, -4));
			if (e.html === 'error') expect(oracle).toHaveProperty('error');
			else expect(oracle).toEqual({ value: JSON.parse(e.html) });
		}
	);
});

describe('slug oracle', () => {
	it.each(examples.filter((e) => e.checks === 'slug' && !oracleDiffers[e.id]))(
		'$id ($upstream) matches the suite',
		(e) => {
			expect(slugOracle(headingTexts(e.markdown)).at(-1)).toBe(e.html);
		}
	);
});

describe('oracle directive shape', () => {
	it.each([
		['hello :world at 10:30\n', '<p>hello :world at 10:30</p>'],
		[':span[x]{.y #z}\n', '<p><span class="y" id="z">x</span></p>'],
		['::chart-view\n', '<chart-view></chart-view>'],
		['H:sub[2]O and x:sup[2]{.big}\n', '<p>H<sub>2</sub>O and x<sup class="big">2</sup></p>'],
		[':abbr[HTML]{title="HyperText"}\n', '<p><abbr title="HyperText">HTML</abbr></p>'],
		[':::details[More]{open}\nx\n:::\n', '<details open><summary>More</summary><p>x</p></details>'],
		[':::figure[A chart]\nx\n:::\n', '<figure><figcaption>A chart</figcaption><p>x</p></figure>'],
		[':::section[Intro]\nx\n:::\n', '<section><p>x</p></section>'],
		[
			':::call-out[Warning]{.important}\nBody **here**.\n:::\n',
			'<call-out class="important"><div class="directive-label">Warning</div><p>Body <strong>here</strong>.</p></call-out>'
		]
	])('%j', (markdown, expected) => {
		expect(normalize(reference(markdown))).toBe(expected);
	});
});
