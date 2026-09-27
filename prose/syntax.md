# Syntax

This is markz's dialect. It keeps GFM's everyday symbols, uses directives as its one extension
syntax (with `{…}` attributes in a few fixed places), and adds a metadata block, math and `${…}`
expressions. It cuts everything that makes Markdown need backtracking. There is one way to write
each thing. The rendered site is the primary target. A markz document stays readable on GitHub,
but it doesn't have to render identically there. Anything markz rejects stays literal text and
adds an entry to `doc.warnings` saying what to write instead. It is never silently reinterpreted.

The cuts and the attribute rules follow [djot](https://github.com/jgm/djot#rationale). The
reasons are in the [spec](spec.md#markdown-dialect).

A document is made of three parts, in this order: [Metadata](#metadata), then [Block](#block)
constructs, which hold [Inline](#inline) content. Every construct below opens with its origin: the
earliest layer that defines it. The layers build on each other in this order: CommonMark, then
GFM, which extends it, then micromark-extension-directive, then djot. Math is outside the chain,
with pandoc's and GitHub's delimiters in GitHub's HTML shape.

- **As CommonMark** or **As GFM:** the same syntax and result. micromark with GFM is the oracle,
  and these constructs are the only place "the same as GFM" applies.
- **As CommonMark, except** or **As GFM, except:** that construct with the listed cuts. Each cut
  is a row of [Not supported](#not-supported).
- **From micromark-extension-directive, djot or pandoc,** or **As GitHub:** that source's rule,
  with any difference named.
- **markz:** markz's own rule, given in full.

This page explains the dialect, and the [grammar](#grammar) states it. Each construct has a stable
id, set by the `{#id}` line above its heading. The grammar and the test suite refer to constructs
by that id: every construct has examples, and every example belongs to one construct or to a row
of Not supported, keyed by its warning code.

{#metadata}

## Metadata

**markz.** Kept to what YAML 1.2, GitHub and formatters read the same way.

A document can open with a metadata block: key/value pairs between `---` lines, starting at
offset 0 (what other tools call frontmatter). It is a metadata block only when a closing `---`
line follows, every line between looks like metadata (`key:`, a comment, an indented line or a
blank line), and at least one is a `key:` line. Otherwise the first `---` is a thematic break, so
a document that opens with a rule keeps its content. markz parses it into `doc.metadata`, a flat
object, and keeps the block's range.

The rule is JSON-like, with quotes optional: one `key: value` per line, where a value that doesn't
look like anything else is a string as written.

```yaml
---
# a comment
title: Sales Report
summary: 'Make it yours: Cloudflare, secrets.'
order: 2
draft: false
date: 2026-09-26
image:
tags: [svelte, vite]
---
```

| Value              | Result                                                       |
| ------------------ | ------------------------------------------------------------ |
| nothing, or `null` | `null`                                                       |
| `true`, `false`    | boolean                                                      |
| `42`, `-3`, `1.5`  | number                                                       |
| `"text"`           | string, with JSON's escapes                                  |
| `'text'`           | string, with `''` for a quote and no other escapes           |
| `[a, 2, "b, c"]`   | a list of values by these same rules, one line, no nesting   |
| anything else      | string, as written: `Sales Report`, `2026-09-26`, `C# notes` |

- **Keys** are `[A-Za-z_][A-Za-z0-9_-]*`, and a key appears once.
- **Comments:** a line starting with `#`, or ` #` after a value, as in YAML.
- **Both quote styles** are accepted because formatters pick one by configuration (oxfmt writes
  single quotes in this repo and double quotes by default). Quote a value that would otherwise
  read as something else (`"true"`, `"42"`), that contains `: `, or that starts with a
  character YAML reserves (`{ & * ! | > % @`, a backtick, or `- `). In a list, also quote an item
  that contains `,`, `[` or `]`.
- **YAML look-alikes are errors, not strings.** The block is still YAML to GitHub, editors,
  formatters and any YAML parser, and every block markz accepts has the same value under YAML
  1.2. So a plain value YAML would read differently gets the warning `metadata-value`, not a
  silent string:
  `True`, `FALSE`, `~`, `Null`, `+1`, `.5`, `1e3`, `0x1F`, `.inf`. Write the canonical form or
  quote it.
- **Everything else in YAML is out:** indented lines (nested maps, `- item` lists, multi-line
  strings), `|` and `>`, `{a: b}`, anchors, aliases and tags. Each gets a warning
  (`metadata-indented`, `metadata-line` or `metadata-value`), and its key is skipped. Of two
  duplicate keys, the first wins and the second gets the warning `metadata-duplicate-key`.

markz is not a YAML parser. The `yaml` package is its dev-only test oracle, as micromark is for
the Markdown: every accepted block must give the same object from both.

## Block

{#paragraph}

### Paragraphs

**As CommonMark, except** that a paragraph never continues lazily into a blockquote or list item (see
Blockquotes and Lists).

- Text separated by a blank line.
- **A poem or a quote with its own line breaks** gets `{.verse}` on the line above. `html()`
  writes it as a normal paragraph, `<p class="verse">`, and the paragraph's newlines are kept in
  the output. The site's CSS `.verse { white-space: pre-line }` shows them. The `\` on every
  line isn't needed.

```md
{.verse}
Moko kahan dhundhe re bande
Main to tere paas mein
```

{#heading}

### Headings

**As CommonMark, except** that only the `#` form exists, and **markz** gives every heading an id.

`#` to `######`, then a space, and one line of content. The optional closing `#`s
(`## Title ##`) are accepted and stripped, as GFM does.

Every heading gets an id, settled as the heading is parsed. No id depends on a later heading, so
none changes once it is written, which keeps streaming simple:

- **`{#id}` on the line above sets it exactly**, giving an anchor that survives renaming the
  heading. If an earlier heading already has that id, both keep it, the browser uses the first,
  and the later one gets the warning `duplicate-id`.
- **Otherwise it is generated** with GitHub's algorithm, and numbered `-1`, `-2`, … past any id
  already used, explicit or generated.

The algorithm:

1. Take the heading's plain text: text and inline-code values, with escapes and numeric
   references decoded, punctuation curled, and `\ ` as a space. Link text counts; URLs, image alt
   text, math and expressions don't.
2. Lowercase it.
3. Remove every character that isn't a letter, mark, number, space, `_` or `-`. Letters in any
   script are kept, and there is no NFKC normalization, as on GitHub.
4. Trim, then turn each run of whitespace into `-`.
5. If nothing is left, use `section`.
6. If the id is taken, try `-1`, `-2`, … until one is free.

These cases are the contract, and the tests hold to them:

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

In a document of its own, a heading whose text looks like a suffix keeps it, and the second
`foo` goes past it: `# foo-1`, `# foo`, `# foo` give `foo-1`, `foo`, `foo-2`.

{#blockquote}

### Blockquotes

**As CommonMark, except** that `>` starts every line. A line without it ends the blockquote.

{#list}

### Lists

**As CommonMark, except** that there are no lazy continuation lines, and **from GFM**, task items.

| Construct    | Syntax                              | Notes                                                                                                    |
| ------------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Bullet list  | `- item`; `*` and `+` also accepted | Changing the marker starts a new list, as in GFM. oxfmt writes `*` for the second of two adjacent lists. |
| Ordered list | `1. item`; `1)` also accepted       | The first number sets `start`. Changing the delimiter starts a new list, as with bullets.                |
| Task item    | `- [ ] todo`, `- [x] done`          | `listItem.checked`                                                                                       |

- Content that continues a list item is indented to that item's content column.
- Tight and loose lists follow GFM: a blank line between items makes the list loose.

{#code-block}

### Code blocks

**As CommonMark, except** that the fence is backticks only.

` ``` ` or longer, then an info string. The first word is `lang` and the rest is `meta`. Nest by
using a longer fence.

{#raw-block}

### Raw blocks

**From djot.**

A fenced block whose info string is `=html` is raw output. `html()` writes its content out
verbatim. It is the only way to put HTML in a document, and it's explicit, so it needs no
backtracking:

````md
```=html
<iframe src="https://w.soundcloud.com/player/?url=…" height="166"></iframe>
```
````

- It's for embeds, inline SVG, and `<style>` or `<script>` a page needs. There's no `=css` or
  `=js`: in djot, `=format` names an output format (`=html`, `=latex`), not a language. CSS and
  JavaScript go inside `=html` as `<style>` and `<script>`.
- A raw block for any other format (`=latex`) is kept in the AST, and `html()` skips it.
- An ordinary ` ```css ` or ` ```js ` fence is code to show, never to run. What a consumer
  executes (visdown's `js` cells) is the consumer's own decision.
- Raw blocks are trusted content: see [the spec's security section](spec.md#security).
- On GitHub a raw block shows as a code block.

{#math-block}

### Math blocks

**As GitHub.** `$$` fences on lines of their own. The node holds the raw TeX, and markz doesn't
typeset it. `html()` writes `<pre><code class="language-math math-display">`, and the host adds
KaTeX or Temml. A ` ```math ` fence stays an ordinary code block with `lang: "math"`, and its HTML
is already the `language-math` shape.

{#table}

### Tables

**As GFM.** A pipe table with a `---` delimiter row. `:---`, `:---:` and `---:` set alignment.
The outer pipes are optional, and a delimiter row with no pipe needs a colon, so `Title` over
`---` is still a rejected setext heading (`setext-heading`).

{#thematic-break}

### Thematic breaks

**As CommonMark, except** that the marker is `---` only.

{#directive}

### Directives

**From micromark-extension-directive.** Leaf and container directives are blocks; text
directives are in [Inline](#text-directive). The trailing `{…}` follows the
[attribute syntax](#attributes).

- **leaf**: `::name[label]{attrs}`, on a line of its own. A bare `::name` is allowed, since the
  line can't be prose.
- **container**: `:::name[label]{attrs}` … `:::`. The closing fence needs at least as many colons
  as the opening one, and the outermost open directive it can close takes it, as in micromark. So
  nest with a longer outer fence (`::::outer` around `:::inner`), as with code fences. An unclosed
  container runs to the end of its own container or the document.
- A name starts with a letter.

Directives are how components with data are written, since there is no HTML:

```md
::chart{data="sales" type="bar"}

:::callout{type="warning"}
Markdown **inside**, parsed and source-mapped.
:::
```

`html()` writes a `<div>` for both, with the name as the first class and the attributes as they
are for any element. The label means different things by kind:

- **leaf:** the label is the content. It is parsed as inline Markdown, and its nodes are the
  directive's children.
- **container:** the body is the content, and the label is metadata: a title for a callout, a
  summary for a disclosure. It is plain text, with backslash escapes decoded and no inline
  parsing, and `html()` writes it first, in its own element:

```md
:::callout[Warning]{.important}
Body **here**.
:::
```

```html
<div class="callout important">
	<div class="directive-label">Warning</div>
	<p>Body <strong>here</strong>.</p>
</div>
```

A consumer's own fold, such as visdown's Svelte codegen, maps names to components and labels to
their props.

{#attributes}

### Attributes

**From djot**, in fewer places. Directives are the universal extension syntax: components,
wrappers around blocks, and inline spans. `{…}` is their attribute part. It may also appear in two
other places, where it decorates an element Markdown itself made and a directive would have to
wrap or reinvent that element:

```md
{#pricing .center}

## Pricing

![hero](hero.png){.wide width=600} and the [docs](/docs){target=_blank}.

{.striped}

| Plan | Price |
| ---- | ----- |
```

| Placement                                      | Applies to         | For                                                            |
| ---------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| After a directive's name or label              | the directive      | components and wrappers                                        |
| A line holding only `{…}`                      | the next block     | heading ids, and classes on tables, lists, code and paragraphs |
| Directly after an image or link, with no space | that image or link | `width`, `class`, `target`, `rel`                              |

This section defines the syntax for all three; the inline placements are also listed under
[Links and images](#link) and [Text directives](#text-directive).

- **Syntax:** `#id`, `.class` and `key=value`, with `key="a quoted value"` for spaces. Classes
  accumulate. For other keys, a later value wins. Values may contain `${…}`.
- **Block attributes:** blank lines may come between the `{…}` line and its block, because oxfmt
  inserts one before a heading. Consecutive `{…}` lines merge. A `{…}` line can't interrupt a
  paragraph or a table, where it is text. One with no block after it in its container stays text
  and gets the warning `orphan-attributes`.
- **On the element:** `html()` writes block attributes onto the block's own element: the `<p>`,
  `<h2>`, `<table>`, `<ul>`, `<blockquote>`, and `<pre>` for code and math.
- **One line only.** djot lets attributes span lines, and markz doesn't. That keeps the block pass
  free of lookahead.
- **Anywhere else a `{` is text.** Inline, only a `)` directly before it can make it attributes,
  so `{a, b}`, `{"json": 1}` and prose braces never need escaping. A `{…}` in one of the three
  places that doesn't parse as attributes is text too.
- **Words and phrases** use a text directive: `:span[word]{.highlight}`. There is no djot-style
  `word{.x}` or `[span]{.x}`.

{#comment}

### Comments

**markz.** `<!-- … -->` on lines of its own becomes a `comment` node, which `html()` never
renders. It is the only thing kept from HTML. prose's Markdown notes need it (`<!-- @note … -->`),
and GitHub hides comments too.

- It may span lines, and ends on the line with `-->`. Text after `-->` on that line is part of the
  comment and gets the warning `comment-trailing-text`. An unclosed comment runs to the end of its container.
- A comment that shares its first line with other text is inline, where it is text.

## Inline

{#emphasis}

### Emphasis

**As CommonMark, except** for the markers and the rules below, and **from GFM**,
`~~strikethrough~~`. The markers are `_emphasis_`, `**strong**` and `~~strikethrough~~`. Where a run may open or close follows CommonMark's flanking
rules, without the rest of its 17:

- A run can't open before whitespace, or before punctuation that follows a letter, and the mirror
  image for closing. `_` never opens or closes inside a word, so `snake_case_name` stays text.
  `**` may appear inside a word.
- A closer takes the nearest open run of its own kind. There is no rule of 3, and runs don't
  split: `***`, `____` and `~~~` are text, and `**foo****` doesn't nest.
- Emphasis doesn't cross brackets: a run opened before a `[` can't close before its `]`, even
  when the brackets don't make a link.
- **`*emphasis*` where formatters write it.** Prettier and oxfmt write `_` for emphasis except in
  two places, where `_` can't work: emphasis inside `_…_` (`_foo *bar* baz_`) and emphasis
  touching a letter or digit (`a*b*c`). markz accepts `*` in exactly those two, so it never
  rejects formatted output. Anywhere else a `*…*` pair stays text and is reported, like `__…__`
  and `~…~`.

On ordinary text this matches GFM. Where it disagrees, the spec examples and differential fuzzing
against micromark find the case, and it is either fixed or listed here: the examples that need a
run split, such as `****foo****`, differ by design.

{#inline-code}

### Inline code

**As CommonMark.** `` `code` ``, ` `` a ` b `` `: any number of backticks.

{#link}

### Links and images

**As CommonMark, except** that only the inline form exists.

| Construct | Syntax                                          | Notes                                                                  |
| --------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Link      | `[text](url "title")`                           | Relative URLs go here: `[About](/about)`.                              |
| Image     | `![alt](url "title")`                           |                                                                        |
| Autolink  | `<https://…>`, `<mailto:…>`, `<me@example.com>` | An absolute URL with a scheme, or an email address, in angle brackets. |

A `{…}` directly after the `)` of a link or image, with no space, is its
[attributes](#attributes): `![hero](hero.png){.wide width=600}`.

{#text-directive}

### Text directives

**From micromark-extension-directive, except** that a label or attributes is required.

`:name[label]`, `:name{attrs}` or `:name[label]{attrs}`. The trailing `{…}` follows the
[attribute syntax](#attributes).

- A label or attributes is required, so `hello :world` and `10:30` stay plain text: a colon in
  prose is never special, and the parser knows it has a directive as soon as it reaches the `[` or
  `{`. A bare `:name` is not a construct in markz, so it gets no warning. This is the fix for
  micromark's long-standing complaint
  ([directive#33](https://github.com/micromark/micromark-extension-directive/issues/33)), where
  bare `:name` swallows prose.
- A name starts with a letter, so `localhost:8000` is never a directive. A text directive may
  start inside a word (`H:sub[2]O`), as in micromark, since the label or attributes already make
  it deliberate; it can't start straight after another `:`.
- The label is the content. It is parsed as inline Markdown, and its nodes are the directive's
  children.

`html()` writes a `<span>`. `:span[text]{.x}` is the plain inline wrapper. The name becomes the
first class, and the attributes are written as they are for any element.

Six names are HTML's own inline elements, for text that needs its real tag rather than a styled
span. `html()` writes them as that element, with the attributes and no name class:

| Source                   | HTML                          |
| ------------------------ | ----------------------------- |
| `x:sup[2]`               | `x<sup>2</sup>`               |
| `H:sub[2]O`              | `H<sub>2</sub>O`              |
| `:ins[new]`              | `<ins>new</ins>`              |
| `:mark[text]`            | `<mark>text</mark>`           |
| `:kbd[Ctrl]`             | `<kbd>Ctrl</kbd>`             |
| `:abbr[HTML]{title="…"}` | `<abbr title="…">HTML</abbr>` |

They are still `directive` nodes in the AST, so a consumer's fold sees them like any other. There
is no `:del`, because `~~text~~` already writes `<del>`: an edit is `~~old~~ :ins[new]`. The names
apply to text directives only. `::sup` and `:::mark` are ordinary divs.

{#inline-math}

### Inline math

**From pandoc**, in GitHub's HTML shape. `$…$`: the opening `$` is followed by a non-space
character, and the closing `$` follows a non-space character and isn't followed by a digit, so
`costs $5 and $10` stays text. `${` always starts an expression and never math. The node holds the
raw TeX, and `html()` writes `<code class="language-math math-inline">`.

{#expression}

### Expressions

**markz.** `${…}` is a JavaScript template-literal interpolation, parsed as an `expression` node
that holds the code and its range. markz never evaluates it.

- It is recognised in any inline position, in link destinations and in attribute values.
- It binds tighter than emphasis, the way inline code does, so `${a * b * c}` is one expression.
- The closing `}` is found by tracking brace depth, which also skips strings, template literals
  (including nested `${}`) and comments inside the code.
- It is inert inside inline code, fenced code, math and autolinks.
- `\${` is a literal `${`.
- An unclosed `${` is text.
- markz only finds the matching `}`. It never validates the JavaScript, so malformed code whose
  braces, strings and comments close is still an expression. `${foo /* } */ + {a: 1}}` is one
  expression.
- Regex literals aren't recognised, because telling `/` as division from `/` opening a regex
  needs a JavaScript parser. A `}` inside a regex (`${s.replace(/}/g, '')}`) closes the
  expression early. Write it as `}`, or move the regex out of the document.
- `html()` writes the literal source text, escaped.

{#line-break}

### Line breaks

**As CommonMark, except** that `\` at the end of a line is the only hard break. It is visible and
explicit, and GitHub renders it too. Any other line ending inside a paragraph is a soft break. For
a poem, see `{.verse}` under [Paragraphs](#paragraph).

{#escape}

### Escapes and references

**As CommonMark, except** that there are no named character references, and **from djot**, `\ ` is a
non-breaking space.

- A backslash before any ASCII punctuation character is that character: `\*`, `\_`, `\$`, `\{`, …
- Numeric references decode: `&#169;`, `&#x2014;`. They are the only character references.
- `&` is ordinary text: write it literally, and `html()` escapes it.
- `\` followed by a space is a non-breaking space (U+00A0): `10\ km`, `Dr.\ Smith`. GFM keeps both
  characters as text. In a heading id it counts as a space.

{#smart-punctuation}

### Smart punctuation

**From djot.** Built in, and applied to text only, never to code, math, expressions, URLs or
attribute values.

| Source              | Text value                                                           |
| ------------------- | -------------------------------------------------------------------- |
| `"quoted"`          | `“quoted”`                                                           |
| `'quoted'`, `don't` | `‘quoted’`, `don’t`                                                  |
| `--`                | `–` (en dash)                                                        |
| `---`               | `—` (em dash). A line holding only `---` is still a horizontal rule. |
| `...`               | `…`                                                                  |

- Whether a quote opens or closes is decided by the character before it: start of text,
  whitespace, an opening bracket, a dash, another quote or an emphasis marker means it opens.
- A run of more than three hyphens is split into em and en dashes with the same count.
- `\"`, `\'`, `\-` and `\.` keep the straight character.
- The text node's `value` holds the typographic character, and its range still covers the
  source characters. `value` and `textContent()` are the rendered text: escapes and numeric
  references decoded, punctuation curled. What the author typed is always
  `source.slice(start, end)`, and a consumer that needs the source uses that.
- Heading ids are made from the typographic text. Quotes and dashes are punctuation, so they
  drop out, and `Don't` and `Don’t` give the same id.

## Not supported

Each of these stays literal text and adds a warning over exactly its characters. The warning's
`code` is the table's first column, and its `instead` is the "Write instead" column. They are cut on principle, not
missing features: the Why column says what each would cost. Two look-alikes are ordinary prose, so
they stay text without a report: a lone `[x]` (a reference link's definition is reported instead)
and a bare `{…}`.

### Metadata forms

{.cuts}

| Code            | Syntax                | Write instead          | Why         |
| --------------- | --------------------- | ---------------------- | ----------- |
| `toml-metadata` | TOML metadata (`+++`) | a `---` metadata block | One format. |

### Block forms

{.cuts}

| Code                          | Syntax                                                                                       | Write instead                                             | Why                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `raw-html`                    | Raw HTML blocks and inline tags                                                              | a ` ```=html ` raw block, or directives and attributes    | Seven HTML-block kinds and a tag grammar. HTML stays possible, but only where it's marked.                                                |
| `setext-heading`              | Setext headings (`Title` over `===` or `---`)                                                | `# Title`                                                 | A paragraph would turn into a heading when the next line is read.                                                                         |
| `indented-code`               | Indented code blocks                                                                         | fenced code                                               | Indentation meaning code is what makes list indentation hard. The indented line is paragraph text, and never a heading or list inside it. |
| `tilde-fence`                 | `~~~` fences                                                                                 | a longer backtick fence                                   | One fence character.                                                                                                                      |
| `rule-marker`                 | `***`, `___`, `* * *` rules                                                                  | `---`                                                     | One marker.                                                                                                                               |
| `trailing-heading-attributes` | Trailing heading attributes (`## Title {#id}`)                                               | `{#id}` on the line above                                 | Under djot's rule this `{…}` belongs to the word "Title".                                                                                 |
| `multiline-attributes`        | Multi-line attributes                                                                        | one line                                                  | Keeps the block pass free of lookahead.                                                                                                   |
| `lazy-line`                   | Lazy continuation lines (a quoted or listed paragraph continuing without `>` or indentation) | `>` on every line, or indent to the item's content column | Lazy lines are the main reason CommonMark's block structure depends on context. Formatters already write them out in full.                |

### Inline forms

{.cuts}

| Code                | Syntax                                                                                      | Write instead                                                     | Why                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference-link`    | Reference links: `[x][y]`, `[x][]`, `[y]: url`                                              | inline links                                                      | A link can't be resolved until the whole document is read, which breaks local parsing and streaming.                                                                        |
| `footnote`          | Footnotes (`[^label]`, `[^label]: text`)                                                    | a text directive, such as `:note[text]`                           | A reference can't be resolved until the whole document is read, as with reference links. Nothing we write uses them.                                                        |
| `bare-url`          | Bare URLs (`https://…`, `www.…`, `me@example.com`)                                          | `<https://…>` or `[text](url)`                                    | GFM's largest construct, and the only one that has to look back at text already emitted: an email is known only at its `@`, and trailing punctuation is trimmed afterwards. |
| `relative-autolink` | Relative autolinks (`</docs/intro>`)                                                        | `[About](/about)`                                                 | An autolink needs a scheme, and `</about>` is a closing HTML tag, reported as raw HTML. A link should have real text.                                                       |
| `named-reference`   | Named character references (`&copy;`, `&amp;`, `&nbsp;`)                                    | the character itself (`©`, `&`), or `\ ` for a non-breaking space | Files are UTF-8, `html()` escapes `&` and `<` itself, and the table of 2,125 names is about 12 KB gzip.                                                                     |
| `trailing-spaces`   | Two trailing spaces as a line break                                                         | `\` at end of line, or `{.verse}` on a poem                       | Invisible syntax.                                                                                                                                                           |
| `underscore-strong` | `__strong__`                                                                                | `**strong**`                                                      | One marker. oxfmt rewrites it.                                                                                                                                              |
| `star-emphasis`     | `*emphasis*`, except inside `_…_` or touching a letter ([Emphasis](#emphasis))              | `_emphasis_`                                                      | One marker, and the source of most emphasis edge cases. oxfmt rewrites it.                                                                                                  |
| `single-tilde`      | `~single~` strikethrough                                                                    | `~~text~~`                                                        | One marker. oxfmt rewrites it.                                                                                                                                              |
| `inline-attributes` | Attributes after words, inline code or emphasis (`word{.x}`), and djot spans (`[text]{.x}`) | `:span[text]{.x}`                                                 | Directives already wrap inline text, so one way. Keeping `{` special only after a `)` means braces in prose are plain text.                                                 |
| `jsx`               | MDX: JSX (a capitalised tag, `<Chart />`) and bare `{…}` expressions                        | directives, `${…}`                                                | A `{` is only attributes where the rules above say so. Any other brace is prose, so a bare `{…}` stays text without a report.                                               |

## Canonical form

markz's "one way" is what oxfmt writes. oxfmt matches Prettier's Markdown output, and this repo
formats with it. We checked by running `vp fmt` over every alternate form:

| oxfmt rewrites                     | to                                 |
| ---------------------------------- | ---------------------------------- |
| `*em*`, `__strong__`, `***both***` | `_em_`, `**strong**`, `_**both**_` |
| `~one~`                            | `~~one~~`                          |
| `* item` (for a first list)        | `- item`                           |
| `1)` in a first list               | `1.`                               |
| `***`, `___`                       | `---`                              |
| `~~~` fences                       | ` ``` ` fences                     |
| `## Title ##`                      | `## Title`                         |

oxfmt leaves these alone: setext headings, indented code, two-space breaks, named entities,
bare URLs, reference links and raw HTML. For those, markz's warning is the only signal.

oxfmt keeps the attribute syntax, with two quirks the rules above absorb:

- It inserts a blank line between a block-attribute line and a heading that follows it.
- It keeps `{.x}` directly after an image or link.

One case needs care. For two adjacent lists, oxfmt keeps them apart by switching the marker
(`-` then `*`, `1.` then `1)`). That is why markz accepts all of GFM's list markers. Rejecting
`*` or `)` would reject oxfmt's own output.

## Grammar

[`test/grammar.ts`](../test/grammar.ts) states the dialect as data. For each construct it holds
the id, the part, the origin, the productions in EBNF, and the side rules EBNF can't state:
container prefixes, fence lengths, emphasis flanking, which block a line opens first. A form cut
above has no production. It is a Not supported row, keyed by its warning code.

The productions say what markz accepts, not how it reads it. On their own they are ambiguous, as
every Markdown grammar is, and the side rules settle each choice. The parser is written by hand
as the one reading of both: a single pass, deterministic, with lookahead that is bounded or
remembers where it failed ([spec](spec.md#parser-foundation)). The tests hold the grammar to this
page, with the same constructs, parts and origins, and from plan step 15 the fuzzer generates
documents from it.

## Pending decisions

None right now. The amitkaps.github.io audit settled raw blocks, verse and smart punctuation. Its
Markdown gets migrated to the dialect:

- `<img>` becomes `![](…){…}`.
- The `<div class="video-container">` wrappers become `:::video-container`.
- `<br>` becomes a trailing `\`.
- Embeds, SVG and the Stripe script go into ` ```=html ` blocks.
- Poems get `{.verse}`.
- `<sup>`, `<sub>`, `<ins>` and `<abbr>` become `:sup[…]`, `:sub[…]`, `:ins[…]` and `:abbr[…]{title=…}`.
- Named references become `&`, `\ ` and `—`.
