<script lang="ts">
	/** @prose
	 * # Performance results
	 *
	 * The published benchmark (`bench/`): markz beside the three parsers it learns from,
	 * markdown-exit, marked and micromark, and not as a general-purpose replacement for them. Every table names its mode and what it measures, and the
	 * page opens with the machine and corpus the numbers came from, since they belong to that run and
	 * nowhere else, and the adapters table, generated from what ran, says how each parser was set up.
	 * The headline is warm throughput on agent-written and on public docs, side by side. Each other
	 * measure has its own table: scaling, one construct at a time, retained memory after parse, cold
	 * start, bundle size. The pathological section comes last and says what it is: a view of how
	 * each parser scales on input built to hurt, not a workload.
	 */
	import {
		bench as published,
		kb,
		PARSERS,
		throughput,
		TIERS,
		type Measure,
		type Mode
	} from '#lib/bench.ts';
	import { REPO } from '#lib/site.ts';

	// The page renders this only once a snapshot is published.
	const bench = published!;
	const env = bench.environment;
	const MODES: [Mode, string][] = [
		['common', 'Common: the same workload for all, the blocks every parser shares'],
		['dialect', 'Dialect: whole documents, each parser configured as close to markz as it gets']
	];
	const MEASURES: [Measure, string][] = [
		['html', 'Parse + HTML'],
		['structured', 'Structured parse']
	];
	const tiers = TIERS.filter(([tier]) => bench.throughput.some((t) => t.tier === tier));
	const sizes = [
		...new Map(bench.throughput.filter((t) => t.tier === 'scaling').map((t) => [t.name, t.bytes]))
	].sort((a, b) => a[1] - b[1]);
	const patterns = [...new Set(bench.pathological.map((p) => p.pattern))];
	const constructs = [...new Set(bench.constructs.map((c) => c.construct))];
	const construct = (id: string, parser: string) =>
		bench.constructs.find((c) => c.construct === id && c.parser === parser);

	const cell = (mode: Mode, measure: Measure, tier: string, name: string, parser: string) => {
		const t = throughput(mode, measure, tier, name, parser);
		if (!t) return null;
		if (t.mbPerSecond === null) return { text: 'error', noisy: false, error: t.error };
		return { text: t.mbPerSecond.toFixed(1), noisy: t.noisy, error: undefined };
	};
	/** The fastest parser in a row, which the table marks. */
	const best = (mode: Mode, measure: Measure, tier: string, name: string) =>
		PARSERS.map((p) => throughput(mode, measure, tier, name, p))
			.filter((t) => t && t.mbPerSecond !== null && !t.noisy)
			.sort((a, b) => b!.mbPerSecond! - a!.mbPerSecond!)[0]?.parser;

	const run = (pattern: string, parser: string) =>
		bench.pathological.filter((p) => p.pattern === pattern && p.parser === parser);
	const show = (p: (typeof bench.pathological)[number] | undefined) =>
		!p
			? '—'
			: p.outcome === 'ok'
				? `${p.ms!.toFixed(0)}`
				: p.outcome === 'timeout'
					? 'timeout'
					: 'crash';
	/** Four times the input taking over eight times as long is worse than linear. */
	const superlinear = (a?: { ms: number | null }, b?: { ms: number | null; outcome: string }) =>
		!!b && (b.outcome !== 'ok' || (!!a?.ms && !!b.ms && b.ms > 8 * a.ms + 10));

	// The scaling chart: MB/s against size, log scale across, for parse + HTML in the common mode.
	const W = 640;
	const H = 260;
	const PAD = { l: 44, r: 110, t: 12, b: 32 };
	const series = PARSERS.map((parser) => ({
		parser,
		points: sizes
			.map(([name, bytes]) => ({ bytes, t: throughput('common', 'html', 'scaling', name, parser) }))
			.filter((p) => (p.t?.mbPerSecond ?? 0) > 0)
			.map((p) => ({ bytes: p.bytes, v: p.t!.mbPerSecond! }))
	}));
	const top = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.v)));
	const lo = Math.log10(sizes[0]?.[1] ?? 1e4);
	const hi = Math.log10(sizes.at(-1)?.[1] ?? 1e7);
	const x = (bytes: number) =>
		PAD.l + ((Math.log10(bytes) - lo) / Math.max(hi - lo, 1e-9)) * (W - PAD.l - PAD.r);
	const y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
