# documents

Real documents, vendored as they were at the commit named, and never edited:
[`../documents.test.ts`](../documents.test.ts) holds markz to each, and the benchmark times them.
They are excluded from the repo's formatter, so they stay exactly as their authors store them.
The tier each folder is, and the variants built from them, are in
[`../harness/corpus.ts`](../harness/corpus.ts).

## agent

Markdown written by coding agents: markz's own docs and those of the repos that consume it.

| Folder     | Source                                                               | Commit    |
| ---------- | -------------------------------------------------------------------- | --------- |
| `markz/`   | this repo: `README.md`, `prose/*.md`                                 | `49141e6` |
| `base/`    | [amitkaps/base](https://github.com/amitkaps/base) `src/content/`     | `f817482` |
| `prose/`   | [amitkaps/prose](https://github.com/amitkaps/prose) `prose/`         | `df27c25` |
| `visdown/` | [amitkaps/visdown](https://github.com/amitkaps/visdown) `docs/`, and the site's `content/` and `examples/` (prefixed) | `8b30dc1` |

## public

Documentation written by people, chosen for styles the agent tier doesn't have. Each folder keeps
its project's licence.

| Folder       | Source                                                                             | Commit    | Licence      |
| ------------ | ---------------------------------------------------------------------------------- | --------- | ------------ |
| `node/`      | [nodejs/node](https://github.com/nodejs/node) `doc/api/`: six API reference pages  | `5137638` | MIT          |
| `rust-book/` | [rust-lang/book](https://github.com/rust-lang/book) `src/`: chapters 4 to 10       | `1500248` | MIT (or Apache-2.0) |
| `vite/`      | [vitejs/vite](https://github.com/vitejs/vite) `docs/guide/`, `docs/config/` (prefixed) | `bc598a6` | MIT          |

## spec

`commonmark-spec.md` is the CommonMark spec's `spec.txt` from
[commonmark/commonmark-spec](https://github.com/commonmark/commonmark-spec) at `3da9394`, by John
MacFarlane, under [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (`spec/LICENSE`).
It is here unchanged, as the input other Markdown parsers publish benchmarks on.
