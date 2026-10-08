# Changelog

What changed in each release of `@amitkaps/markz`, newest first, and what to change when you
upgrade. Each release's section becomes its GitHub release notes.

## Unreleased

markz now aims to have no footguns. Every input does what it looks like, or gets a warning that
says what to write. Formatters and GitHub may show a document differently, but they must not
damage it.

### Breaking

| Before                                                    | Now                                 | What to do                                                                       |
| --------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `"quotes"`, `--` and `...` became `“”`, `–` and `…`       | Text is kept as typed               | Type the character you want, or curl text in your own pass over the tree.        |
| `deploy.name: x` gave `{ deploy: { name: "x" } }`         | `{ "deploy.name": "x" }`            | Read `metadata["deploy.name"]`, or keep nested config in the site's own files.   |
| `title: Hi # note` dropped the comment                    | `metadata-value`, and the key skipped | Put the comment on its own `#` line, or quote the value.                       |
| `draft: no`, `on` and `off` were strings, `1.10` was `1.1` | `metadata-value`, and the key skipped | Write `true` or `false`, or quote the value.                                   |
| `1e3`, `0x1F` and `.inf` warned                           | Strings, as written                 | Nothing, or write the number in decimal.                                         |
| The `metadata-indented` code                              | `metadata-line`                     | Match the new code.                                                              |
| `MetadataValue` could be a nested object                  | A scalar, or a list of scalars      | Drop the object case.                                                            |

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

## 0.3.0

[Release notes](https://github.com/amitkaps/markz/releases/tag/v0.3.0)

## 0.2.0

[Release notes](https://github.com/amitkaps/markz/releases/tag/v0.2.0)

## 0.1.1

[Release notes](https://github.com/amitkaps/markz/releases/tag/v0.1.1)

## 0.1.0

[Release notes](https://github.com/amitkaps/markz/releases/tag/v0.1.0)
