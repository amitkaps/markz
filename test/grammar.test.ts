/** @prose
 * # The grammar, checked
 *
 * The grammar is well formed (every name defined, every production reachable from `document`,
 * every name used once) and it is `syntax.md`'s: the same constructs in the same order, under the
 * same parts, each opening with its origin's lead.
 */
import { describe, expect, it } from 'vite-plus/test';
import { references } from './ebnf';
import { CONSTRUCTS, DOCUMENT, LEADS, PRODUCTIONS, reachable } from './grammar';
import { anchor, anchors } from './syntax';

describe('productions', () => {
	it.each([...PRODUCTIONS.values()].map((p) => [p.name, p] as const))(
		'%s names only defined productions',
		(_, p) => {
			expect([...references(p.expr)].filter((name) => !PRODUCTIONS.has(name))).toEqual([]);
		}
	);

	it('are all reachable from document', () => {
		const seen = reachable();
		expect([...PRODUCTIONS.keys()].filter((name) => !seen.has(name))).toEqual([]);
	});

	it.each(CONSTRUCTS.map((c) => c.id))('%s is named by its first production', (id) => {
		const own = [...PRODUCTIONS.values()].filter((p) => p.construct === id);
		expect(own[0]?.name).toBe(id);
	});

	it('name each side rule once', () => {
		const names = [DOCUMENT, ...CONSTRUCTS].flatMap((c) => Object.keys(c.rules));
		expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
	});
});

describe('syntax.md', () => {
	it('has the same constructs, in the same order', () => {
		expect(anchors.map((a) => a.id)).toEqual(CONSTRUCTS.map((c) => c.id));
	});

	it.each(CONSTRUCTS)('$id is under $part and opens with its origin', (c) => {
		const a = anchor(c.id)!;
		expect(a.part).toBe(c.part);
		expect(a.lead.startsWith(`**${LEADS[c.origin]}`), a.lead).toBe(true);
	});
});
