# Development

How to work on markz itself: build it, test it, release it and deploy its site. The rules for
changing it, including the prose rules it follows, are in [AGENTS.md](../AGENTS.md).

## Toolchain

`package.json` says what the repository needs. `devEngines` names the Node and pnpm to develop
with, and `engines` names the Node range the package runs on. markz supports the current Node and
the previous LTS, which today are 26 and 24. Development asks for 26, so tests, the bench and the
Quality page all run on one Node, and pnpm stops with an error on any other. `vp` is a dev dependency, so run it through the
`pnpm` scripts, not a global install.

## Build and test

```sh
pnpm install
pnpm check             # format, lint and types
pnpm test
pnpm build             # the package, into dist/
pnpm dev               # the same build, on every change
pnpm size              # gzip size against the budget
pnpm fuzz              # random constructs and robustness, a new seed each run
pnpm bench             # markz's speed alone, in seconds
pnpm bench --compare   # beside other parsers, for our own insight
pnpm vendor            # refreshes the vendored test inputs
```

Scripts are one word, and a variant is a flag. How the tests are organised is in
[test/README.md](../test/README.md), and why is in [Design](design.md#testing).

## Workflow

`main` is protected. A pull request is required, and the `ci` check must pass. Branch, commit,
push and open a pull request, then merge it with `gh pr merge --auto --squash`. Run `pnpm check`
and `pnpm test` first, and `pnpm build` too after a dependency bump.

## The site

[markz.amitkaps.com](https://markz.amitkaps.com) is this repository read by
[prose](https://prose.amitkaps.com), plus the Quality page. Neither is part of the package, and
the site has no code of its own.

```sh
pnpm prose build                # the repository's pages
pnpm quality                    # the Quality page, beside them
```

The root `README.md` is the home page. The bar links the docs in `docs/`, in the order of the
`nav` list in [docs/README.md](README.md). CI builds both on every pull request, so a change
that breaks the site can't merge.

Cloudflare builds the site from `main` and serves it from a Worker with static assets, set up in
[wrangler.toml](../wrangler.toml). Every merge deploys it. In Cloudflare, connect the `markz`
Worker to the repository with these settings.

- **Production branch:** `main`
- **Build command:** `pnpm install && pnpm prose build && pnpm quality`
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
