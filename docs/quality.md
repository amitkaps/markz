# Quality

What markz is held to, and how to read the results. The
[Quality report](https://markz.amitkaps.com/quality) shows them for the latest commit on `main`,
measured when the site is built. `pnpm quality` writes the same report for your working tree.

## Reading the report

The report runs the same code as `pnpm test`, so it can't disagree with the tests. It has four
cards, then every construct with its examples.

**Conformance** counts the examples markz is held to, and gives each one a status. An upstream
example is checked against an oracle. [micromark](https://github.com/micromark/micromark) is the
oracle for CommonMark, GFM and frontmatter, after whitespace is normalized. [yaml](https://eemeli.org/yaml/) is the oracle for metadata values, and
[github-slugger](https://github.com/Flet/github-slugger) for heading ids. markz's own examples
carry their expected output.

- **match:** markz gives the oracle's output, or its own expected HTML.
- **warn:** it holds because markz warned, on a form the dialect cuts or metadata it doesn't read.
- **differ:** markz keeps a construct under its own rule, by design. The rule is named in
  [Syntax](syntax.md) and the example is filed under that construct.
- **fail:** markz does something else. The tests fail.

**Edges** counts the cases generated from [the grammar](grammar.md). For each construct, cases
are written from its productions, and then every one-character edit of them is tried. They have no
HTML to compare, so they are counted, with one case of each kind in every construct's row.

- **valid:** a case written from the construct's productions. markz must read it as that construct.
- **boundary:** an edit the grammar still accepts. markz must still read it as the construct.
- **near miss:** an edit the grammar rejects. markz must not read it as the construct.
- **unsettled:** markz and the grammar disagree, and no side rule says why. The tests fail.

**Size** and **Speed** measure this commit: the gzip size against the budget, the memory one
document's tree holds, and parse + HTML time on documents a reader can picture. Why they matter is
in [Design](design.md#performance-and-size).

## How markz is tested

- **One set of examples, filed by the dialect:** every example, upstream or markz's own, is filed
  under a construct's id or a Not supported row's warning code, and every construct and row has
  examples. Where an example comes from is a label, not a category.
- **The grammar:** [`grammar.md`](grammar.md), read by markz, is well formed (every name defined, every production
  reachable) and matches [`syntax.md`](syntax.md): the same construct ids in the same order, under
  the same parts, each opening with its origin.
- **Every construct at its edges:** cases written from a construct's productions, and every
  one-character edit of them, must be read by markz exactly when the grammar accepts them, with
  the node their delimiters decide. Where the two part, a Not supported warning or a named side
  rule must say why (`test/harness/cases.ts`). The cases take every choice in the construct's
  productions, or the test names the ones they missed. Each construct also has a hand-written ambiguous and
  unclosed example, or a reason it can't.
- **Differential against micromark + GFM:** every CommonMark and GFM spec example in a shared
  construct must give identical `html()` output. So must documents the fuzzer generates from the CommonMark and GFM
  productions of the grammar, unless markz reported a cut form. An example where markz keeps a
  construct under its own rule (no run splitting) is filed as differing, under that construct, and
  a generated document that needs one is left out with its reason, as are the few where micromark
  parts from commonmark.js.
- **Rejected syntax:** an example that uses a form `syntax.md` cuts must raise that row's warning,
  so the cuts are tested rather than skipped. markz's own examples (`test/examples/markz/`, one file per
  construct, in the CommonMark spec's format) also give their exact HTML and the text each warning covers.
- **Constructs beyond GFM:**
  - elements and spans, by markz's own examples, and colon directives, from
    `micromark-extension-directive`'s suite, each reported
  - metadata: every row of the value table in `syntax.md`, each checked against the `yaml`
    package, every look-alike (`True`, `no`, `1.10`, …) and ` #` in a value giving a warning,
    and rare YAML forms (`1e3`, `0x1F`) read as the strings they are written as
  - math, including `$` used as currency
  - expressions: nesting, strings, comments, escapes, and emphasis inside `${…}`; malformed
    JavaScript that still closes; the regex-literal limit
  - attributes: the three placements, text fallbacks such as `{a, b}`, and oxfmt's blank line
    before headings
- **No backtracking:** every adversarial pattern (unclosed openers, deep nesting, long repeats)
  takes less than eight times as long at four times the size, where quadratic work would take
  sixteen.
- **Heading ids:** `syntax.md`'s contract cases, verbatim, plus apostrophes and quotes, which
  slug the same straight or curled (`Don't` and `Don’t` both give `dont`), and a reused explicit
  id producing a warning.
- **Offsets** are asserted against known source, never against rendered output. This includes
  escapes, numeric references, astral characters, CRLF and nested containers.
- **Tree structure:** parent, child and sibling invariants.
- **Robustness:** fuzzed noise, mutated examples and documents from the whole grammar must be
  sound: no throw, a valid tree, warnings inside the source, the same page whatever the line
  endings, and safe HTML. A multi-MB document guards the ordinary path against quadratic
  behaviour.
- **Real documents:** markz's own docs, read in place. Vendored in `test/documents/` are the
  agent instructions of open-source projects (Next.js, Airflow, Ruff, Deno, the AGENTS.md
  example) and human-written documentation (Node.js, the Rust book, Vite). Each is sound as
  written and after oxfmt, its common blocks read as micromark reads them, formatting never
  changes what it means, and its warnings are a snapshot.
