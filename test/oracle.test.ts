/** @prose
 * The oracle checked before anything is held to it: against the spec's own HTML on every example
 * compared with it, and against `syntax.md`'s directive shapes, so a normalization or
 * configuration bug can't hide behind it. markz itself is checked in `examples.test.ts`.
 */
import { describe, expect, it } from 'vite-plus/test';
import { examples, oracleDiffers } from './examples';
import { normalize, reference } from './oracle';

describe('oracle', () => {
	it.each(examples.filter((e) => e.kind === 'oracle' && !oracleDiffers[e.id]))(
		'$id ($upstream) matches the spec',
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
