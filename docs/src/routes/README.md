# routes

[`+layout.svelte`](+layout.svelte) is the shell every route renders inside, and
[`+layout.ts`](+layout.ts) prerenders everything with no client JavaScript. The home page
[`+page.svelte`](+page.svelte) is the README; [`[slug]`](%5Bslug%5D/) renders the other Markdown
pages. [`quality/`](quality/) is built from data rather than Markdown: the test harness, and
markz's size and speed measured during the build. It is the one page that ships JavaScript.
