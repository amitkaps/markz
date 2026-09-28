# lib

Everything importable through the `#lib` alias. [`pages.ts`](pages.ts) renders the Markdown
pages, and [`Article.svelte`](Article.svelte) lays one out. The Quality page's data is computed
at build time on the server: [`server/conformance.ts`](server/conformance.ts) gives its rows,
and [`server/quality.ts`](server/quality.ts) measures markz's size and speed.