</script>

<header>
	<h1>Performance</h1>
	<p>
		How fast markz parses, what it keeps in memory and how large it is, beside three parsers it
		learns from: markdown-exit, the fastest; marked, the smallest; and micromark, the spec-exact
		one. markz is for Markdown you control, in its dialect, and isn't a general-purpose replacement
		for any of them. Each parser runs in a fresh process of its own, one after another. Throughput
		is
		<em>warm</em>: the median of repeated passes, in a process that has already loaded the parser
		and run it over its documents for a second, which is what a server or a watch build pays per
		document.
		<em>Cold</em> start is a whole new process, timed by
		<a href="https://github.com/sharkdp/hyperfine">Hyperfine</a>, which is what a CLI pays.
		<a href="{REPO}/blob/main/bench/README.md">How to read these numbers</a>.
	</p>
	<p class="meta">
		{env.cpu} · {env.os}
		{env.arch} · Node {env.node} · markz {env.markz.commit}{env.markz.dirty
			? ' (uncommitted changes)'
			: ''} · corpus {bench.corpus.hash} · {new Date(env.date).toUTCString()}{bench.settings.deep
			? ''
			: ' · not a deep run'}
	</p>
</header>

<section>
	<h2>Adapters</h2>
	<p>
		How each parser was set up, as the run reported it. <em>Common</em> is the same input for all, not
		the same defaults: documents cut to the blocks every parser reads alike.
	</p>
	<table>
		<thead>
			<tr>
				<th></th>
				<th>Structured parse</th>
				<th>Common</th>
				<th>Dialect</th>
				<th>Dialect reads beyond CommonMark</th>
			</tr>
		</thead>
		<tbody>
			{#each PARSERS as p (p)}
				{@const a = bench.adapters[p]!}
				<tr>
					<th>{p}</th>
					<td class="text">{a.common.representation ?? 'none'}</td>
					<td class="text">{a.common.configuration}</td>
					<td class="text">{a.dialect.configuration}</td>
					<td class="text">{a.dialect.capabilities.join(', ')}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<section>
	<h2>Throughput</h2>
	<p>
		MB/s warm, higher is faster; the fastest in each row is bold. A <span class="noisy">?</span>
		marks a cell whose middle half of passes spread over half its median. <em>Agent-written</em>
		docs are written by coding agents in real repos; <em>public</em> docs by people.
	</p>
	{#each MEASURES as [measure, label] (measure)}
		{#each MODES as [mode, what] (mode)}
			<h3>{label} · {what}</h3>
			<table>
				<thead>
					<tr>
						<th></th>
						{#each PARSERS as p (p)}<th>{p}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each tiers as [tier, name] (tier)}
						{@const winner = best(mode, measure, tier, 'all')}
						<tr>
							<th>{name}</th>
							{#each PARSERS as p (p)}
								{@const c = cell(mode, measure, tier, 'all', p)}
								<td class:best={p === winner} title={c?.error}
									>{c?.text ?? '—'}{#if c?.noisy}<span class="noisy">?</span>{/if}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		{/each}
	{/each}
	<p class="note">
		The structured parses build different things (the adapters table), and that difference is part
		of the result. A parser with no public structured parse has none here.
	</p>
</section>

<section>
	<h2>Scaling</h2>
	<p>
		Parse + HTML in the common mode, MB/s by document size. A flat line is approximately linear
		time. From 100 KB to the largest size, time per byte grew by:
		{#each bench.scaling as s, i (s.parser)}{i ? ', ' : ''}{s.parser}
			<span class:bad={!s.linear}>{s.ratio.toFixed(2)}×</span>{/each}.
	</p>
	<svg viewBox="0 0 {W} {H}" role="img" aria-label="MB/s by document size, per parser">
		{#each [0, 0.5, 1] as f (f)}
			<line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(top * f)} y2={y(top * f)} />
			<text class="axis" x={PAD.l - 6} y={y(top * f) + 4} text-anchor="end"
				>{(top * f).toFixed(0)}</text
			>
		{/each}
		{#each sizes as [name, bytes] (name)}
			<text class="axis" x={x(bytes)} y={H - 10} text-anchor="middle">{name}</text>
		{/each}
		{#each series as s (s.parser)}
			{#if s.points.length}
				<polyline
					class="line"
					class:markz={s.parser === 'markz'}
					points={s.points.map((p) => `${x(p.bytes)},${y(p.v)}`).join(' ')}
				/>
				<text
					class="label"
					class:markz={s.parser === 'markz'}
					x={x(s.points.at(-1)!.bytes) + 6}
					y={y(s.points.at(-1)!.v) + 4}>{s.parser}</text
				>
			{/if}
		{/each}
	</svg>
</section>

{#if constructs.length}
	<section>
		<h2>One construct at a time</h2>
		<p>
			Structured parse, MB/s warm, on about 30 KB of one construct written from markz's grammar,
			beside markdown-exit where the construct is CommonMark's or GFM's. Generated text is nothing
			anyone writes: this shows which constructs carry the time, not a workload.
		</p>
		<table>
			<thead>
				<tr>
					<th></th>
					<th>origin</th>
					<th>markz</th>
					<th>markdown-exit</th>
				</tr>
			</thead>
			<tbody>
				{#each constructs as id (id)}
					<tr>
						<th>{id}</th>
						<td class="text">{construct(id, 'markz')?.origin}</td>
						<td>{construct(id, 'markz')?.mbPerSecond?.toFixed(1) ?? '—'}</td>
						<td>{construct(id, 'markdown-exit')?.mbPerSecond?.toFixed(1) ?? '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

{#if bench.cold.length}
	<section>
		<h2>Cold start</h2>
		<p>
			One whole process over the agent-written docs, in milliseconds: Node starting, the parser
			loading, and one pass before the JIT has warmed. <em>none</em> is Node alone. This is what a CLI
			or a build step pays.
		</p>
		<table>
			<thead>
				<tr>
					<th></th>
					<th>none</th>
					{#each PARSERS as p (p)}<th>{p}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each MODES as [mode] (mode)}
					<tr>
						<th>{mode}</th>
						{#each ['none', ...PARSERS] as p (p)}
							<td
								>{bench.cold.find((c) => c.mode === mode && c.parser === p)?.ms.toFixed(0) ??
									'—'}</td
							>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

<section>
	<h2>Retained memory after parse</h2>
	<p>
		What holding one structured result keeps alive, per byte of source, on a 10 KB document: the
		heap after a full collection, with twenty results held, less the heap before. Every parser is
		given the same source string, so one that keeps a reference to it pays nothing for it. The RSS
		change is the process's view, and is a diagnostic only.
	</p>
	<table>
		<thead>
			<tr>
				<th></th>
				{#each PARSERS as p (p)}<th>{p}</th>{/each}
			</tr>
		</thead>
		<tbody>
			{#each MODES as [mode] (mode)}
				<tr>
					<th>{mode}, bytes per source byte</th>
					{#each PARSERS as p (p)}
						{@const m = bench.memory.find((m) => m.mode === mode && m.parser === p)}
						<td>{m ? (m.retained / m.sourceBytes).toFixed(1) : '—'}</td>
					{/each}
				</tr>
				<tr class="minor">
					<th>{mode}, RSS delta</th>
					{#each PARSERS as p (p)}
						{@const m = bench.memory.find((m) => m.mode === mode && m.parser === p)}
						<td>{m ? kb(m.rss) : '—'}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<section>
	<h2 id="bundle-size">Bundle size</h2>
	<p>
		Each parser's parse-to-HTML entry, with its configuration for the mode, bundled and minified,
		then compressed. markz's own 20 KB budget is enforced separately, in CI.
	</p>
	<table>
		<thead>
			<tr>
				<th></th>
				<th>mode</th>
				<th>entry</th>
				<th>reads beyond CommonMark</th>
				<th>minified</th>
				<th>gzip</th>
				<th>brotli</th>
			</tr>
		</thead>
		<tbody>
			{#each PARSERS as p (p)}
				{#each MODES as [mode] (mode)}
					{@const z = bench.size.find((s) => s.parser === p && s.mode === mode)}
					{#if z}
						<tr>
							<th>{p}</th>
							<td class="text">{mode}</td>
							<td class="text">{z.entry.join(', ')}</td>
							<td class="text">{bench.adapters[p]?.[mode].capabilities.join(', ')}</td>
							<td>{kb(z.minified)}</td>
							<td>{kb(z.gzip)}</td>
							<td>{kb(z.brotli)}</td>
						</tr>
					{/if}
				{/each}
			{/each}
		</tbody>
	</table>
</section>

{#if patterns.length}
	<section>
		<h2>Pathological input</h2>
		<p class="caveat">
			Included to show scaling behaviour, not as a representative workload. Each pattern is an
			adversarial input from markz's complexity tests, at about 20 KB and then four times that, in
			milliseconds for parse + HTML at each parser's defaults. Linear work takes about four times as
			long at four times the size; a cell is marked when it takes more than eight, times out, or
			crashes.
		</p>
		<table>
			<thead>
				<tr>
					<th></th>
					{#each PARSERS as p (p)}<th>{p}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each patterns as pattern (pattern)}
					<tr>
						<th>{pattern}</th>
						{#each PARSERS as p (p)}
							{@const [a, b] = run(pattern, p)}
							<td class:bad={superlinear(a, b)}>{show(a)} → {show(b)}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

<section>
	<h2>Versions</h2>
	<p class="meta">
		{Object.entries(env.packages)
			.map(([name, version]) => `${name} ${version}`)
			.join(' · ')}{env.hyperfine ? ` · ${env.hyperfine}` : ''}
	</p>
</section>

<style>
	.meta,
	.note {
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.caveat {
		border-left: 3px solid var(--warn);
		padding-left: 0.8rem;
	}
	section {
		margin: 2.5rem 0;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0 1.5rem;
		font-variant-numeric: tabular-nums;
		font-size: 0.9rem;
		display: block;
		overflow-x: auto;
	}
	h3 {
		margin: 1.5rem 0 0;
		font-size: 0.95rem;
		font-weight: 600;
	}
	th,
	td {
		padding: 0.35rem 0.6rem;
		border-bottom: 1px solid var(--border);
		text-align: right;
		white-space: nowrap;
	}
	th:first-child {
		text-align: left;
		font-weight: 500;
	}
	thead th {
		color: var(--text-muted);
		font-weight: 500;
	}
	td.text {
		text-align: left;
		white-space: normal;
		color: var(--text-muted);
	}
	.best {
		font-weight: 700;
	}
	.bad {
		color: var(--fail);
	}
	.noisy {
		color: var(--warn);
		margin-left: 0.1rem;
	}
	.minor {
		color: var(--text-muted);
		font-size: 0.85em;
	}
	svg {
		width: 100%;
		max-width: 44rem;
		height: auto;
	}
	.grid {
		stroke: var(--border);
	}
	.axis,
	.label {
		fill: var(--text-muted);
		font-size: 11px;
	}
	.line {
		fill: none;
		stroke: var(--text-muted);
		stroke-width: 1.5;
		opacity: 0.6;
	}
	.line.markz {
		stroke: var(--accent);
		stroke-width: 2.5;
		opacity: 1;
	}
	.label.markz {
		fill: var(--accent);
		font-weight: 600;
	}
</style>
