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
  (commit `75da8c5`), and `frontmatter.json`, from
  [micromark-extension-frontmatter](https://github.com/micromark/micromark-extension-frontmatter/blob/f05bf24461d31041f37f4562fd48877af4dcc67b/test/index.js)
  (commit `f05bf24`), written by [`scripts/vendor.ts`](../../scripts/vendor.ts). Each fixture
  section is an example, with GitHub's HTML for it, and each `micromark(input, …)` in
  `test/index.js` with a literal input is one, numbered in that order, under its `test()` group
  and title. The expected HTML is kept only where the options are written out in place: the
  directive suite's `options(…)` helper installs handlers, so its examples have none, and the
  oracle isn't checked against them. Left out: tests of an
  option that changes the syntax (`disable.null`, `singleTilde`, a TOML or custom matter), the fixture loops, whose input
  isn't a literal, repeated inputs, and the 80,000-line `large.offline.md`, which belongs with step 15's stress tests. The
  directive suite is curated to 156 of its 251: the name, label and attribute rules it repeats for
  each kind of directive, and each directive next to a block form markz cuts, are in
  [`../stress/`](../stress/).
- `yaml.json`: the [yaml-test-suite](https://github.com/yaml/yaml-test-suite/tree/da267a5c4782e7361e82889e76c0dc7df0e1e870/src)
  (commit `da267a5`), also by `vendor.ts`. Each test, and each variant, is its YAML between `---`
  fences, with the suite's JSON, or `error` for a test marked `fail`. It is kept to what the
  `yaml` package reads as a mapping or rejects: top-level sequences and scalars (94) aren't
  metadata anywhere, and tests with document markers or directives (151) can't sit inside the
  fences. Of the 159 left, curation keeps valid blocks of plain `key: value` lines and the first
  test of each YAML feature (anchors, tags, flow, block scalars, …): 29. The rest are in
  [`../stress/`](../stress/).
- `slugger.json`: [github-slugger](https://github.com/Flet/github-slugger/blob/3461c4350868329c8530904d170358bca1d31448/test/fixtures.json)
  (commit `3461c43`), GitHub's ids for 78 strings, also by `vendor.ts`. Each is a `#` heading with
  its ASCII punctuation escaped, and the harness puts each after the ones before it, so repeats
  are numbered as in the suite. The four that start or end with a space are left out, since a
  heading's text is trimmed.
- `gfm-autolink-literal.json`: the tests of
  [micromark-extension-gfm-autolink-literal](https://github.com/micromark/micromark-extension-gfm-autolink-literal/tree/618170c86639742036ecf666d975a6ebac5aac50/test)
  (commit `618170c`), by `vendor.ts` as the other extensions are: 15 fixture sections and 24
  inline tests. markz cuts bare URLs, so these test the `bare-url` warning: one for each URL GFM
  links, and none elsewhere. Left out: the three `disable.null` tests, and the fixtures that sweep
  a character class, which are in [`../stress/`](../stress/).
