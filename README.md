# markz

markz is a small, opinionated Markdown, and the one package that reads it, with no
dependencies. It has one fixed dialect, a compact tree that maps every node back to the source,
HTML output, and no options.

```ts
import { html, parse } from "@amitkaps/markz";

const page = html(markdown);

const doc = parse(markdown); // a read-only, source-mapped tree
console.log(doc.warnings); // what it didn't read, and what to write instead
```

The whole API is six functions (`parse`, `html`, `walk`, `textContent`,
`headings` and `position`) and the read-only `Document`, in [Reference](docs/reference.md).
None of them takes options.

## Install

```sh
pnpm add @amitkaps/markz
```

Each release's package is also attached to its
[GitHub release](https://github.com/amitkaps/markz/releases). markz runs on the current Node and
the previous LTS, which today are 26 and 24. In the browser, it needs
[Baseline Widely Available](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility).
It is one ES module with no dependencies and no Node APIs, so the same file runs in Node, browsers
and workers.

A page with no build step imports it from a CDN, which serves it minified:

```html
<script type="module">
  import { html } from "https://cdn.jsdelivr.net/npm/@amitkaps/markz@0.4/+esm";
</script>
```

## The language

markz reads the Markdown people already write: `#` headings, `_emphasis_`, `**strong**`, `-`
lists, fenced code, links, images, tables, tasks and `~~strikethrough~~`. On top of that:

| To write                 | Write                                                        |
| ------------------------ | ------------------------------------------------------------ |
| Metadata                 | `key: value` lines between `---` lines, at the very top      |
| A class, id or attribute | `{.class #id key=value open}` above a block, or after a link |
| A styled word            | `[text]{.class}`                                             |
| An inline element        | `[Ctrl]{@kbd}`                                               |
| A block element          | `{@details}` … `{/details}`, or `[label]{@name /}`           |
| Math                     | `$x$` in a line, or a `$$` block                             |
| A value from code        | `${name}`, kept whole for the page to evaluate               |
| HTML                     | a ` ```=html ` fence                                         |
| A comment                | `<!-- … -->` on lines of its own                             |

There is one way to write each thing. Forms that make a parser read ahead and change its mind,
such as setext headings, reference links, raw HTML in text and indented code, aren't part of
the language. They stay literal text and add a warning naming the form to write instead. markz
never guesses what a document meant. [Syntax](docs/syntax.md) has the whole language at a
glance, and [Grammar](docs/grammar.md) states it exactly.

## Principles

- **One package:** parser, tree utilities and HTML, with no dependencies.
- **Small:** at most 20 KB gzip, enforced on every change.
- **No configuration.** The language is fixed, so every project reads a document the same way.
- **Linear time.** One pass, no backtracking, whatever the input.
- **A flat, read-only tree** with exact source offsets on every node. Transformations are folds
  that build something new.
- **Safe HTML by construction.** Outside ` ```=html ` blocks, nothing a document says can put
  script on the page.
- **No footguns.** Every input does what it looks like, or gets a warning that says what to write.
  Rejected syntax is never reinterpreted, and prose that only looks like syntax stays prose.
- **Other tools may differ, but must not damage.** GitHub may show an element as text, but it
  hides nothing, and links to headings work there too. markz reads what formatters write, so
  formatting never changes what a document means.

## Not a drop-in Markdown parser

markz reads its language, not every Markdown in the wild. Pasted or generated Markdown often
uses forms it leaves out, like reference links, bare URLs, raw HTML, footnotes and named
entities. Converting a document means fixing what `doc.warnings` lists.

## Read more

- [Usage](docs/usage.md): render, check a document, read its metadata, build a contents list,
  and what to tell your agents.
- [Syntax](docs/syntax.md): every construct, what it's limited to, and what's left out.
- [Reference](docs/reference.md): every export, and the tree it works on.
- [Grammar](docs/grammar.md): the language in EBNF, with the side rules that settle each choice.
- [Design](docs/design.md): the tree, source offsets, the parser, HTML and security.
- [Quality](docs/quality.md): how markz is tested, and how to read the report of conformance,
  size and speed on each commit.
- [Lessons](docs/lessons.md): what building it taught, and what could be better.
- [Development](docs/dev.md): build, test, release and deploy the site.

markz builds on CommonMark and GFM, takes its cuts and attribute syntax from djot and its math
from pandoc and GitHub, and uses micromark as the oracle its tests check against.
