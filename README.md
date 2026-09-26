# markz

> **markz — small, opinionated Markdown.**

A standalone Markdown package for TypeScript/JavaScript: one fixed dialect (GFM's everyday syntax
without the parts that need backtracking, plus directives with `{…}` attributes, math, `${…}` expressions and YAML frontmatter), a compact flat source-mapped AST,
HTML output, and no configuration. Make the Markdown decision
once; use markz everywhere.

```ts
import { parse } from 'markz';

const document = parse(markdown);
```

The dialect is in [`prose/syntax.md`](prose/syntax.md) and the design in [`prose/spec.md`](prose/spec.md).

## Development

```sh
# needs Node 26 + pnpm 12.6+ — mise.toml pins both
mise install
pnpm install
```

`dev` (watch build), `build`, `check` (format, lint, typecheck) and `test` are the whole interface.
