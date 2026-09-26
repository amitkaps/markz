<script lang="ts">
	/** @prose
	 * # Conformance
	 *
	 * How markz does on every spec example, summary first: totals, then each section, then the
	 * exclusions by `syntax.md` reason, then the examples themselves. The totals, sections and
	 * reasons all filter the example list, and an example opens to show its Markdown, both
	 * outputs, where they first differ, and markz's warnings.
	 */
	import type { Status } from '#lib/site.ts';

	let { data } = $props();
	const rows = $derived(data.rows);

	const STATUSES: Status[] = ['fail', 'pass', 'excluded'];
	const LABEL: Record<Status, string> = {
		pass: 'Pass',
		fail: 'Fail',
		excluded: 'Excluded'
	};
	const WHAT: Record<Status, string> = {
		pass: 'markz writes what the oracle writes',
		fail: 'markz differs from the oracle',
		excluded: 'uses syntax the dialect cuts or changes'
	};
	const PAGE = 100;

	type Row = (typeof data.rows)[number];
	const tally = (list: Row[]) => {
		const t: Record<Status, number> = { pass: 0, fail: 0, excluded: 0 };
		for (const r of list) t[r.status]++;
		return t;
	};

	const totals = $derived(tally(rows));
	const sections = $derived.by(() => {
		const out: {
			key: string;
			suite: string;
			name: string;
			t: Record<Status, number>;
			n: number;
		}[] = [];
		for (const r of rows) {
			const key = `${r.suite}:${r.section}`;
			let s = out.find((x) => x.key === key);
			if (!s) {
				s = { key, suite: r.suite, name: r.section, t: tally([]), n: 0 };
				out.push(s);
			}
			s.t[r.status]++;
			s.n++;
		}
		return out;
	});
	const reasons = $derived.by(() => {
		const counts = new Map<string, number>();
		for (const r of rows) if (r.reason) counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1);
		return [...counts].sort((a, b) => b[1] - a[1]);
	});

	let shownStatuses = $state<Status[]>([...STATUSES]);
	let section = $state('');
	let reason = $state('');
	let search = $state('');
	let limit = $state(PAGE);

	const shown = $derived.by(() => {
		const q = search.trim().toLowerCase();
		const number = /^#?(\d+)$/.exec(q)?.[1];
		return rows
			.filter(
				(r) =>
					shownStatuses.includes(r.status) &&
					(!section || `${r.suite}:${r.section}` === section) &&
					(!reason || r.reason === reason) &&
					(!q || (number ? String(r.example) === number : r.markdown.toLowerCase().includes(q)))
			)
			.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
	});

	function toggle(status: Status) {
		shownStatuses = shownStatuses.includes(status)
			? shownStatuses.filter((s) => s !== status)
			: [...shownStatuses, status];
		limit = PAGE;
	}
	function pick(next: { section?: string; reason?: string }) {
		section = next.section ?? '';
		reason = next.reason ?? '';
		shownStatuses = [...STATUSES];
		limit = PAGE;
		document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' });
	}
	function clear() {
		shownStatuses = [...STATUSES];
		section = reason = search = '';
		limit = PAGE;
	}

	/** Markdown split into text and visible whitespace: tabs as `→` and trailing spaces as `·`. */
	function visible(markdown: string): { ws: boolean; text: string }[] {
		const parts: { ws: boolean; text: string }[] = [];
		for (const line of markdown.split('\n')) {
			const [, body = '', trailing = ''] = /^(.*?)([ \t]*)$/.exec(line) ?? [];
			for (const piece of body.split(/(\t)/)) {
				if (piece)
					parts.push(piece === '\t' ? { ws: true, text: '→\t' } : { ws: false, text: piece });
			}
			if (trailing)
				parts.push({ ws: true, text: trailing.replace(/ /g, '·').replace(/\t/g, '→\t') });
			parts.push({ ws: false, text: '\n' });
		}
		return parts;
	}
	const split = (a: string, b: string) => {
		let i = 0;
		while (i < a.length && a[i] === b[i]) i++;
		return [a.slice(0, i), a.slice(i)] as const;
	};
	const width = (n: number, of: number) => `width: ${(100 * n) / of}%`;
</script>

<svelte:head>
	<title>Conformance · markz</title>
	<meta
		name="description"
		content="Every CommonMark and GFM spec example, run through markz and through micromark."
	/>
</svelte:head>

