<script lang="ts">
	/** @prose
	 * # Quality
	 *
	 * markz's quality in three parts: conformance, size and speed. Conformance is the test suite,
	 * laid out as `syntax.md` is: Metadata, Block, Inline and Not supported, each listing its
	 * constructs (or rows), and each construct opening to its edges and its examples. Its card comes
	 * first, then a search that narrows every construct at once. A construct's edges are how many
	 * cases generated from the grammar reached valid, boundary and near miss, and its hand-written
	 * ambiguous and unclosed examples, or why it can't have one. An example shows its status with
	 * what backs it (`match oracle`, `warn setext-heading`), its source, and for markz's own the edge
	 * it tries, and opens to its Markdown, what markz is held to, markz's output, where they first
	 * differ, and the warnings.
	 *
	 * Size and speed say what markz costs, in terms a reader can picture: kilobytes to ship and to
	 * hold a document, and milliseconds for documents of known sizes, each measured on this
	 * commit's build when the site was built. They describe markz alone, never a ranking.
	 */
	import { onMount } from 'svelte';
	import { PARTS, STATUSES, type Status } from '#lib/site.ts';

	let { data } = $props();
	const rows = $derived(data.rows);
	const q = $derived(data.quality);
	const kb = (bytes: number, digits = 1) => (bytes / 1024).toFixed(digits);
	const ms = (n: number) => (n < 10 ? n.toFixed(1) : n.toFixed(0));
	const range = (low: number, high: number) =>
		ms(low) === ms(high) ? ms(low) : `${ms(low)}–${ms(high)}`;
	type Row = (typeof data.rows)[number];

	const WHAT: Record<Status, string> = {
		match: 'gives the oracle’s output, or markz’s own expected HTML',
		warn: 'holds because markz warned: a form the dialect cuts, or metadata it doesn’t read',
		differ: 'a construct markz keeps under its own rule, by design',
		fail: 'markz does something else'
	};
	const PAGE = 50;

	const tally = (list: Row[]) => {
		const t: Record<Status, number> = { match: 0, warn: 0, differ: 0, fail: 0 };
		for (const r of list) t[r.status]++;
		return t;
	};

	let shownStatuses = $state<Status[]>([...STATUSES]);
	let search = $state('');
	/** The constructs opened by hand, and how many examples each shows. */
	let opened = $state<Record<string, number>>({});

	const filtering = $derived(!!search.trim() || shownStatuses.length < STATUSES.length);
	const shown = $derived.by(() => {
		const q = search.trim().toLowerCase();
		const number = /^#?(\d+)$/.exec(q)?.[1];
		return rows.filter(
			(r) =>
				shownStatuses.includes(r.status) &&
				(!q ||
					(number
						? String(r.number) === number
						: r.markdown.toLowerCase().includes(q) ||
							r.detail.toLowerCase().includes(q) ||
							r.codes.includes(q) ||
							r.category === q ||
							r.rule === q))
		);
	});
	const totals = $derived(tally(rows));
	const held = $derived(rows.length - totals.fail);

	/** Each part's constructs in filing order, with all their examples and the ones shown. */
	const parts = $derived.by(() =>
		PARTS.map((part) => {
			const constructs = new Map<string, { title: string; all: Row[]; shown: Row[] }>();
			for (const r of rows) {
				if (r.part !== part) continue;
				let c = constructs.get(r.section);
				if (!c) constructs.set(r.section, (c = { title: r.title, all: [], shown: [] }));
				c.all.push(r);
			}
			for (const r of shown) if (r.part === part) constructs.get(r.section)!.shown.push(r);
			const list = [...constructs].map(([name, c]) => ({
				name,
				...c,
				t: tally(c.all),
				sources: [...new Set(c.all.map((r) => r.source))],
				shown: c.shown.sort((a, b) => +(b.status === 'fail') - +(a.status === 'fail'))
			}));
			return { part, list, t: tally(list.flatMap((c) => c.all)) };
		})
	);

	/** A search opens every construct it matches; otherwise a construct is open once clicked. */
	const isOpen = (name: string) => name in opened || (!!search.trim() && filtering);
	function toggle(name: string) {
		if (name in opened) delete opened[name];
		else opened[name] = PAGE;
		history.replaceState(null, '', name in opened ? `#${name}` : location.pathname);
	}
	function toggleStatus(status: Status) {
		shownStatuses = shownStatuses.includes(status)
			? shownStatuses.filter((s) => s !== status)
			: [...shownStatuses, status];
	}
	function clear() {
		shownStatuses = [...STATUSES];
		search = '';
	}

	/** A link to `#construct-id` opens it. */
	onMount(() => {
		const name = decodeURIComponent(location.hash.slice(1));
		if (!name || !rows.some((r) => r.section === name)) return;
		opened[name] = PAGE;
		requestAnimationFrame(() => document.getElementById(name)?.scrollIntoView());
	});

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
		content="Every example markz is held to, filed by the dialect: CommonMark, GFM, YAML and heading ids against their oracles, and markz's own."
	/>
