# markz

markz is a small, opinionated Markdown package for TypeScript/JavaScript, used the way marked is:
one install, `parse` for the AST and `html` for output. It has one fixed dialect (GFM's everyday syntax without
the parts that need backtracking, plus directives with `{…}` attributes, math, `${…}`
expressions and YAML frontmatter), one compact AST that can't be changed
after parsing and maps back to the source, and no parser options. Projects stop choosing and
configuring a Markdown stack. They render with markz, or fold its AST into whatever they need.

> **markz — small, opinionated Markdown.**
>
> **Make the Markdown decision once. Use markz everywhere.**

## Philosophy

Every project that touches Markdown ends up picking a parser, a plugin set, a slugger and a
position story, and each project picks differently. markz makes those choices once.

markz is standalone. It knows nothing about any consumer, and is meant to be useful to
documentation sites, blogs, editors, notebooks and compilers alike.

### Consumers that shape the design

Three projects exist today, and each already works around its Markdown stack. They are the
requirements. markz must not import anything from them.

| Project     | Uses today                                                       | Needs from markz                                                                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **base**    | `marked` + a regex frontmatter split + `yaml`                    | Frontmatter as a parsed object, plus its raw text and range. GitHub-style heading ids that are unique per page, in any script (today a custom `marked` renderer). HTML output.                                             |
| **visdown** | `unified` + `remark-parse` + `remark-gfm` + `remark-frontmatter` | A read-only fold from the AST into its own Svelte template tree. Code fences with lang and the exact body range. `${…}` as a parsed node, so Markdown can't break inside an expression. Frontmatter range for YAML errors. |
| **prose**   | `markdown-exit` to render; regexes for checks                    | HTML output with no raw HTML. Inline code spans, links (destination and range), headings with GitHub-compatible slugs, and paragraph line ranges, all mapped back to lines in the source file.                             |

## Core principles

