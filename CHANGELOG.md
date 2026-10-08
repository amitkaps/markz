# Changelog

What changed in each release of `@amitkaps/markz`, newest first, and what to change when you
upgrade. Each release's section becomes its GitHub release notes.

## Unreleased

markz now aims to have no footguns. Every input does what it looks like, or gets a warning that
says what to write. Formatters and GitHub may show a document differently, but they must not
damage it.

### Breaking

| Before                                                     | Now                                       | What to do                                                                              |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------- |
| `"quotes"`, `--` and `...` became `“”`, `–` and `…`        | Text is kept as typed                     | Type the character you want, or curl text in your own pass over the tree.               |
| `deploy.name: x` gave `{ deploy: { name: "x" } }`          | `{ "deploy.name": "x" }`, with no warning | Read `metadata["deploy.name"]`. `metadata.deploy` is now `undefined`, so search for it. |
| `title: Hi # note` dropped the comment                     | Kept as written, with `metadata-value`    | Quote the value, or put the comment on its own `#` line.                                |
| `draft: no`, `on` and `off` were strings, `1.10` was `1.1` | `metadata-value`, and the key skipped     | Write `true` or `false`, or quote the value.                                            |
| The `metadata-indented` code                               | `metadata-line`                           | Match the new code.                                                                     |
| `MetadataValue` could be a nested object                   | A scalar, or a list of scalars            | Drop the object case.                                                                   |

### Added

- `***` is a thematic break. A formatter writes it on a document's first line, where `---` would
  open metadata. `___` and `* * *` still warn.
- `element-lazy-line` warns on an element line straight after a list, quote or table, which a
  formatter would move into it.
- `expression-bracket` warns on a `${…}` that a `}` inside it closed early, as in a regex.
- The `element-name` warning suggests the writer's own name, as `{@div .note}` or `{@my-note}`.

### Fixed

- `*` and `**` between two digits are text, so `2*3*4` and `2**10` are no longer emphasis.
- A fence's info string is split into its language and meta before references decode, so
  `&#9;` stays in its word.
- A parsed tree takes less memory. Code blocks and text read from the source, and the tree's
  arrays are sized to its nodes.
- One-line leaves with no syntax skip the inline pass, which makes headings and tables faster.

## 0.3.0 (2026-10-06)

### Added

- `unclosed-block` warns on a code, raw or math block, or a comment, with no closing line.
- `attribute-syntax` warns on a `{` after a link, image or span with no `}` left on its line.
- `element-close` after a `{#name}` line says to open the element with `{@name}`.

### Changed

- The package ships without its source comments, under a license banner. Every export keeps
  its documentation in the types.

### Fixed

- A quote straight after a closing quote or emphasis closes, as `'fine'"` does.

## 0.2.0 (2026-10-02)

### Added

- `headings(doc)` lists every heading in source order, with its depth, id and text.
- Dotted metadata keys nest into objects, as `deploy.name` into `{ deploy: { name } }`. The
  release after 0.3.0 reads them flat again.

### Changed

- markz runs on the current Node and the previous LTS, and in Baseline browsers.

## 0.1.1 (2026-09-29)

### Changed

- Published to npm as `@amitkaps/markz`.

## 0.1.0 (2026-09-29)

The first release, as a GitHub tarball.

- `parse` reads the dialect into a flat, read-only tree with exact source offsets, and `html`
  writes it.
- `walk`, `textContent` and `position` read the tree.
- `{…}` is the one extension syntax: attributes decorate what Markdown makes, and `@name` makes an
  element.
- Metadata, math as `$x$` and `$$` blocks, `${…}` expressions and ` ```=html ` raw blocks.
- Heading ids as GitHub makes them.
- Every form the dialect cuts stays text, with a warning that has a stable code and says what to
  write instead.
- Linear time on any input, and at most 20 KB gzip.
