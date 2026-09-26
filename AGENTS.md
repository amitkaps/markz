# Working on this repo

Read **`prose/spec.md`** first — it is the design for markz.

- Before committing: `pnpm check` (format, lint, typecheck) and `pnpm test` must pass. After a
  dependency bump, `pnpm build` too.
- `vp` is a dev dependency — run it through the `pnpm run …` scripts, not a global install.
- markz is one package: parser, AST utilities and `html()`. The dialect is `prose/syntax.md`. No framework renderers, no parser options, no
  unified/remark dependencies, and a 20 KB gzip budget (`prose/spec.md#performance-and-size`).
- `syntax.md` is the specification, and micromark is only the oracle for the constructs markz
  shares with GFM. Don't let "same as GFM" leak past the constructs `syntax.md` lists. Every
  example is filed under a `syntax.md` construct or Not supported row (`test/examples.ts`). When
  the oracle disagrees with `syntax.md`, file the example as `differs` under the construct whose
  rule explains it, rather than bending the parser. markz's own examples go in
  `test/dialect/*.md`.
- `docs/` is the site (markz.amitkaps.com): a private workspace package, trimmed from base, that
  renders the README and `prose/` with this commit's markz and builds the Conformance page from
  the test harness. It is a consumer, never part of the package: its dependencies (Svelte,
  wrangler) must not reach the library. `pnpm docs` runs it; CI checks, tests and builds it, and
  deploys it from `main`.
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
