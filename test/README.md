# test

Tests that span the package rather than one module, by what each file is. The statement of the
dialect is [`prose/grammar.md`](../prose/grammar.md); here are the inputs, the harness that reads
and judges them, and the checks, each reporting by construct id.

- [`examples/`](examples/): the inputs. [`upstream/`](examples/upstream/) holds the vendored
  suites, one file each, with the sweeps curation keeps off the Conformance page in
  [`upstream/stress/`](examples/upstream/stress/). [`markz/`](examples/markz/) holds markz's own,
  one file per construct and one for the Not supported rows, numbered as `markz:17`, some labelled
  with the edge they try.
- [`harness/`](harness/): the machinery the checks and the site's Conformance page share, with no
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
- [`complexity.test.ts`](complexity.test.ts): every adversarial pattern, and a multi-megabyte
  document, held to linear time. It runs last, on its own.

`pnpm test` searches from a fixed seed. `pnpm test:long` runs the construct and robustness checks
fifty times as far from a random one; `SEARCH` and `SEED` set both by hand.

Unit tests of offsets and node data live next to their module in `src/`.
