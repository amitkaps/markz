# documents

Real documents written by people and by agents, vendored as they were at the commit named, and never edited:
[`../documents.test.ts`](../documents.test.ts) holds markz to each, and the benchmark times them.
They are excluded from the repo's formatter, so they stay exactly as their authors store them.
The tier each folder is, and the variants built from them, are in
[`../harness/corpus.ts`](../harness/corpus.ts). markz's own docs are a tier too, read where they
live and never copied here.

## agents

The instructions open-source projects keep for coding agents. Each folder keeps its project's
licence, and Airflow's its notice too.

| Folder       | Source                                                            | Commit    | Licence    |
| ------------ | ----------------------------------------------------------------- | --------- | ---------- |
| `agents.md/` | [openai/agents.md](https://github.com/openai/agents.md) `AGENTS.md`, the format's example | `d001185` | MIT        |
| `airflow/`   | [apache/airflow](https://github.com/apache/airflow) `AGENTS.md`   | `dc2ee91` | Apache-2.0 |
| `next.js/`   | [vercel/next.js](https://github.com/vercel/next.js) `AGENTS.md`   | `a7d6871` | MIT        |

## public

Writing by people, in styles markz's own docs don't have. Each folder keeps its project's
licence. Each kind of writing brings forms the others lack, and a file that added nothing the
rest didn't already reach was cut.

| Folder           | Source                                                                                                             | Commit    | Licence             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | --------- | ------------------- |
| `craftz/`        | [amitkaps/craftz](https://github.com/amitkaps/craftz) `docs/rules.md`, written in markz's dialect                 | `31b9e01` | MIT                 |
| `d2l-zh/`        | [d2l-ai/d2l-zh](https://github.com/d2l-ai/d2l-zh) `chapter_linear-networks/linear-regression.md`, Chinese with math | `e6b18cc` | Apache-2.0          |
| `markdown-exit/` | [serkodev/markdown-exit](https://github.com/serkodev/markdown-exit) `README.md`                                    | `7fc593d` | MIT                 |
| `micromark/`     | [micromark/micromark](https://github.com/micromark/micromark) `readme.md`, dense with HTML and reference links     | `6577c20` | MIT                 |
| `node/`          | [nodejs/node](https://github.com/nodejs/node) `doc/api/url.md`, an API reference page                             | `5137638` | MIT                 |
| `rust-blog/`     | [rust-lang/blog.rust-lang.org](https://github.com/rust-lang/blog.rust-lang.org) two `inside-rust/` posts           | `cfe9f70` | MIT (or Apache-2.0) |
| `rust-book/`     | [rust-lang/book](https://github.com/rust-lang/book) `src/`: two chapters                                           | `1500248` | MIT (or Apache-2.0) |
| `vite/`          | [vitejs/vite](https://github.com/vitejs/vite) `docs/guide/`: four pages (prefixed)                                 | `bc598a6` | MIT                 |

## spec

`commonmark-spec.md` is the CommonMark spec's `spec.txt` from
[commonmark/commonmark-spec](https://github.com/commonmark/commonmark-spec) at `3da9394`, by John
MacFarlane, under [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (`spec/LICENSE`).
It is here unchanged, as the input other Markdown parsers publish benchmarks on.