</svelte:head>

{#snippet bar(t: Record<Status, number>, n: number)}
	<div class="bar" role="img" aria-label={STATUSES.map((s) => `${t[s]} ${s}`).join(', ')}>
		{#each STATUSES as s (s)}
			{#if t[s]}<span class={s} style={width(t[s], n)}></span>{/if}
		{/each}
	</div>
{/snippet}

{#snippet counts(t: Record<Status, number>)}
	{#each STATUSES as s (s)}
		<span class="num {s}" class:zero={!t[s]}>{t[s]}</span>
	{/each}
{/snippet}

{#snippet edges(e: (typeof data.edges)[string], all: Row[])}
	<div class="edges">
		<p>
			Generated from the grammar: <b>{e.valid}</b> valid, <b>{e.boundary}</b> boundary and
			<b>{e['near-miss']}</b> near misses{#if e.unsettled}, <span class="fail-n"
					>{e.unsettled} unsettled</span
				>{/if}.
		</p>
		<p>
			Written by hand:
			{#each ['ambiguous', 'unclosed'] as const as k, i (k)}
				{#if i}·{/if}
				{#if e.none[k]}no {k}: <span class="why">{e.none[k]}</span>
				{:else}<b>{all.filter((r) => r.category === k).length}</b> {k}{/if}
			{/each}
		</p>
	</div>
{/snippet}

{#snippet example(r: Row)}
	<details class="ex {r.status}">
		<summary>
			<span class="num-label">#{r.number}</span>
			<span class="status"
				><span class="pill">{r.status}</span>
				{#if r.detail}<code class="detail">{r.detail}</code>{/if}</span
			>
			<span class="suite">{r.source}</span>
			{#if r.category}<span class="edge"
					>{r.category}{#if r.rule}&nbsp;· {r.rule}{/if}</span
				>{/if}
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
					<h3>{r.oracle === 'markz' ? 'Expected' : `${r.oracle} (oracle)`}</h3>
					<pre>{r.expected}</pre>
				</div>
				<div class="pane">
					<h3>markz</h3>
					<pre>{r.markz}</pre>
				</div>
				{#if r.metadata}
					<div class="pane">
						<h3>Metadata</h3>
						<pre>{r.metadata}</pre>
					</div>
				{/if}
			</div>
			{#if r.normalized}
				{@const [expected, markz] = r.normalized}
				{@const [same, rest] = split(expected, markz)}
				{@const [same2, rest2] = split(markz, expected)}
				<div class="panes">
					<div class="pane">
						<h3>Expected, normalized</h3>
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
{/snippet}

<header class="intro">
	<h1>Quality</h1>
	<p>
		What markz is held to, what it costs to ship and hold, and how long it takes. Everything here is
		measured on this commit when the site is built.
	</p>
	<p>
		<strong>Conformance.</strong> The grammar is tested as a language: every example markz is held
		to, filed as <code>syntax.md</code> is. Upstream suites are checked against an oracle:
		<a href="https://github.com/micromark/micromark">micromark</a>
		for CommonMark, GFM and frontmatter, after whitespace and smart punctuation are normalized;
		<a href="https://eemeli.org/yaml/">yaml</a> for metadata values; and
		<a href="https://github.com/Flet/github-slugger">github-slugger</a> for heading ids. markz's own
		examples carry their expected output. This page runs the same code as <code>pnpm test</code>, at
		build time.
	</p>
	<p class="meta">{rows.length} examples · built {new Date(data.built).toUTCString()}</p>
</header>

<section class="cards" aria-label="Summary">
	<div class="card">
		<h2>Conformance</h2>
		<p class="headline">
			<span class="n">{held}</span> of {rows.length} examples hold{#if totals.fail}, <span
					class="fail-n">{totals.fail} fail</span
				>{/if}
		</p>
		{@render bar(totals, rows.length)}
		<div class="stats">
			{#each STATUSES as s (s)}
				<button
					type="button"
					class="stat {s}"
					aria-pressed={shownStatuses.includes(s)}
					onclick={() => toggleStatus(s)}
				>
					<span class="n">{totals[s]}</span>
					<span class="label">{s}</span>
					<span class="what">{WHAT[s]}</span>
				</button>
			{/each}
		</div>
	</div>
	<div class="card-row">
		<div class="card">
			<h2>Size</h2>
			<p class="line">
				<span class="n">{kb(q.size.gzip)}</span> KB gzip to ship, of a {kb(q.size.budget, 0)} KB budget
			</p>
			<div class="bars">
				<span class="bar-label own">used</span>
				<span class="bar-track"
					><span class="bar-fill own" style:width="{(q.size.gzip / q.size.budget) * 100}%"
					></span></span
				>
				<span class="bar-value">{kb(q.size.budget - q.size.gzip)} KB to spare</span>
			</div>
			<p class="line">
				<span class="n">{kb(q.size.held, 0)}</span> KB to hold the CommonMark spec's tree, a {kb(
					q.size.source,
					0
				)} KB document
			</p>
			<p class="what">
				One package with no dependencies: parser, tree and HTML, bundled and minified. The tree is
				flat typed arrays with offsets into the source, which it shares rather than copies.
			</p>
		</div>
		<div class="card">
			<h2>Speed</h2>
			<table class="runs">
				<tbody>
					{#each q.speed as r (r.label)}
						<tr>
							<th scope="row">{r.label} <span class="what">{kb(r.bytes, 0)} KB</span></th>
							<td>{range(r.low, r.high)} ms</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="what">
				Parse + HTML, once the parser is warm. One pass, no backtracking, so time grows in step with
				the text: twice the text takes about twice as long. Measured on {q.machine}.
			</p>
		</div>
	</div>
</section>

<div class="filters">
	<input
		type="search"
		placeholder="Search Markdown, a warning code, or #232"
		aria-label="Search"
		bind:value={search}
	/>
	{#if filtering}
		<button type="button" class="chip" onclick={clear}>Clear · {shown.length} shown</button>
	{/if}
</div>

{#if filtering && !shown.length}
	<p class="empty">No examples match these filters.</p>
{/if}

{#each parts as { part, list, t } (part)}
	<section class="part">
		<h2>{part}</h2>
		<div class="grid head">
			<span>{part === 'Not supported' ? 'Row' : 'Construct'}</span>
			<span class="bar-cell"></span>
			{#each STATUSES as s (s)}<span class="num {s}">{s}</span>{/each}
		</div>
		{#each list as c (c.name)}
			{#if !filtering || c.shown.length}
				{@const open = isOpen(c.name)}
				<div class="construct" class:open id={c.name}>
					<button
						type="button"
						class="grid row"
						aria-expanded={open}
						onclick={() => toggle(c.name)}
					>
						<span class="name">
							<span class="caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
							{c.title}
							{#each c.sources as source (source)}<span class="suite">{source}</span>{/each}
						</span>
						<span class="bar-cell">{@render bar(c.t, c.all.length)}</span>
						{@render counts(c.t)}
					</button>
					{#if open}
						{@const limit = opened[c.name] ?? PAGE}
						<div class="list">
							{#if data.edges[c.name]}{@render edges(data.edges[c.name]!, c.all)}{/if}
							{#each c.shown.slice(0, limit) as r (r.id)}
								{@render example(r)}
							{:else}
								<p class="empty">No examples match these filters.</p>
							{/each}
							{#if c.shown.length > limit}
								<button
									type="button"
									class="chip more"
									onclick={() => (opened[c.name] = limit + PAGE)}
								>
									Show {Math.min(PAGE, c.shown.length - limit)} more
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{/each}
		<div class="grid total">
			<span
				>{list.length}
				{part === 'Not supported' ? 'row' : 'construct'}{list.length === 1 ? '' : 's'}</span
			>
			<span class="bar-cell"></span>
			{@render counts(t)}
		</div>
	</section>
{/each}

<style>
	.intro {
		max-width: 46rem;
	}
	.meta,
	.what,
	.suite {
		color: var(--text-muted);
		font-size: 0.85rem;
	}
	.suite {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		margin-left: 0.4rem;
	}

	.match {
		--tone: var(--match);
	}
	.warn {
		--tone: var(--warn);
	}
	.differ {
		--tone: var(--differ);
	}
	.fail {
		--tone: var(--fail);
	}

	.cards {
		display: grid;
		gap: 0.75rem;
		margin: 1.5rem 0;
	}
	.card {
		padding: 1rem 1.1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.card-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 0.75rem;
	}
	.runs {
		width: 100%;
		margin: 0.5rem 0 0;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	.runs th,
	.runs td {
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--border);
		text-align: left;
		font-weight: normal;
	}
	.runs td {
		text-align: right;
		font-weight: 600;
		white-space: nowrap;
	}
	.runs .what {
		font-size: 0.75rem;
	}
	.line {
		margin: 0.5rem 0 0.3rem;
	}
	.line .n {
		font-size: 1.3rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.bars {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.15rem 0.5rem;
		align-items: center;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}
	.bar-label.own {
		color: var(--accent);
		font-weight: 600;
	}
	.bar-track {
		height: 0.4rem;
		background: var(--border);
		border-radius: 0.2rem;
		overflow: hidden;
	}
	.bar-fill {
		display: block;
		height: 100%;
		background: var(--text-muted);
	}
	.bar-fill.own {
		background: var(--accent);
	}
	.bar-value {
		text-align: right;
	}
	.card .what {
		margin: 0.6rem 0 0;
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.card h2 {
		margin: 0;
		padding: 0;
		border: 0;
		font-size: 0.8rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}
	.headline {
		margin: 0.25rem 0 0.6rem;
	}
	.headline .n {
		font-size: 1.7rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.fail-n {
		color: var(--fail);
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: 0.6rem;
		margin-top: 0.8rem;
	}
	.stat {
		display: grid;
		align-content: start;
		gap: 0.1rem;
		padding: 0.6rem 0.8rem;
		text-align: left;
		font: inherit;
		color: inherit;
		background: var(--bg);
		border: 1px solid var(--border);
		border-top: 3px solid var(--tone);
		border-radius: var(--radius);
		cursor: pointer;
	}
	.stat[aria-pressed='false'] {
		opacity: 0.4;
	}
	.stat .n {
		font-size: 1.3rem;
		font-weight: 600;
		line-height: 1.1;
		color: var(--tone);
		font-variant-numeric: tabular-nums;
	}
	.stat .label {
		font-weight: 600;
	}
	.stat .what {
		font-size: 0.8rem;
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

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 0.5rem 0;
		background: var(--bg);
	}
	.filters input,
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
	.chip {
		cursor: pointer;
	}

	/* One grid for every part, so the columns line up down the page. */
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(4rem, 10rem) repeat(4, 3.6rem);
		gap: 0.6rem;
		align-items: center;
		padding: 0.4rem 0.6rem;
	}
	.head,
	.total {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.head .num {
		color: var(--tone);
	}
	.total {
		border-top: 1px solid var(--border);
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.zero {
		color: var(--border);
	}
	.construct {
		border-radius: var(--radius);
		scroll-margin-top: 3.5rem;
	}
	.construct.open {
		background: var(--surface);
	}
	.row {
		width: 100%;
		font: inherit;
		color: inherit;
		text-align: left;
		background: none;
		border: 0;
		border-radius: var(--radius);
		cursor: pointer;
	}
	.row:hover {
		background: var(--surface-hover);
	}
	.name {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.caret {
		display: inline-block;
		width: 1em;
		color: var(--text-muted);
	}

	.list {
		display: grid;
		gap: 0.35rem;
		padding: 0.25rem 0.6rem 0.75rem;
	}
	.ex {
		min-width: 0;
		background: var(--bg);
		border: 1px solid var(--border);
		border-left: 3px solid var(--tone);
		border-radius: var(--radius);
	}
	summary {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2rem 0.75rem;
		padding: 0.45rem 0.85rem;
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
	.status {
		display: inline-flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.pill {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0 0.5rem;
		border-radius: 999px;
		color: var(--bg);
		background: var(--tone);
	}
	.detail {
		font-size: 0.8rem;
		color: var(--tone);
	}
	.suite {
		margin: 0;
	}
	.name .suite {
		margin-left: 0.4rem;
	}
	.edge {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 0 0.4rem;
		border: 1px solid var(--border);
		border-radius: 999px;
	}
	.edges {
		font-size: 0.85rem;
		color: var(--text-muted);
		padding: 0.25rem 0.25rem 0.4rem;
	}
	.edges p {
		margin: 0.15rem 0;
	}
	.edges b {
		color: var(--text);
		font-variant-numeric: tabular-nums;
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
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
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
		margin: 0;
		padding: 1rem;
		text-align: center;
		color: var(--text-muted);
		border: 1px dashed var(--border);
		border-radius: var(--radius);
	}
	.more {
		justify-self: center;
	}

	@media (max-width: 40rem) {
		.grid {
			grid-template-columns: minmax(0, 1fr) repeat(4, 2.6rem);
			gap: 0.35rem;
		}
		.bar-cell {
			display: none;
		}
	}
</style>
