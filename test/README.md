# test

Tests that span the package rather than one module, and the tools that serve them. The
statement of the dialect is [`docs/grammar.md`](../docs/grammar.md). Here are the inputs, the
harness that reads and judges them, the checks, and the tools that measure markz and show it.

- [`examples/`](examples/): examples, each a small input with what it must give. [`upstream/`](examples/upstream/) holds the vendored
  suites, one file each, with the sweeps curation keeps off the Quality page in
  [`upstream/stress/`](examples/upstream/stress/). [`markz/`](examples/markz/) holds markz's own,
  one file per construct and one for the Not supported rows, numbered as `markz:17`, some labelled
  with the edge they try.
- [`documents/`](documents/): real documents, written by agents and by people, vendored and
  pinned. The variants built from them are never committed.
- [`harness/`](harness/): the machinery the checks and the Quality page share, with no
  tests of its own: the grammar, the examples and their filing, the oracles, the cases at each
  construct's edges, generation and soundness.

The checks:

- [`dialect.test.ts`](dialect.test.ts): what the others stand on. The grammar is well formed and
  is `syntax.md`'s, every warning is named there, the filing names real examples and numbers
  markz's own once, each vendored file is as `fences.ts` writes it, and the oracles match the
  suites' own answers.
- [`constructs.test.ts`](constructs.test.ts): each construct in its own `describe`, held to its
  upstream examples, its own examples by edge, and the cases generated at its edges; each Not
  supported row to its examples.
- [`robustness.test.ts`](robustness.test.ts): noise, mutated examples and documents written from
  the grammar, each held to being sound, and the CommonMark and GFM ones to the oracle; and the
  upstream sweeps, held to finishing, a valid tree and a warning for every bare URL GFM links.
- [`documents.test.ts`](documents.test.ts): each real document, sound as written and formatted,
  its common blocks as micromark reads them, meaning the same after oxfmt, and warning as its
  snapshot in [`__snapshots__/`](__snapshots__/) says.
- [`docs.test.ts`](docs.test.ts): each page in [`docs/`](../docs/) read without a warning, and its
  relative links going to files that exist.
- [`complexity.test.ts`](complexity.test.ts): every adversarial pattern, and a multi-megabyte
  document, held to linear time. It runs last, on its own.

The tools are plain Node scripts, each a `pnpm` command. They aren't part of `pnpm test`.

- [`size.ts`](size.ts) is `pnpm size`, the 20 KB gzip budget. CI runs it on every PR, and it
  fails above the budget.
- [`speed.ts`](speed.ts) is `pnpm bench`: markz alone, on the working tree, in a few seconds, in
  MB/s per document tier and per construct, against this machine's baseline with a noise band.
  `--compare` times it beside other parsers, for our own insight.
  [`harness/node.ts`](harness/node.ts) lets it load `src/` and the harness.
- [`vendor.ts`](vendor.ts) is `pnpm vendor`. It turns an upstream suite's tests into examples for
  [`examples/upstream/`](examples/upstream/), from a local clone at the pinned commit. It is run
  by hand when a suite is re-pinned.
- [`quality/`](quality/) is `pnpm quality`, the Quality page that the site shows beside prose's
  pages.

`pnpm test` searches from a fixed seed. `pnpm fuzz` runs the construct and robustness checks
fifty times as far from a random one; `SEARCH` and `SEED` set both by hand.

Unit tests of offsets and node data live next to their module in `src/`.
