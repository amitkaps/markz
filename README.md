# markz

markz is a small Markdown language and the one package that reads it. It has one fixed
dialect, a compact tree that maps every node back to the source, HTML output, and no options.
A project makes its Markdown decision once, and uses markz everywhere.

```ts
import { html, parse } from "@amitkaps/markz";

const page = html(markdown);

const doc = parse(markdown); // a read-only, source-mapped tree
console.log(doc.warnings); // what it didn't read, and what to write instead
```

That is the start. The whole API is six functions (`parse`, `html`, `walk`, `textContent`,
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

## The language

markz reads the Markdown people already write: `#` headings, `**strong**`, `_emphasis_`, `-`
lists, fenced code, links, images, tables, task items and `~~strikethrough~~`. On top of that:

- **A metadata block** of `key: value` lines at the top of the document, where a dotted key
  (`deploy.name`) nests.
- **`{…}`, one extension syntax.** `#id`, `.class` and `key=value` decorate what Markdown makes,
  and `@name` makes an element Markdown has no syntax for:

  ```md
  [Ctrl]{@kbd} and [a note]{.aside}

  {@details}
  [Show the proof]{@summary /}

  The proof.
  {/details}
  ```

- **Math**, as `$x$` and `$$` blocks.
- **Expressions**, as `${…}`, kept whole for a template to evaluate.
- **Raw HTML** only inside a ` ```=html ` block.

There is one way to write each thing. Forms that make a parser read ahead and change its mind,
such as setext headings, reference links, raw HTML in text and indented code, aren't part of
the language. They stay literal text and add a warning naming the form to write instead. markz
never guesses what a document meant. The whole language is in [Syntax](docs/syntax.md), and
stated formally in [Grammar](docs/grammar.md).

## Principles

- **One package:** parser, tree utilities and HTML, with no dependencies.
- **Small:** at most 20 KB gzip, enforced on every change.
- **No configuration.** The language is fixed, so every project reads a document the same way.
- **Linear time.** One pass, no backtracking, whatever the input.
- **A flat, read-only tree** with exact source offsets on every node. Transformations are folds
  that build something new.
- **Safe HTML by construction.** Outside ` ```=html ` blocks, nothing a document says can put
  script on the page.
- **Rejected syntax is reported, never reinterpreted.**

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
- [Design](docs/design.md): the tree, source offsets, the parser, HTML, security and testing.
- [Quality](https://markz.amitkaps.com/quality): conformance, size and speed, measured on this
  commit.
- [Lessons](docs/lessons.md): what building it taught, and what could be better.
- [Development](docs/development.md): build, test, release and deploy the site.

markz builds on CommonMark and GFM, takes its cuts and attribute syntax from djot and its math
from pandoc and GitHub, and uses micromark as the oracle its tests check against.