- One package: parser, AST utilities and HTML renderer
- Small: 20 KB gzip at most, measured as bundled bytes rather than dependency count (see
  [Performance and size](#performance-and-size))
- Opinionated, with no configuration
- TypeScript-first
- Identical to GFM on the constructs it shares with GFM, with micromark as the test oracle
- Parsed in linear time with no backtracking, as djot is
- A compact, flat AST that can't be changed after parsing
- Exact source offsets on every node
- Ready for streaming: healing can be added at one point without changing `parse` (see
  [Streaming](#streaming))
- HTML output built in, and no framework renderers

## Markdown dialect

markz's dialect keeps GFM's everyday symbols and cuts the constructs that need backtracking. It uses
directives as its one extension syntax, with `{…}` attributes in a few fixed places, and adds
frontmatter, math and `${…}` expressions. There is
one way to write each thing. Every construct, what it's limited to, and what's left out is listed
in [`syntax.md`](syntax.md). This section gives the reasons.

**The rendered site comes first.** markz documents are written for sites that render them with
markz: base, visdown's output, `/__prose/`. On GitHub they stay readable, but they don't have to
render identically. That is what makes directives and `{…}` attributes possible, and with them
components, ids, classes and limited styling that plain Markdown can't express.

**The cuts follow [djot](https://github.com/jgm/djot#rationale),** because each one is a place
where CommonMark has to go back and change its mind:

| Cut                       | What forced backtracking                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| setext headings           | a paragraph becomes a heading when the next line is read                           |
| reference links           | `[x]: url` might be a definition or a paragraph, and links resolve only at the end |
| raw HTML                  | `<` might open a tag or be text                                                    |
| lazy continuation lines   | which block a line belongs to depends on context                                   |
| indented code             | indentation means code, except inside lists                                        |
| CommonMark emphasis rules | delimiter runs, flanking by punctuation class, the rule of 3                       |
| bare-URL autolinks        | an email is known only at its `@`, and trailing punctuation is trimmed afterwards  |

markz keeps GFM's symbols where djot changed them (`**strong**`, `_emphasis_`, `-` bullets), so
existing documents and habits carry over, and oxfmt's output is already canonical.

**What that buys:**

- A parser small enough to write by hand, in linear time with no backtracking (see
  [Parser foundation](#parser-foundation)).
- No raw HTML outside explicit ` ```=html ` blocks, so everything else `html()` writes is safe.
- No named-entity table.
- Nothing depends on later text in the document, which keeps streaming simple.

**Rejected syntax stays text and is reported, not reinterpreted.** Each rejected construct adds a
diagnostic to `doc.diagnostics` with its range and the supported form ("setext heading: use `#`").
Editors and prose's checks can show these. The parser never guesses.

There are no parser options.

## Heading IDs

Every heading gets an id. CommonMark defines headings but not ids, so every renderer adds them
its own way or not at all: marked and markdown-it add none, and GitHub uses its own slugger. markz
builds ids into the dialect, as djot does:

- **An explicit id wins.** `{#pricing}` on the line above the heading ([`syntax.md`](syntax.md#attributes))
  gives an anchor that survives renaming the heading. Explicit ids aren't deduplicated: the HTML
  keeps both and the browser uses the first, as in djot. Each duplicate adds a diagnostic.
- **Otherwise the id is generated,** after parsing, from the heading's text. Generated ids skip every
  explicit id in the document and are deduplicated among themselves.

The generator is GitHub's algorithm (github-slugger's), matching what base already ships:

1. Take the heading's text content: text and inline-code values, with numeric references and escapes decoded.
   Link text counts, but URLs, image alt text, math and expressions do not.
2. Lowercase it.
3. Remove every character that isn't a letter, mark, number, space, `_` or `-`. Letters are
   Unicode letters in any script, so they are kept. No NFKC normalization, which GitHub doesn't do.
4. Trim, then turn each run of whitespace into `-`.
5. If the result is empty, use `section`.
6. If the slug is taken, try `-1`, `-2`, … until one is free. A heading whose own text slugs to
   `foo-1` therefore can't collide with the suffix given to a second `foo`.

These golden cases, carried over from base's tests, are the contract for generated ids:

| Heading                              | id               |
| ------------------------------------ | ---------------- |
| `## Foo`                             | `foo`            |
| `## Foo`                             | `foo-1`          |
| `## Foo 1`                           | `foo-1-1`        |
| `## Café au lait`                    | `café-au-lait`   |
| `## शुरुआत करें`                     | `शुरुआत-करें`    |
| `## 日本語の見出し`                  | `日本語の見出し` |
| `## 1. Rename`                       | `1-rename`       |
| `## See [docs](https://example.com)` | `see-docs`       |
| `## ???`                             | `section`        |

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

Data specific to one node type (heading depth and id, link destination, code lang, directive
attributes, …) lives in a side table indexed by node. The exact layout is an implementation detail
that benchmarks decide.

This is the same flat-array idea as Comark's compact AST (`[tag, attrs, ...children]`), taken
further. markz's nodes are indices rather than nested arrays, so parent and sibling links are free,
and every node has offsets. Comark's AST has none.

### Read-only, and transformations are folds

A `Document` can't be changed after parsing. Neither consumer changes Markdown trees in place:

- **visdown** folds the AST into its own Svelte template tree. It pulls out `js` cells, turns
  headings and paragraphs into elements, and turns `expression` nodes into Svelte `{…}`.
- **prose** and **base** render it to HTML with `html()`, which is itself a fold.

Both are a walk that builds a new structure. So markz provides a fast `walk` with `enter`/`exit`
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
frontmatter          parsed flat object (a YAML subset), raw text, value range
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
footnoteReference    label
footnoteDefinition   label
directive            kind: text | leaf | container; name, label, attributes
math                 inline | block; raw TeX, value range
raw                  format (`html`, …), value, content range; from a ` ```=format ` fence
expression           code, code range
````

Directives, blocks, images and links can carry attributes: an id, classes and key-value pairs,
each with its source range. They're kept in a side table, so the common case (no attributes)
costs nothing.

Changes from the earlier list: `footnote` is dropped, because GFM has no inline footnotes, and
`task` became `listItem.checked`, because a task is a property of an item. `frontmatter`,
`comment`, `raw`, `math` and `expression` are added. `html` and `definition` are gone, because
HTML is only possible in explicit raw blocks, and reference links aren't in the dialect.

## Source locations

Offsets are canonical, and they are UTF-16 code units into the exact string passed to `parse`.
Line and column are computed from them, not stored.

Rules:

- **A node's range covers its markers.** A heading includes `##`, a fence includes both fences, and a
  link includes `[`, `](…)`. The trailing line ending is excluded.
- **Content ranges** are exposed as extra fields where consumers need them: a code block's body,
  a link's destination, frontmatter's YAML, a directive's label, and every attribute block.
- **Text nodes map to source, not just to their value.** `value` is decoded (`&#169;` → `©`,
  `\*` → `*`), and `start`/`end` cover the raw characters. A consumer scanning for syntax of its
  own reads `source.slice(start, end)`, so a decoded escape can't shift its columns.
- **Containers with prefixed lines** (blockquotes, list items) span from their first
  marker to the end of their last content. The `> ` and indentation prefixes inside that span
  belong to no child.
- **Line endings and BOM:** CRLF and a lone `\r` both end a line. A leading BOM is part of the
  source and falls before `document.start`.

`position(source)` builds a line-start table once and converts offsets to `{ line, column }` by
binary search. Lines are 1-based and columns are 0-based, which is visdown's convention and
matches source-map v3. Consumers that parse an extracted string (prose parses comment bodies with
their `*` gutters stripped) map lines back to the file themselves. markz only promises offsets
into what it was given.

## Parser foundation

markz has its own parser. It is written for this one dialect, runs in linear time with no
backtracking, and emits straight into the flat AST:

```text
source → block pass (lines → containers, leaves) → inline pass (per leaf) → heading ids → flat AST + diagnostics → html()
```

**Everything is built in.** Directives, expressions, math, attributes, raw blocks, frontmatter,
smart punctuation and heading ids are cases in the same two scanners. They aren't plug-ins
layered on a CommonMark core, because a fixed dialect needs no extension points. That also keeps
precedence in one place: `${…}` binding tighter than emphasis is just the order of the inline
scanner's cases. Heading ids are the one step after the passes, because a generated id has to
avoid an explicit `{#id}` that may appear later. That step walks the heading list, not the
source.

**No backtracking, as in djot.** The cuts in the [dialect](#markdown-dialect) remove every
construct whose meaning depends on text after it. What remains is openers (`[`, `_`, `**`, `` ` ``,
`$`, `${`, and `{` after a `)`) that either close or turn out to be text:

- **Openers go on a stack.** An opener still unmatched at the end of its block becomes text by
  patching the output. The input is never read again.
- **Scans that can fail are bounded.** A link destination `](…`, an attribute block `{…}` or an
  autolink `<…>` is scanned forward once. Each records the furthest point where it failed, so later
  scans stop there, and a line full of unclosed `](` stays linear.
- **Block attributes are one line**, so the block pass never looks ahead.

**micromark is the test oracle, not a runtime dependency.** It is thoroughly tested, and nothing
we write would beat it at full CommonMark compliance. The dialect doesn't need full compliance. It
needs to be _identical to GFM on the constructs they share_, and micromark with
`micromark-extension-gfm` checks exactly that. The same goes for `micromark-extension-directive`
on directives. All three are dev dependencies (see [Testing](#testing)).

The trade is deliberate. Shipping micromark keeps its compliance, but it is already 17.7 KB gzip
before markz adds anything (see [Performance and size](#performance-and-size)), and it carries
the constructs the dialect removes. The cuts are what make a small parser of our own safe to
write.

## Streaming

This is not in v1, because no consumer needs it. base, visdown, prose and amitkaps.github.io all
parse complete files. A live editor preview works with plain `parse` on every change: an unclosed
`**` shows as text until its closer is typed, as in every Markdown preview.

The use case it would serve is showing Markdown while it is still arriving, as in an LLM chat UI.
The design is kept ready for it, following Comark's model rather than incremental tokenizing:

- **One place to heal.** Openers wait on a stack until the end of their block (see
  [Parser foundation](#parser-foundation)). `parse` turns unmatched ones into text there. A
  future `parsePartial(source)` would close them instead, along with an open directive fence,
  and flag those nodes `partial`. Offsets would stay within the source, with no synthetic text
  inserted.
- **Parse the whole prefix again, once per chunk,** as Comark does. The dialect has no reference
  definitions, so later text never changes an earlier block. That makes reusing finished blocks a
  safe optimization, if it's ever needed.
- **It would be a new export.** Adding it later changes nothing for code that calls `parse`.

Deciding whether a half-typed opener (`hello *`) shows or vanishes, and avoiding flicker when
`*` turns out not to be emphasis, is left for when a consumer needs it.

## Public API

```ts
import { parse, html } from 'markz';

const doc = parse(markdown); // AST
const out = html(markdown); // or html(doc)
```

- `parse(source): Document`
- `doc.diagnostics`: rejected syntax, each `{ start, end, message, instead }`, where `instead` is
  the supported form
- `html(source | Document): string`
- `walk(doc, { enter?, exit? })`
- `textContent(doc, node): string`, the same text heading ids use
- `position(source): (offset) => { line, column }`

Nothing takes an options object.

## HTML output

`html()` is part of the package, as it is in marked. It is a fold over the AST, and it is how prose
and base consume markz. It works the same in Node, Workers and the browser, because it builds a
string and never touches the DOM.

- **Heading ids** are written as `id`.
- **Attributes** are written onto the element they belong to (see [Security](#security) for the
  ones that are dropped).
- **` ```=html ` raw blocks are written verbatim.** Raw blocks in other formats are skipped. Everywhere
  else, `<` and `&` in text are escaped, and comments are dropped.
- **Smart punctuation** is already in the text values, so `html()` writes curly quotes and dashes
  without a pass of its own.
- **Math, expressions and directives** are written in the shapes [`syntax.md`](syntax.md#supported-with-limits)
  gives for each.
- **Footnotes** follow GFM's output.

Framework output is not part of markz. Svelte, React and custom-element rendering are each a
consumer's own fold over the AST. visdown's Svelte codegen is the first of those, and it maps
directive names to its components.

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

The package is named `markz`, unscoped, and belongs to no application. The name is free on npm.
There is one package, no `markz-*` companions. It is ESM only and has one entry point. Packaging
details are in [`plan.md`](plan.md#packaging).

## Performance and size

**The budget is 20 KB gzip** for everything `import { parse, html } from 'markz'` pulls in, with
its dependencies bundled and minified. CI measures it. For comparison, prose ships `markdown-exit`
today, at about 46 KB gzip.

Baselines measured on 2026-09-26 (minified, gzip -9, browser build, parse only with no HTML
compile):

| Bundle                                 | gzip    |
| -------------------------------------- | ------- |
| micromark core (CommonMark)            | 12.3 KB |
| + GFM + directives                     | 17.7 KB |
| same, non-browser build (entity table) | 29.9 KB |
| micromark + GFM + directives to HTML   | 24.0 KB |
| markdown-exit (today, in prose)        | 45.8 KB |

These baselines are why markz parses for itself (see [Parser foundation](#parser-foundation)):
micromark with GFM and directives leaves about 2 KB for everything else. A renderer alone is
about 6 KB, judging by micromark's HTML compiler. The dialect also drops named entities, so no
build carries the roughly 12 KB entity table, and one budget covers Node, Workers and the
browser.

Also measure parse throughput, AST memory and allocations against micromark, markdown-it, marked,
markdown-exit and Comark. The unified/remark ecosystem stays out.

## Testing

- **Differential against micromark + GFM:** every example in the CommonMark and GFM spec suites
  that uses only shared constructs must give identical `html()` output, compared with smart
  punctuation normalized back to straight characters. So must fuzzed documents
  generated from the shared grammar.
- **Rejected syntax:** every row of the "Not supported" table in [`syntax.md`](syntax.md) stays
  text and produces its diagnostic.
- **Constructs beyond GFM:**
  - directives, against `micromark-extension-directive`
  - frontmatter: every row of the subset table in `syntax.md`, each checked against the `yaml`
    package
  - math, including `$` used as currency
  - expressions: nesting, strings, escapes, and emphasis inside `${…}`
  - attributes: the three placements, text fallbacks such as `{a, b}`, and oxfmt's blank line
    before headings
- **Heading ids:** explicit ids win, generated ids skip explicit ones, and explicit duplicates
  produce diagnostics.
- **No backtracking:** adversarial inputs (unclosed `](`, `{`, `<` and `_` repeated thousands of
  times) parse in linear time.
- **Heading ids:** the golden table above, verbatim.
- **Offsets** are asserted against known source, never against rendered output. This includes
  escapes, numeric references, astral characters, CRLF and nested containers.
- **Tree structure:** parent, child and sibling invariants.
- **Robustness:** malformed input, and a multi-MB document that guards against quadratic
  behaviour.
- **Consumer fixtures:** base's content docs, prose's `prose/*.md`, and visdown's examples.

The build order is in [`plan.md`](plan.md).

## Open questions

None right now. New dialect questions go in [`syntax.md`](syntax.md#pending-decisions).
