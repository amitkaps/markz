# Plan

The build order for markz v1, from the repo skeleton to a measured 20 KB bundle. Each step is small enough to land on its own, with tests, and each leaves `pnpm check`, `pnpm test` and `pnpm build` green. The design lives in [`spec.md`](spec.md) and the dialect in [`syntax.md`](syntax.md). This file is only sequencing.

## Packaging

The output is built with `vp pack` (tsdown, driven by the `pack` section of [`vite.config.ts`](../vite.config.ts)), with no separate bundler config.

- ESM only: `dist/index.js` plus `dist/index.d.ts`, and `exports` in `package.json` points at both.
- One entry, `src/index.ts`. Anything not re-exported from it is private.
- `sideEffects: false`, so consumers can tree-shake `html`, `walk`, `textContent` and `position`.
- No runtime dependencies. `micromark`, `micromark-extension-gfm` and `micromark-extension-directive` are `devDependencies`, as the test oracle, and `yaml` is the metadata oracle.
- `prepublishOnly` runs `vp pack`, so a publish can never ship a stale `dist/`.
- `pnpm size` (`scripts/size.ts`) bundles and minifies the entry and fails above 20 KB gzip. CI runs it on every PR, from step 3 on, so growth shows in the PR that causes it.

## Steps

### 1. Repo and package setup — done

Vite+ library skeleton, CI, prose tooling, placeholder `parse()`.

### 2. AST representation — done

`src/ast.ts`: the node types (`T`, string names over numeric codes), typed arrays for `type`,
`start`, `end`, `parent`, `firstChild` and `nextSibling`, and side tables for node data and
attributes. `Builder` is how the parser writes the tree: an open-node stack, constant-time append
through a `lastChild` array only the builder keeps, and arrays that grow by doubling. `finish()`
hands over a read-only `Document` with `children(node)` as a generator, `data(node, type)` as the
checked accessor, `attributes`, `metadata` and `diagnostics`. `test/tree.ts` holds the tree
invariants every later step's documents are checked against.

### 3. Oracle harness — done

`test/oracle.ts`, `test/examples.ts` and `test/oracle.test.ts`:

- The oracle is micromark with GFM and directives, with every URL scheme allowed (markz has its
  own blocklist) and a directive handler that writes `syntax.md`'s directive shapes.
  micromark, its extensions and `yaml` are dev dependencies now.
- Comparison normalizes whitespace outside `<pre>` and smart punctuation.
- CommonMark 0.31.2 and GFM's extension examples are vendored in `test/spec/`. The exclusion list
  names a `syntax.md` row or heading for every excluded section and example, and a test checks
  that each one resolves.
- The oracle is checked against each spec's own HTML on every included example (the two
  cmark-gfm task-list examples differ only in attribute order).
- Examples that use a construct the dialect cuts are excluded by the oracle's own tokens
  (`cuts` in `test/examples.ts`), each with its `syntax.md` row. Hand lists cover whole sections
  and rules with no token, such as lazy lines.

### 4. Block pass — done

`src/block.ts`, a line-by-line scan into containers and leaves, in one linear pass. Every block construct in `syntax.md` is a case in this scan. There are no plug-ins and no extension layer:

