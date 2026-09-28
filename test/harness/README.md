# harness

What the checks in [`../`](../) and the site's Quality page read and judge with. No tests
live here, so one change to how an example is filed or judged reaches both at once.

- [`grammar.ts`](grammar.ts): the dialect's grammar, read from
  [`prose/grammar.md`](../../prose/grammar.md) with markz: one entry per construct with its id,
  part, origin, EBNF productions and side rules. [`ebnf.ts`](ebnf.ts) reads the notation and
  recognizes a string by it.
- [`syntax.ts`](syntax.ts): what `syntax.md` says about each construct, by id, and the Not
  supported rows, by code.
- [`fences.ts`](fences.ts): the one format every example file is in, read and written.
- [`examples.ts`](examples.ts): every example markz is held to, upstream and its own, filed under
  a construct id or a Not supported row's warning code, and `check`, which gives each its status.
- [`oracle.ts`](oracle.ts): micromark with GFM and frontmatter, the normalization, `yaml` for
  metadata, github-slugger for heading ids and the math extension's spans.
- [`cases.ts`](cases.ts): every construct at its edges. Cases written from its productions, and
  their one-character neighbours, must be read as the grammar reads them, or be settled by a named
  side rule or a Not supported row.
- [`generate.ts`](generate.ts): fast-check arbitraries. Documents written from the grammar's
  productions, optionally only those of chosen origins; noise from Markdown's characters and the
  ones that trouble offsets; known examples with a few random edits; and how far a search goes.
- [`sound.ts`](sound.ts) and [`tree.ts`](tree.ts): what every document must satisfy, whatever the
  input, and the tree invariants among it.
- [`corpus.ts`](corpus.ts): the real documents in [`../documents/`](../documents/) by tier, and
  the variants built from them: common, formatted and repeated to a size. `pnpm bench` and the
  site's Quality page time them.
- [`node.ts`](node.ts): lets a plain Node script load `src/` and the harness, which Vite
  otherwise resolves.
- [`speed.ts`](speed.ts): warm-up, timed passes and retained memory, for `pnpm bench` and the
  site's Size and Speed.
- [`parsers.ts`](parsers.ts): the other parsers `pnpm bench --compare` times markz beside, for
  our own insight.
- [`adversarial.ts`](adversarial.ts): patterns that would make a careless parser quadratic, each
  growing in proportion to a count.

A failure fast-check finds is shrunk to its smallest form. Once fixed, it goes into its
construct's file in [`../examples/markz/`](../examples/markz/) as an example, so it stays fixed
without the fuzzer finding it again.
