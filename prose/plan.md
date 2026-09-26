# Plan

The build order for markz v1, from the repo skeleton to a measured 20 KB bundle. Each step is small enough to land on its own, with tests, and each leaves `pnpm check`, `pnpm test` and `pnpm build` green. The design lives in [`spec.md`](spec.md) and the dialect in [`syntax.md`](syntax.md). This file is only sequencing.

## Packaging

The output is built with `vp pack` (tsdown, driven by the `pack` section of [`vite.config.ts`](../vite.config.ts)), with no separate bundler config.

- ESM only: `dist/index.js` plus `dist/index.d.ts`, and `exports` in `package.json` points at both.
- One entry, `src/index.ts`. Anything not re-exported from it is private.
- `sideEffects: false`, so consumers can tree-shake `html`, `walk`, `textContent` and `position`.
- No runtime dependencies. `micromark`, `micromark-extension-gfm` and `micromark-extension-directive` move to `devDependencies` as the test oracle. `yaml` joins them as the frontmatter oracle.
- `prepublishOnly` runs `vp pack`, so a publish can never ship a stale `dist/`.
- CI measures `dist/` (minified, gzip, Brotli) and fails above 20 KB gzip.

## Steps

### 1. Repo and package setup — done

Vite+ library skeleton, CI, prose tooling, placeholder `parse()`.

### 2. AST representation

Define the flat node store in `src/ast.ts`: typed arrays for `type`, `start`, `end`, `parent`, `firstChild` and `nextSibling` (plus `lastChild` if append cost demands it), and a side table for per-node data.

- `NodeType` as an internal numeric enum covering the spec's node list. The public type names are strings.
- A `Document` that can't be changed after parsing, with `children(node)` as an iterator that allocates no arrays, typed accessors for side-table data, and `diagnostics`. No mutation API.
- Tests: hand-built trees, parent/sibling invariants.

### 3. Oracle harness

Before any parsing code, set up the differential harness in `test/oracle.ts`:

- `micromark` + GFM (+ directive) render the input to HTML.
- markz's `html()` must match it after whitespace normalization.
- Vendor the CommonMark and GFM spec JSON, and filter it to the examples that use only constructs markz shares with GFM. The filter is itself a checked list, so an excluded example states which `syntax.md` row excludes it.

### 4. Block pass

`src/block.ts`, a line-by-line scan into containers and leaves, in one linear pass:

- containers: blockquote, list, listItem
- leaves: paragraph, ATX heading, fenced code (including ` ```=format ` raw blocks), thematic break, table, footnote definition, comment, frontmatter, `$$` math, and directive fences
- block-attribute lines, attached to the next block
- the frontmatter subset, parsed line by line in `src/frontmatter.ts` into a flat object

There is no indented code, setext, HTML block or lazy continuation. A rejected construct becomes paragraph text plus a diagnostic.

Build the first cut of `html()` in `src/html.ts` alongside it. Tests assert exact offsets, and the oracle checks block-only examples.

### 5. Inline pass

`src/inline.ts`, run per leaf, in one linear pass:

- inline code, `${…}` expressions and inline math, which bind tightest
- links and images (inline form only) with an optional `{…}` directly after, `<…>` autolinks, and footnote references
- strong (`**`) / emphasis (`_`) / strikethrough (`~~`) with the djot-style flanking rules
- backslash escapes, numeric references and `\` hard breaks
- smart punctuation on text: quotes by the character before them, `--`, `---`, `...`

Openers go on a stack, and unmatched ones become text by patching the output. Failed scans record how far they got, so no input is read twice. Text nodes keep their decoded `value` and their raw source range. The whole filtered oracle suite runs from here on.

### 6. Extensions

- **Directives**, all three kinds, with attributes and expression ranges, checked against `micromark-extension-directive`.
- **Expressions** inside link destinations and directive attributes.
- `html()` output for math, expressions and directives, as `syntax.md` describes.

Test with visdown's examples.

### 7. Heading IDs

Explicit `{#id}`s first, then generated ids in `src/slug.ts`, using GitHub's algorithm. Generated ids skip explicit ones, and duplicate explicit ids produce diagnostics. The spec's golden table is the test.

### 8. Diagnostics

Every row of the "Not supported" table in `syntax.md` gets a test: the input stays text, and a diagnostic carries the range and the supported form.

### 9. Traversal and position utilities

Public API, kept minimal: `parse`, `parsePartial`, `html`, `walk` (`enter`/`exit`), `textContent`, `position`. Lines are 1-based and columns are 0-based. Nothing else is exported until a consumer needs it.

### 10. Robustness and fuzzing

- A grammar-based generator of documents in the shared grammar, fed to the oracle.
- Malformed input, CRLF and lone `\r`, BOM, and astral-plane offsets.
- Adversarial unclosed openers, with a timing check that fails on super-linear growth.
- A multi-MB document that guards against quadratic behaviour.

### 11. Partial parsing

`parsePartial(source)` works in Comark's model. It parses an incomplete prefix again and closes unterminated inline constructs and directive fences at the tail, with honest offsets and a `partial` flag. The test runs `parsePartial` on every prefix of the fixtures and checks for a valid tree.

### 12. Benchmarks and bundle size

`bench/` (not published): parse throughput and AST memory versus micromark, markdown-it, marked, markdown-exit and Comark. The size gate goes into CI.

## Definition of done for v1

- `import { parse, html } from 'markz'` works with no options and no runtime dependencies.
- `html()` is identical to micromark + GFM on the filtered spec suites and on fuzzed documents in the shared grammar.
- Every rejected construct produces its diagnostic.
- `dist/` is at most 20 KB gzip, and CI enforces it.
- The README documents the API and links to `syntax.md`.
