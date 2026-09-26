/** @prose
 * # Conformance report
 *
 * `pnpm report` writes `report/conformance.html`: every spec example with its status against the
 * oracle, what markz and micromark each wrote, and the diagnostics. It is the test suite's
 * differential half as a page to browse, rather than a pass/fail line in a terminal. The page is
 * self-contained (the data is inlined), so it opens from disk or publishes as it is.
 *
 * The statuses are the oracle test's own: an excluded example carries its `syntax.md` reason, an
 * example with inline syntax is pending until the inline pass, and the rest pass or fail on the
 * same normalized comparison `pnpm test` makes. The test helpers are TypeScript with extensionless
 * imports, so they load through Vite's module runner.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite-plus';

type Examples = typeof import('../test/examples');
type Oracle = typeof import('../test/oracle');
type Markz = typeof import('../src/index');

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const load = async <T>(p: string) =>
	(await runnerImport<T>(path(p), { configFile: false, logLevel: 'silent' })).module;

const { all, blockOnly, exclusion } = await load<Examples>('../test/examples.ts');
const { normalize, reference } = await load<Oracle>('../test/oracle.ts');
const { html, parse } = await load<Markz>('../src/index.ts');

const rows = all.map((e) => {
	const oracle = reference(e.markdown);
	let markz: string;
	let error = false;
	try {
		markz = html(e.markdown);
	} catch (err) {
		markz = String(err);
		error = true;
	}
	const reason = exclusion(e);
	const status = reason
		? 'excluded'
		: !blockOnly(e)
			? 'pending'
			: !error && normalize(markz) === normalize(oracle)
				? 'pass'
				: 'fail';
	const diagnostics = error
		? []
		: parse(e.markdown).diagnostics.map(
				(d) => `${d.start}–${d.end} ${d.message}; write ${d.instead}`
			);
	return {
		suite: e.suite,
		example: e.example,
		section: e.section,
		markdown: e.markdown,
		status,
		reason: reason ?? null,
		oracle,
		markz,
		normalized: status === 'fail' ? [normalize(oracle), normalize(markz)] : null,
		diagnostics
	};
});

const commit = (() => {
	try {
		return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
	} catch {
		return null;
	}
})();

// `<` can't close the script tag, and U+FFFD (which one example writes for `&#0;`) stays an escape
// so a stray replacement character in the page always means a real encoding bug.
const data = JSON.stringify({ generated: new Date().toISOString(), commit, rows })
	.replace(/</g, '\\u003c')
	.replace(/\uFFFD/g, '\\ufffd');
const page = readFileSync(path('./report.html'), 'utf8').replace('"__DATA__"', () => data);
mkdirSync(path('../report'), { recursive: true });
writeFileSync(path('../report/conformance.html'), page);

const count = (s: string) => rows.filter((r) => r.status === s).length;
console.log(
	`report/conformance.html: ${count('pass')} pass, ${count('fail')} fail, ${count('pending')} pending, ${count('excluded')} excluded`
);
