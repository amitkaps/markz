# markz

> **markz — small, opinionated Markdown.**

A standalone Markdown package for TypeScript/JavaScript: one fixed dialect (GFM's everyday syntax
without the parts that need backtracking, plus `{…}` attributes and elements, math, `${…}` expressions and a metadata block), a compact flat source-mapped AST,
HTML output, and no configuration. Make the Markdown decision
once; use markz everywhere.

```ts
import { html, parse } from "@amitkaps/markz";

const page = html(markdown);

const doc = parse(markdown); // a read-only, source-mapped tree
console.log(doc.warnings); // what it didn't read, and what to write instead
```

The whole API is six functions and the read-only `Document`, in [`docs/api.md`](docs/api.md); none of them takes options. [`docs/usage.md`](docs/usage.md) shows how to use them.

The site, [markz.amitkaps.com](https://markz.amitkaps.com), starts from [`docs/markz.md`](docs/markz.md). The language is in [`docs/syntax.md`](docs/syntax.md) and the design in [`docs/design.md`](docs/design.md).

## Install

```sh
pnpm add @amitkaps/markz
```

Each release's package is also attached to its
[GitHub release](https://github.com/amitkaps/markz/releases).

## Compatibility

- **Node.js:** the current release and the previous LTS (today, 26 and 24).
- **Browsers:** [Baseline Widely Available](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility).

markz is one ES module with no dependencies and no Node APIs, so the same file runs in Node,
browsers and workers.

## Not a drop-in Markdown parser

markz parses the Markdown we write, not every Markdown in the wild. Pasted or generated Markdown
often uses syntax the dialect leaves out: reference links (`[text][ref]`), bare URLs, raw HTML,
setext headings (`Title` over `===`), footnotes and named entities (`&amp;`). markz never guesses
at these. Each one stays literal text and adds a warning naming the supported form, so
converting a document means fixing what `doc.warnings` lists.

## Development

```sh
# needs Node 24+ and pnpm 12.8+ — package.json pins both (devEngines)
pnpm install
```

`dev` (watch build), `build`, `check` (format, lint, typecheck) and `test` are the whole interface.
The site is the repo read by [prose](https://prose.amitkaps.com): `pnpm prose build` writes it,
and `pnpm quality` adds the [Quality page](https://markz.amitkaps.com/quality), which shows every
spec example against the oracle, with markz's size and speed.
