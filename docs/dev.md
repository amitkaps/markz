# Development

How to work on markz itself: build it, test it, release it and deploy its site. The rules for
changing it, including the prose rules it follows, are in [AGENTS.md](../AGENTS.md).

## Toolchain

`package.json` says what the repository needs. `devEngines` names the Node and pnpm to develop
with, and `engines` names the Node range the package runs on. markz supports the current Node and
the previous LTS, which today are 26 and 24. Development asks for 26, so the tests, the timings and the
Quality report all run on one Node, and pnpm stops with an error on any other. `vp` is a dev dependency, so run it through the
`pnpm` scripts, not a global install.

## Build and test

```sh
pnpm install
pnpm check             # format, lint and types
pnpm test
pnpm fuzz              # random constructs and robustness, a new seed each run
pnpm build             # the package, into dist/
pnpm dev               # the same build, on every change
pnpm size              # what it costs: gzip against the budget, and memory to hold a tree
pnpm speed             # did a change move it: this tree against origin/main, or --against <ref>
pnpm hotspots          # where the time goes; or one tier or construct by name
pnpm compare           # beside markdown-exit, marked and micromark, for our own insight
pnpm quality           # the Quality report, from the test harness, beside the site
pnpm prose             # the site, live as you edit
pnpm prose build       # the site, into .prose/
pnpm vendor            # refreshes the vendored test inputs
```

Each script is one word, named for the question it answers. Two scripts may run the same file
(`hotspots` is `speed.ts --profile`), and a variant of one question is a flag. How the tests are organised is in
[test/README.md](../test/README.md), and why is in [Quality](quality.md#how-markz-is-tested).

## Workflow

`main` is protected. A pull request is required, and the `ci` check must pass. Branch, commit,
push and open a pull request, then merge it with `gh pr merge --auto --squash`. Run `pnpm check`
and `pnpm test` first, and `pnpm build` too after a dependency bump.

## The site

[markz.amitkaps.com](https://markz.amitkaps.com) is this repository read by
[prose](https://prose.amitkaps.com), plus the Quality page. Neither is part of the package, and
the site has no code of its own.

`pnpm prose build` writes the repository's pages, and `pnpm quality` then writes the Quality
report beside them. The root `README.md` is the home page. The bar links the docs in `docs/`, in the order of the
`nav` list in [docs/README.md](README.md). CI builds both on every pull request, so a change
that breaks the site can't merge.

Cloudflare builds the site from `main` and serves it from a Worker with static assets, set up in
[wrangler.toml](../wrangler.toml). Every merge deploys it. In Cloudflare, connect the `markz`
Worker to the repository with these settings.

- **Production branch:** `main`
- **Build command:** `pnpm install && pnpm prose build && pnpm quality`
- **Build variable:** `NODE_VERSION` set to `26`. Cloudflare reads pnpm's version from the
  repository but not Node's, and `devEngines` stops the build on any other Node.
- **Deploy command:** `pnpm dlx wrangler deploy`

The deploy command uses `pnpm dlx`, not `npx`, because `npx` refuses to run in a repository whose
`devEngines` names pnpm. Wrangler isn't a dependency, since only the deploy runs it.

## Release

Bump `version` in `package.json` and merge to `main`. Then tag the release and push the tag.

```sh
git tag v0.3.0 && git push origin v0.3.0
```

The `release` workflow checks, tests and packs it, then stages it on npm for a maintainer to
approve. How and why is in [Design](design.md#package).
