/** @prose
 * # Conformance data
 *
 * Every example markz is held to, with its status, computed at build time by the test harness's
 * own `check`: the same filing under `syntax.md` and the same comparison `pnpm test` makes. The
 * page is the test suite, browsable, and it can't disagree with the tests because it runs their
 * code.
 *
 * Server-only: it pulls in micromark and the vendored spec suites, which never reach the client.
 */
import { check, examples } from '../../../../test/examples';
import { normalize } from '../../../../test/oracle';
import type { Row } from '../site';

export function conformance(): Row[] {
	return examples.map((e) => {
		const r = check(e);
		const expected = r.oracle ?? e.html;
		return {
			source: e.source,
			id: e.id,
			number: e.number,
			part: e.part,
			section: e.section,
			upstream: e.upstream,
			kind: e.kind,
			markdown: e.markdown,
			status: r.status,
			problem: r.problem,
			expected,
			markz: r.markz,
			normalized: r.status === 'fail' ? [normalize(expected), normalize(r.markz)] : null,
			warnings: r.warnings.map(
				(w) =>
					`${e.markdown.slice(w.start, w.end).replace(/\n/g, '⏎')}: ${w.message}; write ${w.instead}`
			)
		};
	});
}
