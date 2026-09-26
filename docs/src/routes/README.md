# routes

[`+layout.svelte`](+layout.svelte) is the shell every route renders inside, and
[`+layout.ts`](+layout.ts) prerenders everything with no client JavaScript. The home page
[`+page.svelte`](+page.svelte) is the README; [`[slug]`](%5Bslug%5D/) renders the other Markdown
pages; [`conformance/`](conformance/) is the one page built from data rather than Markdown, and
the one that ships JavaScript.
