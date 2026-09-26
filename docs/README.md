# docs

The markz site, published at [markz.amitkaps.com](https://markz.amitkaps.com). It started as a
trimmed copy of [base](https://github.com/amitkaps/base): SvelteKit, every page prerendered, no
client JavaScript except where a page opts in, deployed as a Cloudflare Worker.

It is markz's first consumer. Its pages are the repo's own Markdown (the README and `prose/`),
rendered by markz at build time, and its Conformance page runs the library's test harness. It is
a private workspace package: nothing here reaches the published `markz` package.

From the repo root, `pnpm docs` runs it and `pnpm docs:build` builds it. Inside `docs/`, `dev`,
`build`, `check`, `test` and `deploy` are the interface, as in base.
