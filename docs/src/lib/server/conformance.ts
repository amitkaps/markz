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
import { parse } from 'markz';
import { check, examples } from '../../../../test/examples';
import { normalize } from '../../../../test/oracle';
import { title } from '../../../../test/syntax';
import type { Row } from '../site';

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
