# Agents

How to work in this repository: what markz is, the prose rules it follows, then its commands and workflow. Read [README.md](README.md) and [docs/design.md](docs/design.md) first.

## Markz

markz is one package. It holds the parser, the AST utilities and `html()`. The dialect is [docs/syntax.md](docs/syntax.md). There are no framework renderers, no parser options and no unified or remark dependencies. The gzip budget is 20 KB ([docs/design.md](docs/design.md#performance-and-size)).

- The invariant: unsupported syntax stays literal text and produces a warning. It is never silently reinterpreted as a different supported construct.
- `docs/syntax.md` explains the language and `docs/grammar.md` states it, with a stable id per construct (`{#id}` above its heading). `test/harness/grammar.ts` reads it with markz.
- The docs describe markz as it is, in neutral terms. Inspirations are named once, on the home page (`README.md`). Each construct's origin (CommonMark, GFM, djot, pandoc, GitHub, or markz's own) is the `Origin:` line under its heading in `grammar.md`.
- micromark is only the oracle for constructs from CommonMark or GFM. Don't let "same as GFM" leak past them.
- Every example is filed under a construct id or a Not supported row's warning code (`test/harness/examples.ts`). When the oracle disagrees with `syntax.md`, file the example as `differ` under the construct whose rule explains it. Don't bend the parser.
- markz's own examples go in `test/examples/markz/<id>.md`. Each is numbered in its fence with the next unused `markz:N`.
- `test/harness/cases.ts` holds every construct to its edges, with the grammar as the judge. When it and markz read a case differently, fix whichever is wrong. Or name the side rule that decides it and give that rule a test as narrow as its text. Never widen a settle test to quiet a failure.
- No comparison with other parsers is published, on the site or in `docs/`. The Quality page shows markz's own conformance, size and speed.

## Prose

The same rules as the snippet in [prose's docs](https://github.com/amitkaps/prose/blob/main/docs/usage.md#for-agents), which we follow ourselves. `docs/` is the lasting record of what the dialect is, how markz is built and what building it taught. Decisions and lessons go there, and a `@prose` comment stays local to its code.

- Every source file opens with a `@prose` comment, its summary. Add more wherever the reader needs the why, like a design choice or an edge that's easy to get wrong. Trivial declarations, types, constants and mechanical helpers don't need one. A paragraph written only to satisfy this rule is noise the human has to read. Folders have a `README.md`.
- Every prose comment, README and doc begins with a short first paragraph, its summary for the human, in about three lines. It says what the file or section means, not what its code does. Detail goes below it. When a change alters a file's role, rewrite that paragraph in the same change.
- Write plain sentences. Each one holds one idea, in about 25 words at most, in the active voice with a named subject. If a point doesn't fit, give it its own sentence or cut it. Don't join ideas with semicolons or colons, and keep parentheses for links and examples. Use one term for each concept, the one the docs already use.
- Prose goes in `@prose` comments, written in [markz's Markdown](https://markz.amitkaps.com/docs/syntax.md). Write `_emphasis_`, never `*emphasis*`, and no raw HTML. Ordinary comments stay for code-level notes.
- Prose says what the code can't. That's why it exists, what it promises, what was decided and what was ruled out. It doesn't retell what reading the code shows, and it doesn't replace ordinary comments.
- A library ships the comment above each export in its types, as that export's documentation. So give every export a comment, and a one-line JSDoc is enough. Put a section's prose above the declaration it describes.
- Keep prose current in the same change as the code. Rewrite it where it has drifted, and don't append. A change that only tunes code, with the same behaviour and the same stated costs, needn't touch prose.
- State a rule once. If a doc or a tested file owns it, link to it by repo path and keep only how and why this code does it. A construct's rules live in `docs/grammar.md`, cited as ``(grammar: id; `side-rule`)``.
- Decisions made in the chat go into the prose in the same change. One that spans files goes into the doc it changes, and one about a single spot goes into the `@prose` there. Write docs for a reader who wasn't in the chat, since they may be published as they are. When something is ruled out, write down that it's out and why, so it isn't rebuilt.
- If the project keeps a plan, keep it current, with what's done in one line each and what's next in order.
- To find your way, `grep -rn -A4 "@prose" src` is the map, and `grep -rL "@prose" src --include="*.ts"` lists files with no prose yet. Add an `--include` for each other language the project writes.

## Commands

`vp` is a dev dependency. Run it through the `pnpm run` scripts, not a global install.

```sh
pnpm install
pnpm check             # format, lint and types
pnpm test
pnpm fuzz              # random constructs and robustness, a new seed each run
pnpm build             # the package, into dist/
pnpm dev               # the same build, on every change
pnpm size              # what it costs: gzip against the budget, and memory to hold a tree
pnpm speed             # did a change move it: this tree against origin/main, or --against <ref>
pnpm hotspots          # where the time goes; or one tier or construct by name
pnpm compare           # beside markdown-exit, marked and micromark, for our own insight
pnpm quality           # the Quality report, from the test harness, beside the site
pnpm prose             # the site, live as you edit
pnpm prose build       # the site, into .prose/
pnpm vendor            # refreshes the vendored test inputs
```

The site (markz.amitkaps.com) is the repository read by `prose build`, plus the Quality page that `pnpm quality` writes beside it. Neither is part of the package, and the site has no code of its own. CI builds both, and Cloudflare deploys the folder from `main`. Each script is one word, named for the question it answers. Two scripts may run the same file (`hotspots` is `speed.ts --profile`), and a variant of one question is a flag.

## Workflow

`main` is protected: a pull request is required and the `ci` check must pass. Never commit or push to `main`. Branch, commit, push, `gh pr create`, then `gh pr merge --auto --squash`. Run `pnpm check` and `pnpm test` first, and `pnpm build` too after a dependency bump.
