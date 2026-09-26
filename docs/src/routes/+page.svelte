<script lang="ts">
	/** @prose
	 * The home page: the repo's README, rendered by markz.
	 */
	import Article from '#lib/Article.svelte';

	let { data } = $props();
</script>

<Article page={data.page} />