{#snippet bar(t: Record<Status, number>, n: number)}
	<div class="bar" role="img" aria-label={STATUSES.map((s) => `${t[s]} ${s}`).join(', ')}>
		{#each ['pass', 'fail', 'excluded'] as const as s (s)}
			{#if t[s]}<span class={s} style={width(t[s], n)}></span>{/if}
		{/each}
	</div>
{/snippet}

<header class="intro">
	<h1>Conformance</h1>
	<p>
		Every CommonMark 0.31.2 and GFM spec example, parsed by markz and by
		<a href="https://github.com/micromark/micromark">micromark</a> with GFM and directives (the
		oracle), and compared after whitespace and smart punctuation are normalized. The statuses are
		the test suite's own: this page runs the same code as <code>pnpm test</code>, at build time.
	</p>
	<p class="meta">{rows.length} examples · built {new Date(data.built).toUTCString()}</p>
</header>

<section class="stats" aria-label="Totals">
	{#each STATUSES as s (s)}
		<button
			type="button"
			class="stat {s}"
			aria-pressed={shownStatuses.includes(s)}
			onclick={() => toggle(s)}
		>
			<span class="n">{totals[s]}</span>
			<span class="label">{LABEL[s]}</span>
			<span class="what">{WHAT[s]}</span>
		</button>
	{/each}
</section>
{@render bar(totals, rows.length)}

<h2>By section</h2>
<div class="scroll">
	<table>
		<thead>
			<tr>
				<th>Section</th>
				<th class="bar-cell">Status</th>
				{#each ['pass', 'fail', 'excluded'] as const as s (s)}
					<th class="num">{LABEL[s]}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sections as s (s.key)}
				<tr class:active={section === s.key}>
					<td>
						<button type="button" class="link" onclick={() => pick({ section: s.key })}>
							{s.name}
						</button>
						{#if s.suite === 'gfm'}<span class="suite">gfm</span>{/if}
					</td>
					<td class="bar-cell">{@render bar(s.t, s.n)}</td>
					{#each ['pass', 'fail', 'excluded'] as const as st (st)}
						<td class="num" class:zero={!s.t[st]}>{s.t[st]}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<h2>Excluded, by <code>syntax.md</code> reason</h2>
<div class="scroll">
	<table>
		<thead>
			<tr><th>Reason</th><th class="num">Examples</th></tr>
		</thead>
		<tbody>
			{#each reasons as [r, n] (r)}
				<tr class:active={reason === r}>
					<td
						><button type="button" class="link" onclick={() => pick({ reason: r })}>{r}</button></td
					>
					<td class="num">{n}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<h2 id="examples">Examples <span class="count">{shown.length} of {rows.length}</span></h2>
<div class="filters">
	<input
		id="search"
		type="search"
		placeholder="Search Markdown, or #232"
		aria-label="Search"
		bind:value={search}
		oninput={() => (limit = PAGE)}
	/>
	<select id="section" aria-label="Section" bind:value={section} onchange={() => (limit = PAGE)}>
		<option value="">All sections</option>
		{#each sections as s (s.key)}
			<option value={s.key}>{s.name}{s.suite === 'gfm' ? ' (gfm)' : ''}</option>
		{/each}
	</select>
	<select
		id="reason"
		aria-label="Exclusion reason"
		bind:value={reason}
		onchange={() => (limit = PAGE)}
	>
		<option value="">Any reason</option>
		{#each reasons as [r] (r)}
			<option value={r}>{r}</option>
		{/each}
	</select>
	<button type="button" class="chip" onclick={clear}>Clear filters</button>
</div>

<div class="list">
	{#each shown.slice(0, limit) as r (`${r.suite}:${r.example}`)}
		<details class="ex {r.status}">
			<summary>
				<span class="num-label">#{r.example}</span>
				<span class="pill">{LABEL[r.status]}</span>
				<span
					>{r.section}{#if r.suite === 'gfm'}
						<span class="suite">gfm</span>{/if}</span
				>
				{#if r.reason}<span class="why">{r.reason}</span>{/if}
				<span class="preview">{r.markdown.replace(/\n/g, '⏎ ')}</span>
			</summary>
			<div class="body">
				<div class="panes">
					<div class="pane">
						<h3>Markdown</h3>
						<pre>{#each visible(r.markdown) as part, i (i)}{#if part.ws}<span class="ws"
										>{part.text}</span
									>{:else}{part.text}{/if}{/each}</pre>
					</div>
					<div class="pane">
						<h3>micromark (oracle)</h3>
						<pre>{r.oracle}</pre>
					</div>
					<div class="pane">
						<h3>markz</h3>
						<pre>{r.markz}</pre>
					</div>
				</div>
				{#if r.normalized}
					{@const [oracle, markz] = r.normalized}
					{@const [same, rest] = split(oracle, markz)}
					{@const [same2, rest2] = split(markz, oracle)}
					<div class="panes">
						<div class="pane">
							<h3>Oracle, normalized</h3>
							<pre class="wrap">{same}<mark>{rest}</mark></pre>
						</div>
						<div class="pane">
							<h3>markz, normalized</h3>
							<pre class="wrap">{same2}<mark>{rest2}</mark></pre>
						</div>
					</div>
				{/if}
				{#if r.warnings.length}
					<div class="pane">
						<h3>Warnings</h3>
						<ul class="warnings">
							{#each r.warnings as d, i (i)}<li>{d}</li>{/each}
						</ul>
					</div>
				{/if}
			</div>
		</details>
	{:else}
		<p class="empty">No examples match these filters.</p>
	{/each}
	{#if shown.length > limit}
		<button type="button" class="chip more" onclick={() => (limit += PAGE)}>
			Show {Math.min(PAGE, shown.length - limit)} more
		</button>
	{/if}
</div>

<style>
	.intro {
		max-width: 46rem;
	}
	.meta,
	.count,
	.what,
	.why,
	.suite {
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.count {
		font-weight: 400;
		font-variant-numeric: tabular-nums;
	}
	.suite {
		font-family: var(--font-mono);
		font-size: 0.75rem;
	}

	.pass {
		--tone: var(--pass);
	}
	.fail {
		--tone: var(--fail);
	}
	.excluded {
		--tone: var(--excluded);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
		gap: 0.75rem;
		margin: 1.5rem 0 0.75rem;
	}
	.stat {
		display: grid;
		gap: 0.15rem;
		padding: 0.8rem 1rem;
		text-align: left;
		font: inherit;
		color: inherit;
		background: var(--surface);
		border: 1px solid var(--border);
		border-top: 3px solid var(--tone);
		border-radius: var(--radius);
		cursor: pointer;
	}
	.stat[aria-pressed='false'] {
		opacity: 0.4;
	}
	.stat .n {
		font-size: 1.7rem;
		font-weight: 600;
		line-height: 1.1;
		color: var(--tone);
		font-variant-numeric: tabular-nums;
	}
	.stat .label {
		font-weight: 600;
	}

	.bar {
		display: flex;
		height: 0.55rem;
		border-radius: 0.3rem;
		overflow: hidden;
		background: var(--surface-hover);
	}
	.bar span {
		background: var(--tone);
	}

	.scroll {
		overflow-x: auto;
	}
	.scroll table {
		display: table;
		margin: 0;
	}
	td,
	th {
		white-space: nowrap;
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.zero {
		color: var(--border);
	}
	.bar-cell {
		width: 40%;
		min-width: 8rem;
	}
	tr.active td {
		background: var(--surface-hover);
	}
	.link {
		padding: 0;
		font: inherit;
		color: var(--accent);
		background: none;
		border: 0;
		cursor: pointer;
		text-align: left;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.filters input,
	.filters select,
	.chip {
		font: inherit;
		font-size: 0.9rem;
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.35rem 0.65rem;
	}
	.filters input {
		flex: 1 1 14rem;
		min-width: 0;
	}
	.filters select {
		max-width: 100%;
	}
	.chip {
		cursor: pointer;
	}

	.list {
		display: grid;
		gap: 0.35rem;
	}
	.ex {
		min-width: 0;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--tone);
		border-radius: var(--radius);
	}
	summary {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2rem 0.75rem;
		padding: 0.5rem 0.85rem;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.num-label {
		font-family: var(--font-mono);
		min-width: 4.5ch;
	}
	.pill {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0 0.5rem;
		border-radius: 999px;
		color: var(--bg);
		background: var(--tone);
	}
	.preview {
		flex: 1 1 12rem;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.body {
		display: grid;
		gap: 0.75rem;
		padding: 0 0.85rem 0.85rem;
	}
	.panes {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 0.6rem;
	}
	.pane {
		min-width: 0;
	}
	.pane h3 {
		margin: 0 0 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}
	pre {
		margin: 0;
		padding: 0.6rem 0.75rem;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		tab-size: 4;
	}
	pre.wrap {
		white-space: pre-wrap;
		word-break: break-all;
	}
	.ws {
		color: var(--text-muted);
		opacity: 0.6;
	}
	mark {
		color: inherit;
		background: var(--mark);
	}
	.warnings {
		margin: 0;
		padding-left: 1.1rem;
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}
	.empty {
		padding: 1.5rem;
		text-align: center;
		color: var(--text-muted);
		border: 1px dashed var(--border);
		border-radius: var(--radius);
	}
	.more {
		justify-self: center;
	}
</style>
