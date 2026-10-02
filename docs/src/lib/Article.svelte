<script lang="ts">
  /** @prose
   * One Markdown page. The file brings its own `#` heading, so the page adds none, and the
   * footer links to the file it was rendered from.
   */
  import { REPO } from "#lib/site.ts";
  import type { Page } from "#lib/pages.ts";

  let { page }: { page: Page } = $props();
</script>

<svelte:head>
  <title>{page.slug ? `${page.title} · markz` : "markz"}</title>
  <meta name="description" content={page.summary} />
</svelte:head>

<!-- @prose
`{@html}` is safe here because the HTML is rendered at build time from this repo's own
Markdown, never from user input.
-->
<article>
  {@html page.html}
</article>
<p class="source">
  Rendered from <a href="{REPO}/blob/main/{page.file}"><code>{page.file}</code></a>
</p>

<style>
  article,
  .source {
    max-width: 46rem;
  }

  .source {
    margin-top: 3rem;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
</style>
