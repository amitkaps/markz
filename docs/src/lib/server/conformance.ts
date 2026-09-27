/** @prose
 * # Conformance data
 *
 * Every example markz is held to, with its status, computed at build time by the test harness's
 * own `check`: the same filing under `syntax.md` and the same comparison `pnpm test` makes. The
 * page is the test suite, browsable, and it can't disagree with the tests because it runs their
 * code.
 *
 * Each construct's edges come from the same search `constructs.test.ts` runs, from the same seed:
 * how many generated cases reached each edge, and why a construct has no ambiguous or unclosed
 * example where it can't.
 *
 * Server-only: it pulls in micromark and the vendored spec suites, which never reach the client.
 */
import { parse } from 'markz';
import { EDGES, edges } from '../../../../test/harness/cases';
import { check, examples } from '../../../../test/harness/examples';
import { search } from '../../../../test/harness/generate';
import { CONSTRUCTS } from '../../../../test/harness/grammar';
import { normalize } from '../../../../test/harness/oracle';
import { title } from '../../../../test/harness/syntax';
import type { Edges, Row } from '../site';

const ORACLE: Record<string, string> = {
	markz: 'markz',
	yaml: 'yaml',
	slugger: 'github-slugger',
	math: 'micromark-extension-math'
};

export function conformance(): Row[] {
	return examples.map((e) => {
		const r = check(e);
		const expected = r.oracle ?? e.html;
		const metadata = e.source === 'yaml' ? undefined : parse(e.markdown).metadata;
		return {
			source: e.source,
			id: e.id,
			number: e.number,
			part: e.part,
			section: e.section,
			title: title(e.section),
			upstream: e.upstream,
			kind: e.kind,
			category: e.category,
			rule: e.rule,
			markdown: e.markdown,
			status: r.status,
			detail: r.detail,
			oracle: ORACLE[e.source] ?? 'micromark',
			expected,
			markz: r.markz,
			metadata: metadata === undefined ? null : JSON.stringify(metadata, null, 1),
			normalized: r.status === 'fail' ? [normalize(expected), normalize(r.markz)] : null,
			codes: [...new Set(r.warnings.map((w) => w.code))],
			warnings: r.warnings.map(
				(w) =>
					`${e.markdown.slice(w.start, w.end).replace(/\n/g, '⏎')}: ${w.message}; write ${w.instead}`
			)
		};
	});
}

export function constructEdges(): Record<string, Edges> {
	const { runs, seed } = search(8);
	return Object.fromEntries(
		CONSTRUCTS.map(({ id }) => {
			const { unsettled, ...reached } = edges(id, runs, seed);
			return [id, { ...reached, unsettled: unsettled.length, none: EDGES[id] ?? {} }];
		})
	);
}
