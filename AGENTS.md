# Working on this repo

Read **`prose/markz.md`** and **`prose/design.md`** first: what markz is, and how it is built.

- Before committing: `pnpm check` (format, lint, typecheck) and `pnpm test` must pass. After a
  dependency bump, `pnpm build` too.
- `vp` is a dev dependency — run it through the `pnpm run …` scripts, not a global install.
- markz is one package: parser, AST utilities and `html()`. The dialect is `prose/syntax.md`. No framework renderers, no parser options, no
  unified/remark dependencies, and a 20 KB gzip budget (`prose/design.md#performance-and-size`).
- `syntax.md` explains the dialect and `prose/grammar.md` states it, with a stable id per
  construct (`{#id}` above its heading); `test/harness/grammar.ts` reads it with markz. Each construct names its origin: CommonMark, GFM, djot,
  pandoc, GitHub, or markz's own. micromark is only the oracle for the constructs marked "As CommonMark" or
  "As GFM"; don't let "same as GFM" leak past them. Every example is filed under a construct id
  or a Not supported row's warning code (`test/harness/examples.ts`). When
  the oracle disagrees with `syntax.md`, file the example as `differ` under the construct whose
  rule explains it, rather than bending the parser. markz's own examples go in
  `test/examples/markz/<id>.md`, each numbered in its fence with the next unused `markz:N`.
- `test/harness/cases.ts` holds every construct to its edges with the grammar as the judge. When it and
  markz read a case differently, fix whichever is wrong, or name the side rule that decides it
  and give that rule a test as narrow as its text. Never widen a settle test to quiet a failure.
- `docs/` is the site (markz.amitkaps.com): a private workspace package, trimmed from base, that
  renders the README and `prose/` with this commit's markz and builds the Quality page from
  the test harness. It is a consumer, never part of the package: its dependencies (Svelte,
  wrangler) must not reach the library. `pnpm docs` runs it; CI checks, tests and builds it, and
  deploys it from `main`.
- `pnpm bench` is markz alone (`test/speed.ts`), in seconds; `pnpm bench --compare` times it
  beside markdown-exit, marked and micromark, for our own insight. No comparison with other
  parsers is published, on the site or in `prose/`: the site's Quality page shows markz's own
  conformance, size and speed. Scripts are one word; a variant is a flag.
- The invariant: unsupported syntax stays literal text and produces a warning. It is never
  silently reinterpreted as a different supported construct.

## Prose (`@amitkaps/prose`, `/__prose/`)

- Every file has file prose, and every meaningful unit of it is in a chunk with prose. Trivial declarations, types, constants and mechanical helpers don't need a chunk of their own unless they carry architectural intent; a paragraph written only to satisfy this rule is noise the human has to read. Folders have a `README.md`.
- Every prose block, file, folder and `prose/` doc begins with a short first paragraph that is its summary for the human. It says what the node means, not what its code does. When a change alters a node's role, intent or place in the design, rewrite that paragraph in the same change.
- Prose goes in `@prose` comments. Ordinary comments stay for code-level notes.
- Keep prose current in the same change as the code. Rewrite it where it has drifted; don't append.
- Fill pending chunks as plan items. Work that belongs to one file goes in as a pending chunk there, not in a list elsewhere.
- When unsure, or when a decision is the human's, leave a `@note` after the relevant `@prose` block instead of guessing.
- When asked to "handle notes": find every `@note` (`grep -rn "@note"`), address the ones you can act on, and delete them — folding anything worth remembering into the `@prose` block each sat next to. Leave the ones waiting on the human, including your own questions.
- Resolve unresolved-symbol warnings before finishing. Treat a possibly-stale warning as a prompt to reread the prose against the code, not as something to clear with a token edit. `/__prose/` surfaces both as you work.
