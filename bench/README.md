# bench

The published comparison: how fast markz is, how much memory it keeps and how large it is, next
to micromark, remark, markdown-it, markdown-exit, marked and Comark. This is a private workspace
package, like `docs/`: the competitors are its dependencies and never reach the library. It
measures this commit's build of markz. markz alone, while you work, is `pnpm bench`
([`test/speed.ts`](../test/speed.ts)), in about two seconds.

```sh
pnpm compare          # every parser, each in a fresh process: about half a minute
mise install          # Hyperfine, pinned in mise.toml, for the deep run
pnpm compare --deep   # adds 10 MB, the formatted tier, pathological input and cold start
pnpm snapshot         # copy the latest results to the site, and this README's adapters table
```

`pnpm compare` writes `results/latest.json`, which is gitignored, since it belongs to the machine
it ran on. The site shows only the snapshot `pnpm snapshot` wrote and a commit checked in, from a
deep run on a quiet machine.

CI runs `pnpm --filter markz-bench smoke`, which exercises every adapter once and times nothing.
Throughput is never a CI gate: the 20 KB size gate stays in `scripts/size.ts`, and linear time is
held by `test/complexity.test.ts`.

## Files

- [`corpus.ts`](corpus.ts): writes the test harness's documents and variants
  ([`test/harness/corpus.ts`](../test/harness/corpus.ts)) to `corpus/` with a hash, adding the
  tiers only timing needs: the scaling sizes, one construct at a time, and pathological input
- [`parsers.ts`](parsers.ts): one adapter per parser, per mode, each declaring its configuration
  and what it reads
- [`worker.ts`](worker.ts): one parser's fresh process, running its cells on a time budget, and
  retained memory after parse
- [`size.ts`](size.ts): each parser's parse-to-HTML entry, bundled and compressed, cached by
  package version
- [`run.ts`](run.ts): the comparison, which writes the results

## Reading the numbers

**Two modes.** They are there so a parser isn't slower only because it does more:

- _Common_: the same input workload for every parser, the documents cut to the blocks they all
  read alike. It means the same work, not the same defaults: each parser's configuration is in the
  table below.
- _Dialect_: each parser configured as close to markz as its plugins get, reading the documents
  whole. markz reads constructs it cuts as text with a warning, and so still does work on them.

The table is generated: each adapter in `parsers.ts` declares its configuration and what it reads,
the run reports them, and `pnpm snapshot` writes them here.

<!-- adapters -->

| Parser        | Structured parse                   | Common: configuration                                     | Dialect: configuration                                                                                                                                      | Dialect: reads beyond CommonMark                                                       |
| ------------- | ---------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| markz         | flat tree with offsets             | none: it has no options                                   | none: it has no options                                                                                                                                     | tables, strikethrough, task lists, directives, metadata, math, attributes, expressions |
| micromark     | none                               | micromark-extension-gfm                                   | the GFM table, strikethrough and task-list extensions, directive (each as its element), frontmatter                                                         | tables, strikethrough, task lists, directives, frontmatter                             |
| remark        | nested tree with positions (mdast) | remark-parse, remark-gfm, remark-rehype, rehype-stringify | remark-parse, the GFM table, strikethrough and task-list parts, remark-frontmatter, remark-directive (each as its element), remark-rehype, rehype-stringify | tables, strikethrough, task lists, directives, frontmatter                             |
| markdown-it   | flat token stream                  | default preset                                            | default preset, front-matter, @mdit/plugin-tex (untypeset), container (any name), task-lists                                                                | tables, strikethrough, task lists, frontmatter, dollar math, ::: containers            |
| markdown-exit | flat token stream                  | default preset                                            | default preset, front-matter, @mdit/plugin-tex (untypeset), container (any name), task-lists                                                                | tables, strikethrough, task lists, frontmatter, dollar math, ::: containers            |
| marked        | nested token list                  | { gfm: true }: it has no plugins here                     | { gfm: true }: it has no plugins here                                                                                                                       | GFM                                                                                    |
| comark        | nested array tree                  | { registerDefaultPlugins: false }                         | { registerDefaultPlugins: true }                                                                                                                            | GFM, components, attributes, frontmatter, raw HTML                                     |

<!-- /adapters -->

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

**Warm and cold.** Throughput is _warm_: each parser runs in a fresh process of its own, one
after another, and each figure is the median of repeated passes after one unmeasured pass, which
is what a server or a watch build pays per document. A slow parser on a large file gets one timed
pass, after an earlier cell has warmed it, and shows no spread. _Cold start_ (deep) is a whole new
process reading the agent tier once, timed by Hyperfine next to a process that loads nothing:
what a CLI or a one-off build step pays.

**Tiers.**

- _Agent_ and _public_ are the headline, side by side. _Agent_ is documents written by coding
  agents in real repos (markz's and its consumers'); _public_ is documentation written by people.
- _Spec_ is the CommonMark spec, for setting beside other parsers' published numbers.
- _Scaling_ is the curve from 10 KB to 1 MB (10 MB in a deep run), parse + HTML in the common
  mode. It is approximately linear when time per byte grows by less than 1.5× from 100 KB to the
  largest size.
- _Construct_ is one construct over and over, written from the grammar, markz beside
  markdown-exit where the construct is CommonMark's or GFM's. It shows where the time goes, and
  never feeds a headline.
- _Pathological_ inputs are there to show scaling behaviour, not as a representative workload,
  and never feed a headline. A timeout or a crash there is a result.

**Retained memory after parse.** What holding one structured result keeps alive, whatever each
parser chooses to keep, on a 10 KB document: the heap after a full collection with twenty results
held, less the heap before, as bytes per source byte. The RSS change is beside it, as a
diagnostic.

**Size.** A table of its own: each parser's parse-to-HTML entry for each mode, what it imports and
reads, minified, gzip and brotli, bundled the way `scripts/size.ts` measures markz. Lazily loaded
chunks count. A size is cached until its entry or a package version changes.
