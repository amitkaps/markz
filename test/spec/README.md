# spec

Vendored spec examples, read-only inputs to the oracle harness. The HTML in them is each spec's
own expectation; markz is compared with micromark, not with it.

- `commonmark.json`: [CommonMark 0.31.2](https://spec.commonmark.org/0.31.2/spec.json), as
  published.
- `gfm.json`: the `(extension)` sections of
  [cmark-gfm's `test/spec.txt`](https://github.com/github/cmark-gfm/blob/499789b49373bfa045d0e7547e5ee63444c77bca/test/spec.txt)
  (commit `499789b`), converted to the same shape. Example numbers are the GFM spec's, `→` is
  turned back into a tab, and the section names lose their ` (extension)` suffix. GFM has no
  footnote examples; footnotes get fixtures of their own.
