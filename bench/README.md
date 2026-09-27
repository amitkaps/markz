# bench

How fast markz is, how much memory it keeps and how large it is, next to micromark, remark,
markdown-it, markdown-exit, marked and Comark. This is a private workspace package, like
`docs/`: the competitors are its dependencies and never reach the library. It measures this
commit's build of markz.

```sh
pnpm bench                # a quick look, in Vitest: a few minutes, MB/s per group as it lands
pnpm bench constructs     # just the per-construct look
mise install              # Hyperfine, pinned in mise.toml, for the full run
pnpm bench:full           # everything, each parser in its own process: most of an hour
pnpm bench:update-results # copy the latest full results to the site (docs/src/lib/bench.json)
```

There are two ways to run it, for two purposes:

- **`pnpm bench` is for looking.** It runs every parser through Vitest's benchmark runner
  (Tinybench) on the document tiers and the scaling curve, and prints Vitest's table and a line
  in MB/s for each group. markz is also compared with its own last run on this machine
  (`results/baseline/`), which shows whether a change moved it. All the parsers share one worker,
  so these numbers are never published.
- **`pnpm bench:full` is for publishing.**
  - Hyperfine times whole processes, one parser each.
  - It adds cold start, memory, pathological input and bundle size.
  - It writes `results/latest.json`, which is gitignored, since it belongs to the machine it ran
    on.
  - The site shows only the snapshot that `bench:update-results` wrote and a commit checked in.

CI runs `pnpm --filter markz-bench smoke`, which exercises every adapter once and times nothing.
Throughput is never a CI gate: the 20 KB size gate stays in `scripts/size.ts`, and linear time is
held by `test/complexity.test.ts`.

## Files

- [`corpus.ts`](corpus.ts): the tiers and their two variants, built from [`fixtures/`](fixtures/)
  into `corpus/` with a hash
- [`parsers.ts`](parsers.ts): one adapter per parser, per mode
- [`cli.ts`](cli.ts): one timed command, which is what Hyperfine runs
- [`memory.ts`](memory.ts): retained heap and RSS per document, with GC as a diagnostic
- [`size.ts`](size.ts): each parser's parse-to-HTML entry, bundled and compressed
- [`compare.bench.ts`](compare.bench.ts): the quick look, in Vitest
- [`constructs.bench.ts`](constructs.bench.ts): one construct at a time, from the grammar's
  cases, to see which constructs carry markz's time
- [`run.ts`](run.ts): the full suite, which writes the results

## Reading the numbers

**Two modes.** They are there so a parser isn't slower only because it does more:

- _Common_: every parser at its defaults (GFM on), reading only the blocks they all share. It
  compares like with like.
- _Dialect_: each parser configured as close to markz as its plugins get, reading the documents
  whole. markz reads constructs it cuts as text with a warning, and so still does work on them.

| Parser        | Common                   | Dialect                                                                        |
| ------------- | ------------------------ | ------------------------------------------------------------------------------ |
| markz         | its dialect (no options) | the same                                                                       |
| micromark     | GFM                      | tables, strikethrough, task lists, directives, frontmatter                     |
| remark        | remark-gfm               | the same GFM parts as micromark, remark-frontmatter, remark-directive          |
| markdown-it   | default preset           | task lists, frontmatter, `$` math (untypeset), `:::` containers                |
| markdown-exit | default preset           | as markdown-it                                                                 |
| marked        | GFM                      | the same: it has no plugins here                                               |
| Comark        | no default plugins       | default plugins (frontmatter, raw HTML, …); components and attributes are core |

Some things can't be matched exactly. Math is on only where the plugin parses without
typesetting: micromark's and Comark's run KaTeX, which is rendering, not parsing. Raw HTML and
reference links, which markz cuts, can't be turned off in most of the others.

**Two measures.** _Parse + HTML_ is the same job for all of them. _Structured parse_ is each
parser's public parse without rendering, and the structures aren't equivalent:

- markz: a flat tree with offsets;
- remark: mdast, a nested tree with positions;
- markdown-it and markdown-exit: a flat token stream;
- marked: a nested token list;
- Comark: a nested array tree;
- micromark alone has none; remark is its tree.

That difference is part of the result, not noise to explain away.

**Warm and cold.** Throughput is warm: each command runs at `k` and `2k` passes, and the
difference is divided by `k`, which cancels the ~40 ms Node takes to start. _Cold start_ is one
whole process over the agent tier, next to a process that loads nothing: what a CLI or a build
step pays.

**Tiers.**

- _Agent_ and _public_ are the headline, side by side: one is agent-written, the other written by
  people.
- _Spec_ is the CommonMark spec, for setting beside other parsers' published numbers.
- _Scaling_ is the curve from 10 KB to 10 MB (to 1 MB in `pnpm bench`), parse + HTML in the
  common mode.
- _Pathological_ inputs are there to show scaling behaviour, not as a representative workload,
  and never feed a headline. A timeout or a crash there is a result.

**Memory.** Memory is the retained heap per document: what holding a structured result keeps
alive, whatever each parser chooses to keep. It is shown as bytes per source byte, beside the
RSS delta. GC counts and times are diagnostics only.

**Size.** Each parser's parse-to-HTML entry, with its dialect configuration, is minified and
gzipped the way `scripts/size.ts` measures markz. Lazily loaded chunks count.
