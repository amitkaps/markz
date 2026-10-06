# Development

How to work on markz itself: build it, test it, release it and deploy its site. The rules for
changing it, including the prose rules it follows, are in [AGENTS.md](../AGENTS.md).

## Toolchain

`package.json` says what the repository needs. `devEngines` names the Node and pnpm to develop
with, and `engines` names the Node range the package runs on. markz supports the current Node and
the previous LTS, which today are 26 and 24. `vp` is a dev dependency, so run it through the
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
pnpm prose build --out .prose   # the repository's pages
pnpm quality                    # the Quality page, beside them
```

The root `README.md` is the home page. The bar links the docs in `docs/`, in the order of the
`nav` list in [docs/README.md](README.md). CI builds both on every pull request, and deploys the
folder from `main` to a Cloudflare Worker set up in [wrangler.toml](../wrangler.toml).

## Release

Bump `version` in `package.json` and merge to `main`. Then tag the release and push the tag.

```sh
git tag v0.3.0 && git push origin v0.3.0
```

The `release` workflow checks, tests and packs it, then stages it on npm for a maintainer to
approve. How and why is in [Design](design.md#package).
