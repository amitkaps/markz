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
constructs by id, so rewording a heading breaks nothing, and the step 16 fuzzer generates
documents from the productions. `spec.md` states the parsing invariant: single pass,
deterministic, grammar-directed, with bounded local lookahead, where every lookahead is bounded
or remembers its failure.

Each construct's id is a `{#id}` line above its `syntax.md` heading, which markz itself renders
as the heading's anchor. The tests check the grammar is well formed (every name defined, every
production reachable from `document`) and that it matches `syntax.md`: the same 22 ids, in order,
under the same parts, each opening with its origin's lead. Renaming a heading now breaks nothing.
Most constructs are relabelled "As CommonMark": GFM adds only tables, strikethrough and task
items to what markz keeps. The Conformance page shows each construct's heading from its id.

### 12. Extension suites — done

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
and markz has no 32-level bracket limit. Of micromark's wider attribute syntax, markz then took one form with a real use,
bare keys for HTML's boolean attributes (`:::details{open}`), and a `{…}` after a directive, link
or image that doesn't parse now warns `attribute-syntax` rather than staying silent text.

**YAML and frontmatter — done.** Two suites, one per half of the metadata rule. The
yaml-test-suite tests the values: each test's YAML between `---` fences, held to the `yaml`
package key by key, so a key markz keeps must have YAML's value and a block YAML rejects must warn.
It is kept to what `yaml` reads as a mapping or rejects, without document markers: 159 of the 406
tests and variants. micromark-extension-frontmatter's tests (18) test the block, and the extension
joined the oracle, so every example checks that markz finds the same block micromark does.

They changed the rule. A closed `---` block at offset 0 is now metadata whatever it holds, as
micromark and GitHub read it, and a line markz can't read is a warning; before, one such line made
the whole block Markdown. An unclosed block stays a rule and Markdown, as everywhere but
gray-matter, and warns `metadata-unclosed` when it looks like metadata. The suites found one bug:
a key whose value continued on later lines (`one:` over `- 2`, or an open `{`) was kept as `null`;
it is now skipped with the lines that continue it. All 159 YAML tests are now read as metadata:
9 clean, 98 valid YAML with warnings, and 52 invalid YAML, all warned.

**Heading ids — done.** github-slugger's fixtures, GitHub's ids for 78 strings, each a heading in
one document, checked against github-slugger itself. markz's slug had drifted from GitHub's in two
ways, both fixed: it collapsed and trimmed whitespace where GitHub turns each space into `-`
(`a - b` is `a---b`), and it kept every number and dropped every symbol, where GitHub keeps only
decimal digits and keeps alphabetic symbols (`Ⓐ`). github-slugger's 8 KB class comes down to four
Unicode properties, which match 77 of the 78 fixtures; the last differs because its class is
Unicode 13's.

**Autolink literals — done.** micromark-extension-gfm-autolink-literal's 53 tests, most of them
whole fixture documents of URLs. markz cuts bare URLs, so the row's check got stricter: one
`bare-url` warning must overlap each URL GFM links, and none may sit where it links nothing, so a
reader never loses a link silently. Where the warning ends is left approximate, since GFM's tail
trimming is the rule the dialect cuts. The suite found a hang, `www._` looped forever, and that
markz both missed links (`WWW.` in capitals, `點看.com`, a URL after `_` or a digit) and warned
where GFM links nothing (`_` in a domain's last two segments, `react@0.14.1`, after a form feed,
inside an unclosed `[`). Fixed by taking GFM's rules for the character before a URL and for its
domain. GitHub links an email after `:` and anything after a tab where micromark doesn't; markz
warns as GitHub links, and those four fixtures are in `oracleDiffers`.

**Curation — done.** Vendoring whole suites filled the page with variants of forms markz cuts:
150 of the 159 YAML tests only showed that markz warns on YAML it doesn't read, and most of the
autolink suite swept `http://` past each punctuation character. `vendor.ts` now curates: a suite
keeps what tests a decision markz makes, and the rest goes to `test/stress/`, held only to
finishing, not throwing, a valid tree and a warning for each bare URL GFM links. YAML keeps valid
plain `key: value` blocks and the first test of each YAML feature, 29 of 159; the autolink suite
keeps its hand-written fixtures and inline tests, 39 of 53. The directive suite keeps 156 of 251: it tests the
shared name, label and attribute rules once per kind of directive, and a directive before and
after every block form, cut ones included; a rule is now kept once, and the cut neighbours go. Footnotes and math are vendored the
same way.

**Footnotes — done.** micromark-extension-gfm-footnote, curated to 20 of 49. Like bare URLs,
the `footnote` row now needs a warning over each call and definition GFM reads, though not the
reverse: GFM makes `[^x]` a footnote only when `x` is defined, which markz doesn't look for. The
suite found two misses, both fixed: `![^1]` is a `!` before a footnote in GFM, not an image, and a
`[^1]:` can start a definition partway through a paragraph.

