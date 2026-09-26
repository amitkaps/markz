# markz

> **markz — small, opinionated Markdown.**

A standalone Markdown package for TypeScript/JavaScript: one fixed dialect (GFM's everyday syntax
without the parts that need backtracking, plus directives with `{…}` attributes, math, `${…}` expressions and a metadata block), a compact flat source-mapped AST,
HTML output, and no configuration. Make the Markdown decision
once; use markz everywhere.

```ts
import { parse } from 'markz';

const document = parse(markdown);
```

The dialect is in [`prose/syntax.md`](prose/syntax.md) and the design in [`prose/spec.md`](prose/spec.md).

## Not a drop-in Markdown parser

markz parses the Markdown we write, not every Markdown in the wild. Pasted or generated Markdown
often uses syntax the dialect leaves out: reference links (`[text][ref]`), bare URLs, raw HTML,
setext headings (`Title` over `===`), footnotes and named entities (`&amp;`). markz never guesses
at these. Each one stays literal text and adds a diagnostic naming the supported form, so
converting a document means fixing what `doc.diagnostics` lists.

## Development

```sh
# needs Node 26 + pnpm 12.6+ — mise.toml pins both
mise install
pnpm install
```

`dev` (watch build), `build`, `check` (format, lint, typecheck) and `test` are the whole interface.
`pnpm report` writes `report/conformance.html`, a page showing every spec example against the
oracle.
