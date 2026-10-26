# Agents

How to work in this repository: craftz's and prose's rules, which every repository shares, then what markz is and its commands. Read [README.md](README.md) and [docs/design.md](docs/design.md) first.

## craftz

This repository follows [craftz's rules](https://craftz.amitkaps.com/docs/rules.md). Run `pnpm craftz rules` before changing the toolchain, scripts, versions, CI or deploys, and change them in craftz first, never in one repository alone.

- Open a pull request with `pnpm pr "<title>"`, and add `--label <label>` in a package. It commits, runs `pnpm run verify`, pushes and turns on auto-merge. Don't wait for the merge, and add `--wait` to a session's last change. Nobody pushes to `main`.
- `pnpm craftz status` says what's live. `pnpm <tool> help <command>` says what a command does, for the version installed.
- Run tools through `pnpm run …` and `pnpm exec`, not global installs.

## Prose

Explanations go in `@prose` comments, and every Markdown file is prose too.

- Run `pnpm prose rules` before your first edit to a `@prose` comment or a `.md` file, and again after the conversation is summarized. Changing code a `@prose` comment explains counts as an edit.
- After writing, run `pnpm prose style <files>` on the files you changed, and take its advice where it reads better.

## Outline

Every file in this repository with its summary, which `pnpm run verify` writes. Run `pnpm prose outline` when it's missing.

@outline.md

## Markz

markz is one package. It holds the parser, the AST utilities and `html()`. The dialect is [docs/syntax.md](docs/syntax.md). There are no framework renderers, no parser options and no unified or remark dependencies. The gzip budget is 20 KB ([docs/design.md](docs/design.md#performance-and-size)).

- The invariant is that unsupported syntax stays literal text and produces a warning. It is never silently reinterpreted as a different supported construct.
- `docs/syntax.md` explains the language and `docs/grammar.md` states it, with a stable id per construct, as `{#id}` above its heading. `test/harness/grammar.ts` reads it with markz.
- The docs describe markz as it is, in neutral terms. Inspirations are named once, on the home page (`README.md`). Each construct's origin (CommonMark, GFM, djot, pandoc, GitHub, or markz's own) is the `Origin:` line under its heading in `grammar.md`.
- micromark is only the oracle for constructs from CommonMark or GFM. Don't let "same as GFM" leak past them.
- Every example is filed under a construct id or a Not supported row's warning code (`test/harness/examples.ts`). When the oracle disagrees with `syntax.md`, file the example as `differ` under the construct whose rule explains it. Don't bend the parser.
- markz's own examples go in `test/examples/markz/<id>.md`. Each is numbered in its fence with the next unused `markz:N`.
- `test/harness/cases.ts` holds every construct to its edges, with the grammar as the judge. When it and markz read a case differently, fix whichever is wrong. Or name the side rule that decides it and give that rule a test as narrow as its text. Never widen a settle test to quiet a failure.
- No comparison with other parsers is published, on the site or in `docs/`. The Quality page shows markz's own conformance, size and speed.

- `docs/` is the lasting record of what the dialect is, how markz is built and what building it taught. Decisions and lessons go there, and a `@prose` comment stays local to its code.
- A construct's rules live in `docs/grammar.md`. Prose cites them as ``(grammar: id; `side-rule`)``, and doesn't restate them.

## Commands

`vp` is a dev dependency. Run it through the `pnpm run` scripts, not a global install.

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

The site (markz.amitkaps.com) is the repository read by `prose build`, plus the Quality page that `pnpm quality` writes beside it. Neither is part of the package, and the site has no code of its own. CI builds both, and Cloudflare deploys the folder from `main`. Each script is one word, named for the question it answers. Two scripts may run the same file (`hotspots` is `speed.ts --profile`), and a variant of one question is a flag.
