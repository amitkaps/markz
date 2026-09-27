# lib

Everything importable through the `#lib` alias. [`pages.ts`](pages.ts) renders the Markdown
pages, [`Article.svelte`](Article.svelte) lays one out, and
[`server/conformance.ts`](server/conformance.ts) computes the Conformance page's rows at build
time. [`bench.ts`](bench.ts) reads the published benchmark snapshot, `bench.json`, for the
Performance page and cards; the file exists only once `pnpm snapshot` has written it.
