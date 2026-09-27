/** @prose
 * Computes the conformance rows and each construct's edges at build time. The page is prerendered, so micromark and the
 * spec suites run once, during the build, and never on the Worker. The performance and size cards
 * get a summary of the published benchmark, not the snapshot itself, which the page would
 * otherwise ship to the browser.
 */
import { bench, PARSERS, throughput, type Bench } from '#lib/bench.ts';
import { conformance, constructEdges } from '#lib/server/conformance.ts';
import type { PageServerLoad } from './$types';

/** Parse + HTML in the common mode, on the two headline tiers: markz, then every other parser. */
function performance() {
	return (
		[
			['agent', 'agent-written docs'],
			['public', 'public docs']
		] as const
	).map(([tier, label]) => ({
		label,
		parsers: PARSERS.map((parser) => ({
			parser,
			mbPerSecond: throughput('common', 'html', tier, 'all', parser)?.mbPerSecond ?? null
		}))
	}));
}

export const load: PageServerLoad = () => ({
	rows: conformance(),
	edges: constructEdges(),
	built: new Date().toISOString(),
	// No cards until a snapshot is published.
	bench: bench && summary(bench)
});

function summary(b: Bench) {
	return {
		performance: performance(),
		size: PARSERS.map((parser) => ({
			parser,
			gzip: b.size.find((s) => s.parser === parser && s.mode === 'dialect')?.gzip ?? null
		})),
		measured: { date: b.environment.date, cpu: b.environment.cpu }
	};
}
