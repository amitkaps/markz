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

## Fuzz

`pnpm test` searches each construct from one fixed seed, and its cases reach every choice in the
grammar. `pnpm fuzz` searches fifty times as far from a new seed, so it finds what a fixed search
misses. It isn't a CI check, since a new seed can fail on a case no pull request caused.

Run it before a release, and after a change to `docs/grammar.md`, `test/harness/cases.ts` or a
parser pass. The `fuzz` workflow runs it on GitHub on demand, with `gh workflow run fuzz` or from the
Actions tab. `pnpm fuzz` prints its seed first, and each cloud run's summary records its
commit, seed and result, so the Actions history is the log of what was searched. A failure also
lists each failing test with its cases, and the run keeps the whole log.

The log is for replaying, not for picking seeds. A seed searches different cases once the
grammar or the generator changes, so a seed that passed is no reason to skip it, or to run it
again.

When it finds a case, settle it as any other, then add its shortest form to `FOUND` in
`test/harness/cases.ts`, so `pnpm test` judges it on every run.

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

Run the `fuzz` workflow on `main` (`gh workflow run fuzz`). Bump `version` in `package.json` and
merge to `main`. Then tag the release and push the tag.

```sh
git tag v0.5.0 && git push origin v0.5.0
```

A release with breaking changes says what to change in an annotated tag, which goes above the
generated notes.

```sh
git tag -a v0.5.0 -m "What to change when you upgrade …" && git push origin v0.5.0
```

The `release` workflow checks, tests and packs it, then stages it on npm for a maintainer to
approve. The GitHub release's notes are generated from the pull requests' labels
(`.github/release.yml`), so there is no changelog file to keep. How and why is in [Design](design.md#package).
