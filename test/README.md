# test

Tests that span the package rather than one module.

- [`examples.ts`](examples.ts): every example markz is held to, upstream and its own, filed under
  a construct or Not supported row of `syntax.md`, and `check`, which gives each its status. The
  site's Conformance page runs the same code.
- [`dialect/`](dialect/): markz's own examples in the CommonMark spec's format, one file per part
  of `syntax.md` (metadata, block, inline, not supported).
- [`syntax.ts`](syntax.ts): `syntax.md`'s outline as data.
- [`oracle.ts`](oracle.ts): micromark with GFM and directives, and the normalization.
- [`examples.test.ts`](examples.test.ts) checks every example and the filing;
  [`oracle.test.ts`](oracle.test.ts) checks the oracle itself.
- [`tree.ts`](tree.ts): the tree invariants every document must satisfy.

Unit tests of offsets and node data live next to their module in `src/`.
