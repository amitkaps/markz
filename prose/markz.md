# markz

markz is a small Markdown language and the one package that reads it. It has one fixed
dialect, a compact tree that maps every node back to the source, HTML output, and no options.
A project makes its Markdown decision once, and uses markz everywhere.

```ts
import { html, parse, position, textContent, walk } from "@amitkaps/markz";

const doc = parse(markdown); // a read-only, source-mapped tree, and doc.warnings
const page = html(doc); // or html(markdown)

walk(doc, {
  enter(node) {
    if (doc.type(node) === "heading") console.log(doc.data(node, "heading").id);
  },
});

const at = position(markdown); // offset → { line, column }
for (const w of doc.warnings) console.log(at(w.start), w.message, "write", w.instead);
```

That is the whole API: `parse`, `html`, `walk`, `textContent` and `position`. None of them takes
options.

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
never guesses what a document meant. The whole language is in [Syntax](syntax.md), and stated
formally in [Grammar](grammar.md).

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
uses forms it leaves out. Converting a document means fixing what `doc.warnings` lists.

## Read more

- [Syntax](syntax.md): every construct, what it's limited to, and what's left out.
- [Grammar](grammar.md): the language in EBNF, with the side rules that settle each choice.
- [Design](design.md): the tree, source offsets, the parser, HTML, security and testing.
- [Quality](https://markz.amitkaps.com/quality): conformance, size and speed, measured on this commit.
- [Lessons](lessons.md): what building it taught, and what could be better.

markz builds on CommonMark and GFM, takes its cuts and attribute syntax from djot and its math
from pandoc and GitHub, and uses micromark as the oracle its tests check against.
