# test

Tests that span the package rather than one module.

- [`examples.ts`](examples.ts): every example markz is held to, upstream and its own, filed under
  a construct id or a Not supported row's warning code, and `check`, which gives each its status. The
  site's Conformance page runs the same code.
- [`dialect/`](dialect/): markz's own examples in the CommonMark spec's format, one file per part
  of `syntax.md` (metadata, block, inline, not supported).
- [`grammar.ts`](grammar.ts): the dialect's grammar, one entry per construct with its id, part,
  origin, EBNF productions and side rules; [`ebnf.ts`](ebnf.ts) reads the notation.
- [`syntax.ts`](syntax.ts): what `syntax.md` says about each construct, by id, and the Not
  supported rows, by code.
- [`oracle.ts`](oracle.ts): micromark with GFM and directives, the normalization, and `yaml` for
  metadata.
- [`examples.test.ts`](examples.test.ts) checks every example and the filing;
  [`grammar.test.ts`](grammar.test.ts) holds the grammar to itself and to `syntax.md`;
  [`oracle.test.ts`](oracle.test.ts) checks the oracle itself.
- [`tree.ts`](tree.ts): the tree invariants every document must satisfy.

Unit tests of offsets and node data live next to their module in `src/`.