- containers: blockquote, list, listItem, and container directives (`:::name` … `:::`)
- leaves: paragraph, ATX heading, fenced code (including ` ```=format ` raw blocks), thematic break, table, comment, `$$` math, and leaf directives (`::name`)
- block-attribute lines, attached to the next block. A heading's explicit `{#id}` is recorded here.
- the metadata block at offset 0, parsed line by line into a flat object by `syntax.md`'s value rules

Rejected constructs (setext, indented code, `~~~`, HTML, reference definitions, lazy lines) are recognised in the same scan. Each becomes paragraph text plus a diagnostic in the place it is met.

`html()` in `src/html.ts` writes every block node. Tests assert exact offsets, and until step 5 the oracle checked every example with no inline syntax. `pnpm size` removes whitespace too, so it measures real minified output (8.5 KB gzip after this step).

### 5. Inline pass, with heading ids — done

`src/inline.ts`, run on each leaf as it closes, in one pass. Every inline construct is a case in the same scanner:

- inline code, `${…}` expressions and `$…$` math, which bind tightest
- text directives (`:name[label]{…}`)
- links and images (inline form only) with an optional `{…}` directly after, and `<…>` autolinks. Expressions inside destinations and attribute values are found by the same `${` scanner.
- strong (`**`), emphasis (`_`, and `*` where formatters write it) and strikethrough (`~~`), by CommonMark's flanking with no rule of 3 and no run splitting
- backslash escapes, numeric references, `\` hard breaks and `\ ` non-breaking spaces
- smart punctuation on text: quotes by the character before them, `--`, `---`, `...`
- the rejected forms (raw HTML, named references, reference links and definitions, `*a*`, `__a__`, `~a~`), kept as text and reported

What has been read is a linked list of items, and a closer wraps the items since its opener into one node. Text nodes keep their decoded `value` and their raw source range. The inline pass returns the leaf's plain text, and the block pass settles a heading's id from it as the heading closes, against the ids used so far, so there is no step after the passes. The whole filtered oracle suite runs from here on: every included example matches. Bundle: 12.9 KB gzip.

### 6. Diagnostics — done

Every row of the "Not supported" table in `syntax.md` has cases in `src/warnings.test.ts`,
which reads the table itself: the input stays text, each warning covers exactly the rejected
characters, and its `instead` is the row's "Write instead" cell. Quiet cases hold the look-alikes
(`[sic]`, braces, `10:30`, a URL as a link's text) to no report. Warnings are in source order.
This step added the reports that were missing: bare URLs, relative autolinks, JSX, footnotes,
`+++` metadata, trailing heading attributes, multi-line attributes and attributes after inline
text.

### 7. `diagnostics` becomes `warnings` — done

`doc.warnings`, the word Svelte's `compile` and esbuild use. Nothing fails: the text is kept and
flagged, and `warnings` says that severity. Renamed before the API is published, so it costs
nothing.

### 8. `syntax.md` by the dialect's shape — done

Regroup `syntax.md` from how much is supported ("Fully supported", "Supported, with limits") to
what the dialect is made of: Metadata, Block, Inline, then Not supported and Canonical form. Each
construct says under it whether it is "as GFM" or states markz's own rule, which makes "same as
GFM" exact per construct. These headings become the test categories from step 9 on.

### 9. One example format, categorised by `syntax.md`

Every example, upstream or ours, has one shape: `{ source, section, id, input, expected, status,
reason? }`, where `section` is a `syntax.md` heading and `source` is a label (CommonMark, GFM,
markz, …). Statuses:

- **pass** or **fail** against the expected output.
- **differs**: a supported construct where markz chose a different rule (no run splitting, where
  `*` is accepted, the metadata rule). It sits under its own section, linked to the rule.
- **Not supported** examples are not skipped: they move to the table row they exercise and are
  checked to raise that row's warning and stay text.

One table maps each upstream section to a `syntax.md` section; an unmapped one fails, as an
unresolved cut reason does today. Every `syntax.md` section and table row must have examples.
markz's own cases move out of TS into Markdown files in CommonMark's spec format, with a third
part for the expected warnings; TS tests keep what data can't express (offsets, AST shape,
invariants).

### 10. Extension suites

Upstream tests for what markz shares beyond the specs, each vendored from a pinned commit and
checked against its own oracle, one PR per suite:

- micromark-extension-gfm-table and -strikethrough fixtures (autolink-literal and footnote ones
  land in Not supported);
- micromark-extension-directive's cases, extracted from its test file, with #33's bare and
  spaced forms in Not supported or differs;
- yaml-test-suite, kept to the tags inside the metadata subset, checked against `yaml`;
- github-slugger's fixtures for heading ids.

Tests of an oracle's options or API (directive handlers, `allowDangerousHtml`) are filtered out
at import, with the reason in the suite's README.

### 11. The site by the dialect

The Conformance page becomes Metadata, Block, Inline and Not supported, each opening to its
constructs with their examples, sources and statuses. Summary cards above it: correctness now,
then performance, size, robustness, a real-world corpus (warnings per file in the migrated
Markdown), formatter agreement (oxfmt doesn't change the parse) and HTML safety as steps 13 and
14 produce them.

### 12. Traversal and position utilities

Public API, kept minimal: `parse`, `html`, `walk` (`enter`/`exit`), `textContent`, `position`. Lines are 1-based and columns are 0-based. Nothing else is exported until a consumer needs it.

### 13. Robustness and fuzzing

- A grammar-based generator of documents in the shared grammar, fed to the oracle.
- Malformed input, CRLF and lone `\r`, BOM, and astral-plane offsets.
- Adversarial unclosed openers, with a timing check that fails on super-linear growth. Code spans and math already record a failed scan; link destinations, `<!--` and attribute blocks don't yet.
- Unclosed `${` is quadratic today: 80,000 of them in one paragraph take about 100 s, 16 times the time for 4 times the input. One failed scan doesn't settle later ones (`${a ${b}` has a valid second expression), so the fix is to reuse the failed scan's brace depths for every `${` it passed, rather than a flag.
- A multi-MB document that guards against quadratic behaviour.

### 14. Benchmarks and bundle size

`bench/` (not published): parse throughput and AST memory versus micromark, markdown-it, marked, markdown-exit and Comark. The size gate is already in CI; this step adds the comparisons.

## Definition of done for v1

- `import { parse, html } from 'markz'` works with no options and no runtime dependencies.
- `html()` is identical to micromark + GFM on the filtered spec suites and on fuzzed documents in the shared grammar.
- Every rejected construct produces its warning.
- `dist/` is at most 20 KB gzip, and CI enforces it.
- The README documents the API and links to `syntax.md`.
