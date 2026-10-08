# Reference

Everything `@amitkaps/markz` exports: six functions, the read-only `Document` they work on, and
the types of what it holds. None of them takes options. What to do with them is in [Usage](usage.md), and why they are
shaped this way is in [Design](design.md).

```ts
import { parse, html, walk, textContent, headings, position } from "@amitkaps/markz";
```

## Functions

### `parse(source): Document`

Reads a string into a [`Document`](#document). It never throws: syntax markz does not accept stays
literal text and is listed in `doc.warnings`. A leading byte-order mark is skipped.

### `html(source | Document): string`

The HTML for a string or a parsed document. Outside a ` ```=html ` block, nothing a document says
can put script on the page ([Design: Security](design.md#security)). Pass a `Document` you already
parsed to avoid reading it twice.

### `walk(doc, visitor, from?): void`

Visits `from` (the root by default) and everything under it, depth first, in source order.
`visitor` is `{ enter?(node), exit?(node) }`: `enter` runs before a node's children and `exit`
after them, and `enter` returning `false` skips that node's children (its `exit` still runs). It
doesn't recurse, so any nesting depth is safe.

### `textContent(doc, node?): string`

The text of a node as a reader sees it on the rendered page: escapes decoded,
code and math as written, images left out. The node is the root by default. For the source text of
a node, use `doc.source.slice(doc.start(node), doc.end(node))`.

### `headings(doc): Heading[]`

Every heading in source order, wherever it sits, as `{ node, depth, id, text }`. The `id` is the
one `html()` writes, so `#${id}` links to it. It is a flat list: nesting it, numbering it or
keeping only some depths is yours to do, which is why `html()` writes no table of contents.

### `position(source): (offset) => { line, column }`

Turns an offset, such as `warning.start` or `doc.start(node)`, into a line (from 1) and a column
(from 0, in UTF-16 units). CRLF, LF and a lone CR each end a line. Build it once per source and
call it for each offset.

## Document

What `parse` returns. It is read-only: a node is a number, and these methods read it.

| Member                  | Gives                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `doc.source`            | the string that was parsed                                                            |
| `doc.root`              | the `document` node, always `0`                                                       |
| `doc.size`              | the number of nodes; ids run from `0` to `size - 1`, parents first                    |
| `doc.warnings`          | rejected syntax, in source order, as [`Warning`](#warnings)s                          |
| `doc.metadata`          | the [metadata](syntax.md#metadata) object, or `undefined` if there is none            |
| `doc.type(node)`        | the node's [type](#node-types)                                                        |
| `doc.start(node)`       | where it starts in the source, in UTF-16 units                                        |
| `doc.end(node)`         | where it ends, exclusive                                                              |
| `doc.parent(node)`      | its parent, or `NONE` for the root                                                    |
| `doc.firstChild(node)`  | its first child, or `NONE`                                                            |
| `doc.nextSibling(node)` | its next sibling, or `NONE`                                                           |
| `doc.children(node)`    | its children, in order, as an iterable                                                |
| `doc.data(node, type)`  | the node's [data](#node-types); throws if the node is not that type                   |
| `doc.attributes(node)`  | the `{…}` attributes on it, `{ items: [{ key, value, start, end }] }`, or `undefined` |

`NONE` is `-1`. Every node has exact offsets, so any node, and any warning, can be pointed to in
the source. A `Document` is not constructed by hand; only `parse` makes one.

## Node types

Every node has a type, a range and links to its parent and children. The kind says where a node
can sit: `block` among blocks, `inline` inside a paragraph, heading, cell or label. The data is
what `doc.data(node, type)` reads, and a type with none has nothing to read.

| Type            | Kind   | Data                                                                                        |
| --------------- | ------ | ------------------------------------------------------------------------------------------- |
| `document`      | root   |                                                                                             |
| `metadata`      | block  | `value` (the object, with flat keys), `range` (the lines between the fences)                |
| `comment`       | block  |                                                                                             |
| `heading`       | block  | `depth` (1 to 6), `id`, `idExplicit` (whether `{#id}` set it)                               |
| `paragraph`     | block  |                                                                                             |
| `blockquote`    | block  |                                                                                             |
| `list`          | block  | `ordered`, `start`, `tight`                                                                 |
| `listItem`      | block  | `checked`: `true` or `false` for a task item, `null` for any other                          |
| `code`          | block  | `lang`, `meta`, `value`, `body` (the range of the code)                                     |
| `raw`           | block  | `format` and `value`, from a ` ```=format ` block, and `range`                              |
| `thematicBreak` | block  |                                                                                             |
| `table`         | block  | `align`: `"left"`, `"center"`, `"right"` or `null` for each column                          |
| `tableRow`      | block  |                                                                                             |
| `tableCell`     | block  |                                                                                             |
| `text`          | inline | `value`, decoded, and the node's range covers the raw characters                            |
| `emphasis`      | inline |                                                                                             |
| `strong`        | inline |                                                                                             |
| `delete`        | inline |                                                                                             |
| `inlineCode`    | inline | `value`                                                                                     |
| `link`          | inline | `destination`, `title`, `destinationRange`, `expressions` (ranges of `${…}`), `autolink`    |
| `image`         | inline | `destination`, `title`, `destinationRange`, `expressions` and `alt`                         |
| `break`         | inline |                                                                                             |
| `expression`    | inline | `code`, the text between the braces of `${…}`, and `range`                                  |
| `element`       | both   | `kind` (`"inline"`, `"leaf"` or `"container"`) and `name`, which is `span` for a plain span |
| `math`          | both   | `block`, `value` (the TeX) and `range`                                                      |

`delete` is strikethrough and `break` is a hard line break. A comment carries no data, since
`html()` never writes it and its text is in the source.

Each type is a construct in [Syntax](syntax.md), by the ids in the [Grammar](grammar.md). There are
no `html`, `definition` or footnote nodes: markz has no raw HTML, reference links or footnotes.

## Warnings

Each entry in `doc.warnings` is `{ code, start, end, message, instead }`: a stable `code` to match
on, the source range, what was wrong, and `instead`, the form to write. Each form markz cuts has
a code, in [Syntax: Not supported](syntax.md#not-supported), and the rest are named in their
construct's section. `WarningCode` is their type.

## Types

Exported for TypeScript: `Document`, `NodeId`, `NodeType`, `NodeData`, `DataType`,
`Heading`, `Visitor`, `Position`, `Warning`, `WarningCode`, `Range`, `Attribute`, `Attributes`,
`Destination`, `Align`, `MetadataObject`, `MetadataValue` and `MetadataScalar`.
