# markz

> **markz — small, opinionated Markdown.**

A standalone Markdown package for TypeScript/JavaScript: one fixed dialect (GFM's everyday syntax
without the parts that need backtracking, plus `{…}` attributes and elements, math, `${…}` expressions and a metadata block), a compact flat source-mapped AST,
HTML output, and no configuration. Make the Markdown decision
once; use markz everywhere.

```ts
import { html, parse, position, textContent, walk } from '@amitkaps/markz';

const doc = parse(markdown); // a read-only, source-mapped tree, and doc.warnings
const page = html(doc); // or html(markdown)

walk(doc, {
	enter(node) {
		if (doc.type(node) === 'heading')
			console.log(doc.data(node, 'heading').id, textContent(doc, node));
	}
});

const at = position(markdown); // offset → { line, column }, lines from 1 and columns from 0
for (const w of doc.warnings) console.log(at(w.start), w.message, 'write', w.instead);
```

That is the whole API: `parse`, `html`, `walk` (with `enter` and `exit`, where `enter` returning
`false` skips a node's children), `textContent` (the text a node renders as) and `position`. None
of them takes options.

The site, [markz.amitkaps.com](https://markz.amitkaps.com), starts from [`prose/markz.md`](prose/markz.md). The language is in [`prose/syntax.md`](prose/syntax.md) and the design in [`prose/design.md`](prose/design.md).

## Install

markz isn't on npm yet. Each release attaches its package to a
[GitHub release](https://github.com/amitkaps/markz/releases):

```sh
pnpm add https://github.com/amitkaps/markz/releases/download/v0.1.0/amitkaps-markz-0.1.0.tgz
```

## Not a drop-in Markdown parser

markz parses the Markdown we write, not every Markdown in the wild. Pasted or generated Markdown
often uses syntax the dialect leaves out: reference links (`[text][ref]`), bare URLs, raw HTML,
setext headings (`Title` over `===`), footnotes and named entities (`&amp;`). markz never guesses
at these. Each one stays literal text and adds a warning naming the supported form, so
converting a document means fixing what `doc.warnings` lists.

## Development

```sh
# needs Node 26 + pnpm 12.6+ — mise.toml pins both
mise install
pnpm install
```

`dev` (watch build), `build`, `check` (format, lint, typecheck) and `test` are the whole interface.
The site is in [`docs/`](docs/): `pnpm docs` runs it, and its Quality page shows every spec
example against the oracle, with markz's size and speed.
