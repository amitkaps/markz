# Design

How markz is built: the tree it produces, how offsets map to the source, how the parser reads in
one pass, what `html()` writes and what it refuses, and how it is tested. [Syntax](syntax.md) is
the language this reads, and [the home page](markz.md) says what markz is for.

## AST

The AST is a flat, indexed store, not mdast and not nested objects. A node is a number (its index).
Its fields live in parallel typed arrays:

```ts
type NodeId = number; // -1 means "none"

// per node, in typed arrays
type_: NodeType; // small integer
start: number; // UTF-16 offset into the source, inclusive
end: number; // exclusive
parent: NodeId;
firstChild: NodeId;
nextSibling: NodeId;
```

Data specific to one node type (heading depth and id, link destination, code lang, element
name, …) lives in a side table indexed by node. Nodes are indices, so parent and sibling links
cost nothing, and every node has offsets.

### Read-only, and transformations are folds

A `Document` can't be changed after parsing. Rendering to HTML, or to a framework's template
tree, is a walk that builds a new structure. So markz provides a fast `walk` with `enter`/`exit`
callbacks and typed accessors, and no mutation API. In-place mutation would mean the offsets
could lie. A consumer that wants a rewritten document writes Markdown and parses it again.

### Ergonomics

```ts
const doc = parse(source);

for (const child of doc.children(doc.root)) {
	if (doc.type(child) === 'heading') console.log(doc.data(child, 'heading').id);
}

walk(doc, {
	enter(node) { … },
	exit(node) { … },
});
```

Iteration follows `firstChild`/`nextSibling` and allocates no arrays. Public type names are
strings (`NodeType`), and the numeric codes stay internal. `doc.data(node, type)` reads a node's
side-table entry and throws if the node is of another type, so a wrong guess fails loudly. Text
that a container prefix can interrupt (a code block inside a blockquote loses its `> `) is stored
as a string. Everything else is a range into the source.

## Node types

Only nodes that the syntax requires and that consumers use:

````text
document
metadata             parsed flat object (JSON-like, quotes optional), block range
comment              `<!-- … -->` on lines of its own; never rendered
heading              depth, id, idExplicit
paragraph
text                 decoded value; source range covers the raw characters
emphasis
strong
delete               GFM strikethrough
link                 destination, title, destination range, expression ranges; autolink flag
image                destination, title, alt, destination range, expression ranges
code                 fenced; lang, meta, value, body range
inlineCode
blockquote
list                 ordered, start, tight
listItem             checked: true | false | null (GFM task items)
thematicBreak
break
table                column alignments
tableRow
tableCell
element              kind: inline | leaf | container; name (`span` for a span with none)
math                 inline | block; raw TeX, value range
raw                  format (`html`, …), value, content range; from a ` ```=format ` fence
expression           code, code range
````

Elements, blocks, images and links can carry attributes: an id, classes and key-value pairs,
each with its source range. They're kept in a side table, so the common case (no attributes)
costs nothing.

There are no `html`, `definition` or footnote nodes: HTML exists only in raw blocks, and
reference links and footnotes would need the whole document read before a reference resolves.

## Source locations

Offsets are canonical, and they are UTF-16 code units into the exact string passed to `parse`.
Line and column are computed from them, not stored.

Rules:

- **A node's range covers its markers.** A heading includes `##`, a fence includes both fences, and a
  link includes `[`, `](…)`. The trailing line ending is excluded.
- **Content ranges** are exposed as extra fields where consumers need them: a code block's body,
  a link's destination, the metadata block, and every attribute block.
- **Text nodes map to source, not just to their value.** `value` is the rendered text: decoded
  (`&#169;` → `©`, `\*` → `*`) and with smart punctuation (`"` → `“`). `start`/`end` cover the raw
  characters. A soft line break is a `\n` in the text before it, whose range covers the line
  ending, never the next line's container prefix, so one text node spans lines only where the
  source has nothing between them. A consumer scanning for syntax of its
  own reads `source.slice(start, end)`, so a decoded escape can't shift its columns.
- **Containers with prefixed lines** (blockquotes, list items) span from their first
  marker to the end of their last content. The `> ` and indentation prefixes inside that span
  belong to no child.
- **Line endings and BOM:** CRLF and a lone `\r` both end a line. A leading BOM is part of the
  source and falls before `document.start`.

`position(source)` builds a line-start table once and converts offsets to `{ line, column }` by
binary search. Lines are 1-based and columns are 0-based, as in source-map v3. A consumer that parses an
extracted string (a comment body with its `*` gutters stripped) maps lines back to the file
itself. markz only promises offsets
into what it was given.

## Parser foundation

markz has its own parser. It is written for this one dialect, runs in linear time with no
backtracking, and emits straight into the flat AST:

```text
source → block pass (lines → containers, leaves; the inline pass per leaf, as it closes) → flat AST + warnings → html()
```

