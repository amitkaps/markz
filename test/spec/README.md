# spec

Vendored upstream examples, read-only inputs to the oracle harness. The HTML in them is each
suite's own expectation; markz is compared with micromark, not with it, and the oracle is checked
against it where it has any.

- `commonmark.json`: [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/spec.json), as
  published.
- `gfm.json`: the `(extension)` sections of
  [cmark-gfm's `test/spec.txt`](https://github.com/github/cmark-gfm/blob/499789b49373bfa045d0e7547e5ee63444c77bca/test/spec.txt)
  (commit `499789b`), converted to the same shape. Example numbers are the GFM spec's, `→` is
  turned back into a tab, and the section names lose their ` (extension)` suffix.
- `gfm-table.json` and `gfm-strikethrough.json`: the tests of
  [micromark-extension-gfm-table](https://github.com/micromark/micromark-extension-gfm-table/tree/1511204dae5a01e81588cee417ecd4fb8d2c8aff/test)
  (commit `1511204`) and
  [micromark-extension-gfm-strikethrough](https://github.com/micromark/micromark-extension-gfm-strikethrough/tree/895451f924c543c6a528e80b7340236e164eb384/test)
  (commit `895451f`), written by [`scripts/vendor.ts`](../../scripts/vendor.ts). Each fixture
  section is an example, with GitHub's HTML for it, and each `micromark(input, …)` in
  `test/index.js` with a literal input is one, numbered in that order. Left out: tests of an
  option that changes the syntax (`disable.null`, `singleTilde`), the fixture loops, whose input
  isn't a literal, repeated inputs, and the 80,000-line `large.offline.md`, which belongs with step 15's stress tests.
