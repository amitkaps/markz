<script lang="ts">
  /** @prose
   * A Markdown page other than home, from the `Page` its load resolved.
   */
  import Article from "#lib/Article.svelte";

  let { data } = $props();
</script>

<Article page={data.page} />
