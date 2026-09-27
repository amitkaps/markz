<script lang="ts">
	/** @prose
	 * # Performance
	 *
	 * The published benchmark, or, before one is published, how to publish it. The numbers come
	 * only from a deep run on a quiet machine, copied in by a commit of its own, so the page can
	 * exist before they do.
	 */
	import { bench } from '#lib/bench.ts';
	import { REPO } from '#lib/site.ts';
	import Results from './Results.svelte';
</script>

<svelte:head>
	<title>Performance · markz</title>
</svelte:head>

{#if bench}
	<Results />
{:else}
	<header>
		<h1>Performance</h1>
		<p>
			No benchmark is published yet. The numbers come from <code>pnpm compare --deep</code> on a
			quiet machine, and <code>pnpm snapshot</code> copies them here in a commit of their own.
			<a href="{REPO}/blob/main/bench/README.md">How the benchmark works</a>.
		</p>
	</header>
{/if}
