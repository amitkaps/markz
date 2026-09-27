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
  (commit `895451f`), and `directive.json`, from
  [micromark-extension-directive](https://github.com/micromark/micromark-extension-directive/blob/75da8c52a3f40de6485ac1928fdcdefd7ea0c3fb/test/index.js)
  (commit `75da8c5`), written by [`scripts/vendor.ts`](../../scripts/vendor.ts). Each fixture
  section is an example, with GitHub's HTML for it, and each `micromark(input, …)` in
  `test/index.js` with a literal input is one, numbered in that order, under its `test()` group
  and title. The expected HTML is kept only where the options are written out in place: the
  directive suite's `options(…)` helper installs handlers, so its examples have none, and the
  oracle isn't checked against them. Left out: tests of an
  option that changes the syntax (`disable.null`, `singleTilde`), the fixture loops, whose input
  isn't a literal, repeated inputs, and the 80,000-line `large.offline.md`, which belongs with step 15's stress tests.
- `yaml.json`: the [yaml-test-suite](https://github.com/yaml/yaml-test-suite/tree/da267a5c4782e7361e82889e76c0dc7df0e1e870/src)
  (commit `da267a5`), also by `vendor.ts`. Each test, and each variant, is its YAML between `---`
  fences, with the suite's JSON, or `error` for a test marked `fail`. It is kept to what the
  `yaml` package reads as a mapping or rejects: top-level sequences and scalars (94) aren't
  metadata anywhere, and tests with document markers or directives (151) can't sit inside the
  fences. That leaves 159.
