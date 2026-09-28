<script lang="ts">
	/** @prose
	 * # Shell
	 *
	 * The layout every route renders inside: a header with the page nav, the content, and a
	 * footer. The nav comes from the page list (`+layout.server.ts`), so a page added there appears
	 * here, followed by the one page built from data rather than Markdown: Quality.
	 */
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { REPO } from '#lib/site.ts';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="shell">
	<header>
		<a href="/" class="brand">markz</a>
		<nav>
			{#each data.nav as page (page.slug)}
				<a href="/{page.slug}">{page.title}</a>
			{/each}
			<a href="/quality">Quality</a>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<span>Rendered by markz, built from this commit</span>
		<a href={REPO}>github.com/amitkaps/markz</a>
	</footer>
</div>

<style>
	.shell {
		max-width: 64rem;
		margin: 0 auto;
		padding: 1.5rem;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border);
	}

	.brand {
		font-weight: 700;
		font-family: var(--font-mono);
		text-decoration: none;
		color: var(--text);
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1rem;
	}

	main {
		flex: 1;
		padding: 2rem 0;
		min-width: 0;
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		justify-content: space-between;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.85rem;
	}
</style>