**Math — done.** micromark-extension-math's 30 tests, held to its math spans rather than its
KaTeX HTML. 18 match and 12 differ by design: the extension pairs dollar runs as code spans pair
backticks, where markz follows pandoc's single `$`, and its `$$` fence takes a meta string. The
suite found one bug, fixed: a `$` that failed as a closer (`x$, $$c`) was skipped over, so the
math swallowed it, where pandoc's TeX holds no unescaped `$`. The scan now stops at the first
`$`, which also bounds it by the distance to the next one.

Math then got one way each, as GitHub writes it: `$x$` in a line, and a `$$` block, fenced or
`$$E=mc^2$$` alone on a line. `$$x$$` inside a line of text had been read as `$`, math and `$`
with no report; it now stays text and warns `math-delimiter`, as does GitHub's ``$`x`$``, which
exists because GitHub's `$…$` went through Markdown first, which markz's doesn't. Of the math
suite, 18 match, 8 warn and 4 differ.

### 13. The site by the dialect — done

The Conformance page becomes Metadata, Block, Inline and Not supported, each opening to its
constructs with their examples, sources and statuses. Summary cards above it: correctness now,
then performance, size, robustness, a real-world corpus (warnings per file in the migrated
Markdown), formatter agreement (oxfmt doesn't change the parse) and HTML safety as steps 16 and
17 produce them.

The statuses are now four, in the singular: **match** (the oracle's output or markz's expected
HTML), **warn** (it holds because markz warned: a Not supported row, or a metadata line YAML
reads and markz doesn't), **differ** (filed under a construct markz keeps under its own rule) and
**fail**. The kind `differs` is `differ`. `check` gives each a detail, shown beside it: `match
oracle`, `match expected`, `warn setext-heading`. Of 1,395 examples, 768 match, 547 warn, 80
differ and none fail.

Each part is one table on a shared grid, so the columns line up down the page; a construct opens
in place to its examples, failures first, and `#construct-id` links open one. One search, over
the Markdown and the warning codes, narrows every construct at once, and the status cards filter.
An example with metadata shows what markz read. Correctness is the only card until steps 16 and 17.

### 14. Directive names are element names — done

The decision in [`directive.md`](directive.md), built. A directive's name is the element it
writes: an HTML element on its kind's allowlist ([`src/elements.ts`](../src/elements.ts)) or a
custom-element name. The name is no longer a class, and classes come only from `{…}`.

- **Parser.** The block pass checks leaf and container names and the inline pass text-directive
  names. A bad name is `directive-name` (a Not supported row) and leaves the whole `:name[…]{…}`
  as text; for a container, only the fence lines. A `::name[…]` inside a line is text with no
  report. A container label on a block with no place for it is `directive-label`.
- **`html()`.** The name is the tag, and a hand-built document's name off the allowlists falls
  back to `div` or `span`. `details` takes its label as `<summary>`, `figure` as `<figcaption>`,
  and a custom element keeps the `directive-label` div. A bare key is written bare, so
  `{open}` gives `open`, not `open=""`.
- **Tests.** The grammar builds its `block-element` and `inline-element` alternatives from the
  same lists. The vendored directive suite names its directives `a` and `youtube`; the harness
  maps a plain word that isn't an element to a custom one (`x-a`), so its fence, label and
  attribute tests are still compared with micromark (129 match, as before). The oracle writes the
  same shapes, and normalization drops an empty attribute value, since micromark can't tell a bare
  key from one. A cut rule now matches only when markz raised its row's warning, so the first
  rule that fired wins. New dialect examples cover each list, custom elements, labels, `dl`, bare
  keys and five bad names.
- **Size.** 15.67 KB gzip, up from 15.12, most of it the two lists and the two messages.

### 15. Traversal and position utilities

Public API, kept minimal: `parse`, `html`, `walk` (`enter`/`exit`), `textContent`, `position`. Lines are 1-based and columns are 0-based. Nothing else is exported until a consumer needs it.

### 16. Robustness and fuzzing

- A generator of documents from `test/grammar.ts`'s productions and side rules, fed to the oracle.
- Malformed input, CRLF and lone `\r`, BOM, and astral-plane offsets.
- Adversarial unclosed openers, with a timing check that fails on super-linear growth. Code spans and math already record a failed scan; link destinations, `<!--` and attribute blocks don't yet.
- Unclosed `${` is quadratic today: 80,000 of them in one paragraph take about 100 s, 16 times the time for 4 times the input. One failed scan doesn't settle later ones (`${a ${b}` has a valid second expression), so the fix is to reuse the failed scan's brace depths for every `${` it passed, rather than a flag.
- A multi-MB document that guards against quadratic behaviour.

### 17. Benchmarks and bundle size

`bench/` (not published): parse throughput and AST memory versus micromark, markdown-it, marked, markdown-exit and Comark. The size gate is already in CI; this step adds the comparisons.

## Definition of done for v1

- `import { parse, html } from 'markz'` works with no options and no runtime dependencies.
- `html()` is identical to micromark + GFM on the filtered spec suites and on fuzzed documents in the shared grammar.
- Every rejected construct produces its warning.
- `dist/` is at most 20 KB gzip, and CI enforces it.
- The README documents the API and links to `syntax.md`.