**Everything is built in.** Elements, expressions, math, attributes, raw blocks, metadata,
smart punctuation and heading ids are cases in the same two scanners. They aren't plug-ins
layered on a CommonMark core, because a fixed dialect needs no extension points. That also keeps
precedence in one place: `${…}` binding tighter than emphasis is just the order of the inline
scanner's cases. There is nothing after the two passes: a heading's id is settled when the
heading closes, against the ids used so far.

**No backtracking.** The language leaves out every construct whose meaning depends on text after
it:

| Cut                       | What forced backtracking                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| setext headings           | a paragraph becomes a heading when the next line is read                           |
| reference links           | `[x]: url` might be a definition or a paragraph, and links resolve only at the end |
| raw HTML                  | `<` might open a tag or be text                                                    |
| lazy continuation lines   | which block a line belongs to depends on context                                   |
| indented code             | indentation means code, except inside lists                                        |
| CommonMark emphasis rules | delimiter runs, flanking by punctuation class, the rule of 3                       |
| bare-URL autolinks        | an email is known only at its `@`, and trailing punctuation is trimmed afterwards  |

What remains is small enough to write by hand, needs no named-entity table, lets `html()` be safe
outside raw blocks, and never depends on later text, which keeps streaming simple. The rest is openers (`[`, `_`, `**`, `` ` ``,
`$`, `${`, and `{` after a `)` or `]`) that either close or turn out to be text:

- **Openers go on a stack.** The inline pass keeps what it has read as a linked list of items. A
  closer wraps the items since its opener into one node; an opener still unmatched at the end of
  its block is text. The input is never read again.
- **A scan that fails settles the ones after it.** An opener that never closes (`${`, `[` in a
  label, `<!--`, a `` ` `` run, `{`) scans to the end of its range. That scan records what it
  learned, such as where each brace it passed closed, or that no closer is left, so a later opener
  reads the answer instead of scanning again. A paragraph full of unclosed openers stays linear.
- **Nesting costs nothing per line.** A line is checked against the containers that consume a
  prefix from it (`>`, an item's indent). Elements and blank lines, which consume none, are
  settled for a whole run of containers at once, so a thousand unclosed `{@div}` don't make every
  line cost a thousand.
- **Block attributes are one line**, so the block pass never looks ahead.

**The grammar states the dialect, and the parser is its one reading.** [`syntax.md`](syntax.md)
explains the dialect, and [`grammar.md`](grammar.md) states it: each construct's productions in EBNF, plus
the side rules EBNF can't state (container prefixes, fence lengths, flanking, which block a line
opens first). The productions alone are ambiguous, as every Markdown grammar is, and the side
rules settle each choice. The parser isn't generated from the grammar. It is written by hand and
keeps one invariant:

- **Single pass:** the block pass reads each line once, and the inline pass reads each leaf once,
  as it closes.
- **Deterministic:** at every point the side rules allow exactly one reading. No alternative is
  tried and undone.
- **Grammar-directed:** every case in the two scanners is a construct of the grammar or a Not
  supported form, and every construct is a case.
- **Bounded local lookahead:** a scan ahead either stays within the line (a fence, an attribute
  line, a table's delimiter row) or records where it failed, so no character is scanned more than
  a constant number of times.

**Heading ids are settled in the pass.** CommonMark defines headings but not ids, so
every renderer adds them its own way or not at all. markz uses GitHub's algorithm, so anchors
match GitHub's, and a `{#id}` line sets one by hand. An id is settled as
its heading is parsed, against the ids used so far, so it never depends on a later heading. The
rules and the contract cases are in [`syntax.md`](syntax.md#heading).

**micromark is the test oracle, not a dependency.** The language needs to be identical to GFM on
the constructs they share, not compliant with all of it, and micromark with GFM checks exactly
that (see [Testing](#testing)).

## Streaming

This is not built, because every use so far parses complete files. A live editor preview works with plain `parse` on every change: an unclosed
`**` shows as text until its closer is typed, as in every Markdown preview.

The use case it would serve is showing Markdown while it is still arriving, as in an LLM chat UI.
The design is kept ready for it:

- **One place to heal.** Openers wait on a stack until the end of their block (see
  [Parser foundation](#parser-foundation)). `parse` turns unmatched ones into text there. A
  future `parsePartial(source)` would close them instead, along with an open element,
  and flag those nodes `partial`. Offsets would stay within the source, with no synthetic text
  inserted.
- **Parse the whole prefix again, once per chunk.** The language has no reference
  definitions, so later text never changes an earlier block. That makes reusing finished blocks a
  safe optimization, if it's ever needed.
- **It would be a new export.** Adding it later changes nothing for code that calls `parse`.

Deciding whether a half-typed opener (`hello *`) shows or vanishes, and avoiding flicker when
`*` turns out not to be emphasis, is left for when a consumer needs it.

## Public API

```ts
import { parse, html } from '@amitkaps/markz';

const doc = parse(markdown); // AST
const out = html(markdown); // or html(doc)
```

- `parse(source): Document`
- `doc.warnings`: rejected syntax in source order, each `{ code, start, end, message, instead }`,
  where `instead` is the supported form, as `syntax.md`'s "Not supported" table writes it
- `html(source | Document): string`, rendered without recursion, like `walk`
- `walk(doc, { enter?, exit? }, node?)`: depth-first from `node` (the root by default), without
  recursion. `enter` returning `false` skips that node's children.
- `textContent(doc, node?): string`, the text `html()` writes for a node, as a browser's
  `textContent` reads it back: escapes decoded, punctuation curled, code and math included, images
  left out. The source text of any node is `doc.source.slice(doc.start(node), doc.end(node))`
- `position(source): (offset) => { line, column }`

Nothing takes an options object.

## HTML output

`html()` is part of the package. It is a fold over the AST. It works the same in Node, Workers and the browser, because it builds a
string and never touches the DOM.

- **Heading ids** are written as `id`.
- **Attributes** are written onto the element they belong to (see [Security](#security) for the
  ones that are dropped).
- **` ```=html ` raw blocks are written verbatim.** Raw blocks in other formats are skipped. Everywhere
  else, `<` and `&` in text are escaped, and comments are dropped.
- **Smart punctuation** is already in the text values, so `html()` writes curly quotes and dashes
  without a pass of its own.
- **Math, expressions and elements** are written in the shapes [`syntax.md`](syntax.md)
  gives for each.

Framework output is not part of markz. An element's name is the element `html()` writes, custom
elements included, and a framework's own fold maps names to its components (`chart-view` to
`ChartView`). A custom element is inline until CSS says `display: block`.

### Element names

`{…}` with `@name` makes an element, and its name is the element written: an HTML element on the
allowlist for its kind, or a valid custom-element name. The allowlists (`src/elements.ts`) leave
out three kinds of name:

- **What Markdown already writes:** `em`, `strong`, `code`, `a`, `img`, headings, lists and the
  rest, so each element has one way in.
- **A second way:** `span`, since `[text]{.x}` already writes one.
- **Anything active:** `script`, `style`, `iframe`, `object`, `embed`, `svg`, `math`, `template`,
  form controls, `dialog`, `audio` and `video`.

The parser decides whether a name is an element and warns when it isn't, and the whole `{…}`
stays text. `html()` still refuses active elements as a second line, because a document can be
built without the parser. A leaf's `[label]` and a span's `[text]` are content, and a container
has no label: `details` takes a `[…]{@summary /}` line, so `html()` needs no rule for where a
label goes. A closing line names what it closes, so a mismatch is a warning, not a silent wrong
nesting.

## Security

- **Raw blocks are trusted.** A ` ```=html ` block is written out verbatim, so it can contain script.
  That's the point for your own content: embeds, SVG, a checkout script. For untrusted input
  (comments, LLM output), the host should do one of two things:
  - reject documents that contain `raw` nodes. They're easy to find in the AST.
  - pass the output through the platform Sanitizer (below).
- **Everything else is safe by construction.** Outside raw blocks, unsafe values can reach the
  output only through URLs and attributes, and `html()` handles both:
  - It drops event-handler attributes (`on*`).
  - It drops any URL or attribute value with an unsafe scheme (`javascript:`, `vbscript:`, and
    `data:` other than images).
  - `style` and other attributes pass through, since limited styling is the point of attributes.
  - The AST keeps everything verbatim.
- The AST itself makes no safety promise. A consumer building its own output owns its policy.
- markz ships no sanitizer. In the browser, a host that wants defence in depth passes `html()`'s
  output to the platform's HTML Sanitizer API (`Element.setHTML()`). Chrome 146 and Firefox 148
  ship it and Safari doesn't yet, so feature-detect it and fall back to DOMPurify.

## Package

The package is `@amitkaps/markz` (npm refuses the bare `markz` as too close to `marked`), and it
belongs to no application.
There is one package, no `markz-*` companions. It is ESM only, built by `vp pack`
into `dist/index.js` and its types, with one entry, `src/index.ts`: anything it doesn't
re-export is private. It has no runtime dependencies and `sideEffects: false`, so a consumer
tree-shakes what it doesn't call, and `prepack` builds, so a tarball never ships a stale `dist/`.

A release is a `vX.Y.Z` tag matching `package.json`'s version. `.github/workflows/release.yml`
checks, tests and packs it, stages that tarball on npm with provenance, and attaches it to a
GitHub release. npm trusts the workflow to stage, so no npm token is stored anywhere, and nothing
reaches users until a maintainer approves the staged version with 2FA (`npm stage approve`): a
tag push alone can't publish. A pre-release (`vX.Y.Z-rc.N`) goes to the `next` dist-tag and
never becomes `latest`.

## Performance and size

**The budget is 20 KB gzip** for everything `import { parse, html } from '@amitkaps/markz'` pulls in,
bundled and minified. `pnpm size` measures it and CI fails above it. The budget is why markz
parses for itself: a general parser with GFM and extensions leaves little room for anything
else. The language drops named entities, so no build carries a 12 KB entity table, and one
budget covers Node, Workers and the browser.

**Speed is a property of the design** before it is a number: one pass over the source, linear
time, no backtracking, and a flat tree of typed arrays with offsets into the source.
`test/complexity.test.ts` holds linear time on adversarial patterns and a multi-megabyte
document, and is the only timing CI gates on.

- `pnpm bench` is markz alone (`test/speed.ts`), on the working tree, in seconds: MB/s per
  document tier and per construct against this machine's baseline with a noise band, and what
  holding the CommonMark spec's tree costs.
- `pnpm bench --compare` times markz beside markdown-exit, marked and micromark on the blocks
  they all read alike, each in a fresh process. It is for our own insight. The parsers make
  different trade-offs, so nothing from it is published.
- The site's Quality page measures this commit's build when the site is built: the gzip size
  against the budget, the memory held by one document's tree, and parse + HTML time on documents
  a reader can picture, each a range, with the machine named.

## Testing

- **One set of examples, filed by the dialect:** every example, upstream or markz's own, is filed
  under a construct's id or a Not supported row's warning code, and every construct and row has
  examples. Where an example comes from is a label, not a category.
- **The grammar:** [`grammar.md`](grammar.md), read by markz, is well formed (every name defined, every production
  reachable) and matches [`syntax.md`](syntax.md): the same construct ids in the same order, under
  the same parts, each opening with its origin.
- **Every construct at its edges:** cases written from a construct's productions, and every
  one-character edit of them, must be read by markz exactly when the grammar accepts them, with
  the node their delimiters decide. Where the two part, a Not supported warning or a named side
  rule must say why (`test/harness/cases.ts`). Each construct also has a hand-written ambiguous and
  unclosed example, or a reason it can't.
- **Differential against micromark + GFM:** every CommonMark and GFM spec example in a shared
  construct must give identical `html()` output, compared with smart punctuation normalized back
  to straight characters. So must documents the fuzzer generates from the CommonMark and GFM
  productions of the grammar, unless markz reported a cut form. An example where markz keeps a
  construct under its own rule (no run splitting) is filed as differing, under that construct, and
  a generated document that needs one is left out with its reason, as are the few where micromark
  parts from commonmark.js.
- **Rejected syntax:** an example that uses a form `syntax.md` cuts must raise that row's warning,
  so the cuts are tested rather than skipped. markz's own examples (`test/examples/markz/`, one file per
  construct, in the CommonMark spec's format) also give their exact HTML and the text each warning covers.
- **Constructs beyond GFM:**
  - elements and spans, by markz's own examples, and colon directives, from
    `micromark-extension-directive`'s suite, each reported
  - metadata: every row of the value table in `syntax.md`, each checked against the `yaml`
    package, and every YAML look-alike (`~`, `True`, `1e3`, …) giving a warning, not a string
  - math, including `$` used as currency
  - expressions: nesting, strings, comments, escapes, and emphasis inside `${…}`; malformed
    JavaScript that still closes; the regex-literal limit
  - attributes: the three placements, text fallbacks such as `{a, b}`, and oxfmt's blank line
    before headings
- **No backtracking:** every adversarial pattern (unclosed openers, deep nesting, long repeats)
  takes less than eight times as long at four times the size, where quadratic work would take
  sixteen.
- **Heading ids:** `syntax.md`'s contract cases, verbatim, plus apostrophes and quotes, which
  slug the same straight or curled (`Don't` and `Don’t` both give `dont`), and a reused explicit
  id producing a warning.
- **Offsets** are asserted against known source, never against rendered output. This includes
  escapes, numeric references, astral characters, CRLF and nested containers.
- **Tree structure:** parent, child and sibling invariants.
- **Robustness:** fuzzed noise, mutated examples and documents from the whole grammar must be
  sound: no throw, a valid tree, warnings inside the source, the same page whatever the line
  endings, and safe HTML. A multi-MB document guards the ordinary path against quadratic
  behaviour.
- **Real documents** (`test/documents/`): agent-written docs from markz and the projects that
  use it, and human-written documentation (Node.js, the Rust book, Vite). Each is sound as
  written and after oxfmt, its common blocks read as micromark reads them, formatting never
  changes what it means, and its warnings are a snapshot.

Open questions are kept with the ideas to improve, in [Lessons](lessons.md#ideas-to-improve).
