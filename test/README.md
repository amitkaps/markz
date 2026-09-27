# test

Tests that span the package rather than one module.

- [`examples.ts`](examples.ts): every example markz is held to, upstream and its own, filed under
  a construct id or a Not supported row's warning code, and `check`, which gives each its status. The
  site's Conformance page runs the same code.
- [`examples/`](examples/): every example's file. [`upstream/`](examples/upstream/) holds the
  vendored suites, one file each, with the sweeps curation keeps off the Conformance page in
  [`upstream/stress/`](examples/upstream/stress/). [`fences.ts`](fences.ts) reads and writes the
  one format they are in. [`markz/`](examples/markz/) holds markz's own, one file per construct
  and one for the Not supported rows, numbered as `markz:17`, some labelled with the edge they
  try.
- [`grammar.ts`](grammar.ts): the dialect's grammar, one entry per construct with its id, part,
  origin, EBNF productions and side rules; [`ebnf.ts`](ebnf.ts) reads the notation and recognizes
  a string by it.
- [`cases.ts`](cases.ts) and [`cases.test.ts`](cases.test.ts): every construct at its edges.
  Cases written from its productions, and their one-character neighbours, must be read as the
  grammar reads them, or be settled by a named side rule or a Not supported row. The edges the
  grammar can't write, ambiguous and unclosed, are dialect examples labelled with their category.
  `CASES_RUNS` and `CASES_SEED` search longer.
- [`syntax.ts`](syntax.ts): what `syntax.md` says about each construct, by id, and the Not
  supported rows, by code.
- [`oracle.ts`](oracle.ts): micromark with GFM and directives, the normalization, and `yaml` for
  metadata.
- [`examples.test.ts`](examples.test.ts) checks every example and the filing;
  [`grammar.test.ts`](grammar.test.ts) holds the grammar to itself and to `syntax.md`;
  [`oracle.test.ts`](oracle.test.ts) checks the oracle itself.
- [`tree.ts`](tree.ts): the tree invariants every document must satisfy.
- [`stress.test.ts`](stress.test.ts): the upstream examples kept off the
  Conformance page, held only to finishing, not throwing, a valid tree and a warning for every
  bare URL GFM links.

- [`fuzz/`](fuzz/) and [`fuzz.test.ts`](fuzz.test.ts): noise, mutated examples and documents
  written from the grammar, each held to being sound, and the CommonMark and GFM ones to the
  oracle. `pnpm fuzz` searches longer, with a random seed.
- [`complexity.test.ts`](complexity.test.ts): every adversarial pattern in
  [`fuzz/adversarial.ts`](fuzz/adversarial.ts), and a multi-megabyte document, held to linear time.

Unit tests of offsets and node data live next to their module in `src/`.
