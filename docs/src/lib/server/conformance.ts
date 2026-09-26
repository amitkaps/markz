/** @prose
 * # Conformance data
 *
 * Every CommonMark and GFM spec example with its status against the oracle, computed at build
 * time from the library's own test harness: the same exclusions, the same block-only filter and
 * the same normalized comparison `pnpm test` makes. The page is the test suite's differential
 * half, browsable, and it can't disagree with the tests because it runs their code.
 *
 * Server-only: it pulls in micromark and the vendored spec suites, which never reach the client.
 */
import { html, parse } from 'markz';
import { all, blockOnly, exclusion } from '../../../../test/examples';
import { normalize, reference } from '../../../../test/oracle';
import type { Row, Status } from '../site';

export function conformance(): Row[] {
	return all.map((e) => {
		const oracle = reference(e.markdown);
		let markz: string;
		let threw = false;
		try {
			markz = html(e.markdown);
		} catch (error) {
			markz = String(error);
			threw = true;
		}
		const reason = exclusion(e) ?? null;
		const status: Status = reason
			? 'excluded'
			: !blockOnly(e)
				? 'pending'
				: !threw && normalize(markz) === normalize(oracle)
					? 'pass'
					: 'fail';
		return {
			suite: e.suite,
			example: e.example,
			section: e.section,
			markdown: e.markdown,
			status,
			reason,
			oracle,
			markz,
			normalized: status === 'fail' ? [normalize(oracle), normalize(markz)] : null,
			diagnostics: threw
				? []
				: parse(e.markdown).diagnostics.map(
						(d) => `${d.start}–${d.end}: ${d.message}; write ${d.instead}`
					)
		};
	});
}
