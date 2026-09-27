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

### 9. One example format, categorised by `syntax.md` — done

`test/examples.ts` files every example, upstream or markz's own, under a `syntax.md` construct or
Not supported row, with its source as a label, and `check` gives each a status: **pass**,
**fail** or **differs** (a construct markz keeps under its own rule, such as no run splitting). A
table maps each upstream section to a construct, and oracle tokens move an example that uses a
cut form to that row, where it passes only if the row's warning fires; if markz raises none, it
read the input as supported and the example is compared with the oracle. markz's own examples are
in `test/dialect/*.md`, in CommonMark's spec format, with the text each warning covers as a third
part. Every construct and row has examples, and the TS tests keep only offsets and node data.
The Conformance page groups by part and construct from the same `check`.

Counts: 340 upstream examples compared with the oracle (310 before), 301 that use a cut form now
tested for their warning instead of skipped, 35 differing by design, and 91 of markz's own. The
new checks found five gaps, all fixed: a second numbered item and an empty `-` item were
reported as lazy lines, named references in link destinations, titles and fence info strings
weren't reported, `<DIV>` was reported as JSX, and an HTML-block opener with no complete tag
(`<div class`, `<?php`) wasn't reported.

### 10. Warning codes — done

Every warning has a stable `code` from one table, `src/warnings.ts`, which also holds its default
message and `instead`; `Builder.warn(code, start, end, message?)` takes both from it. Each form
`syntax.md` cuts has one code, in the new Code column of its Not supported table, and the other
warnings (`duplicate-id`, `orphan-attributes`, `comment-trailing-text`, `metadata-*`) are named
under their construct. Tests and examples key on codes, never on wording: every code must be
named in `syntax.md`, and each row's "Write instead" must be its code's.

### 11. The grammar — done

The dialect as data, in `test/grammar.ts` so it never ships: each construct with a stable id, its part, its
origin and its productions in EBNF style, with the rules EBNF can't state (container prefixes,
fence lengths, emphasis matching) as named side rules. The origin names the earliest layer that
defines the construct, in order: CommonMark, GFM, micromark-extension-directive, djot, then
markz's own (math is pandoc's rule in GitHub's HTML shape). Examples and `syntax.md` refer to
constructs by id, so rewording a heading breaks nothing, and the step 15 fuzzer generates
documents from the productions. `spec.md` states the parsing invariant: single pass,
deterministic, grammar-directed, with bounded local lookahead, where every lookahead is bounded
or remembers its failure.

Each construct's id is a `{#id}` line above its `syntax.md` heading, which markz itself renders
as the heading's anchor. The tests check the grammar is well formed (every name defined, every
production reachable from `document`) and that it matches `syntax.md`: the same 22 ids, in order,
under the same parts, each opening with its origin's lead. Renaming a heading now breaks nothing.
Most constructs are relabelled "As CommonMark": GFM adds only tables, strikethrough and task
items to what markz keeps. The Conformance page shows each construct's heading from its id.

### 12. Extension suites

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

**Tables and strikethrough — done.** `scripts/vendor.ts` reads an extension's fixtures (one
example per headed section, with GitHub's HTML for it) and each `micromark(input, …)` in its
`test/index.js` through the TypeScript compiler. Every example is compared with markz's oracle,
so only options that change the syntax (`disable`, `singleTilde`) drop a test; a handler or
`allowDangerousHtml` only changes the HTML. That adds 99 table and 16 strikethrough examples.
Strikethrough passed as it was. The table suite found two gaps, both fixed: a delimiter row with
a colon and no pipe (`a` over `:-:`) was a paragraph with no warning, where GFM has a table; and
a row indented four columns continued the table or became its delimiter row, where the grammar's
`indent` stops at three.

**Directives — done.** 251 examples from micromark-extension-directive's test file, filed by
its `test()` groups (text, leaf, container), and by the oracle's tokens for the two that mix
kinds. #33's bare `:name` passes as it is, since the oracle writes it back as text. Two gaps,
both fixed: a named reference in an attribute value (`title="a&apos;b"`) got no warning, and an
empty container label (`:::a[]`) wrote an empty label element. 38 examples differ by design:
micromark's wider attribute syntax (bare keys, single quotes, spaces around `=`, `.a.b`, braces
across lines) is text in markz, names start with a letter, a container's label is plain text,
and markz has no 32-level bracket limit.

### 13. The site by the dialect

The Conformance page becomes Metadata, Block, Inline and Not supported, each opening to its
constructs with their examples, sources and statuses. Summary cards above it: correctness now,
then performance, size, robustness, a real-world corpus (warnings per file in the migrated
Markdown), formatter agreement (oxfmt doesn't change the parse) and HTML safety as steps 15 and
16 produce them.

### 14. Traversal and position utilities

Public API, kept minimal: `parse`, `html`, `walk` (`enter`/`exit`), `textContent`, `position`. Lines are 1-based and columns are 0-based. Nothing else is exported until a consumer needs it.

### 15. Robustness and fuzzing

- A generator of documents from `test/grammar.ts`'s productions and side rules, fed to the oracle.
- Malformed input, CRLF and lone `\r`, BOM, and astral-plane offsets.
- Adversarial unclosed openers, with a timing check that fails on super-linear growth. Code spans and math already record a failed scan; link destinations, `<!--` and attribute blocks don't yet.
- Unclosed `${` is quadratic today: 80,000 of them in one paragraph take about 100 s, 16 times the time for 4 times the input. One failed scan doesn't settle later ones (`${a ${b}` has a valid second expression), so the fix is to reuse the failed scan's brace depths for every `${` it passed, rather than a flag.
- A multi-MB document that guards against quadratic behaviour.

### 16. Benchmarks and bundle size

`bench/` (not published): parse throughput and AST memory versus micromark, markdown-it, marked, markdown-exit and Comark. The size gate is already in CI; this step adds the comparisons.

## Definition of done for v1

- `import { parse, html } from 'markz'` works with no options and no runtime dependencies.
- `html()` is identical to micromark + GFM on the filtered spec suites and on fuzzed documents in the shared grammar.
- Every rejected construct produces its warning.
- `dist/` is at most 20 KB gzip, and CI enforces it.
- The README documents the API and links to `syntax.md`.
