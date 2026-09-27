# src

The whole package. [`index.ts`](index.ts) is the only public entry point; everything else is
internal to the parser.

- [`ast.ts`](ast.ts): the flat document and the builder the passes write into.
- [`parse.ts`](parse.ts): the pipeline, from source to `Document`.
- [`block.ts`](block.ts): the block pass, with [`metadata.ts`](metadata.ts) for the `---` block.
- [`inline.ts`](inline.ts): the inline pass, run on each leaf as it closes.
- [`attributes.ts`](attributes.ts), [`expression.ts`](expression.ts) and
  [`chars.ts`](chars.ts): scanners both passes share.
- [`elements.ts`](elements.ts): the element names a directive may have, which both passes and
  `html()` check.
- [`html.ts`](html.ts): the HTML fold.
- [`walk.ts`](walk.ts) and [`position.ts`](position.ts): the utilities consumers fold and report
  with, `walk`, `textContent` and `position`.
