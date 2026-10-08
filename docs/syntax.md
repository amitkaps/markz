# Syntax

The markz language. It uses the symbols Markdown writers already know, `{…}` as its one
extension syntax (attributes decorate what Markdown makes, and `@name` makes an element), a
metadata block, math and `${…}` expressions. There is one way to write each thing, and nothing
needs the parser to read ahead and change its mind. A markz document stays readable on GitHub,
but is written for a site that renders it with markz. Anything markz rejects stays literal text
and adds an entry to `doc.warnings` saying what to write instead.

A document is made of three parts, in this order: [Metadata](#metadata), then [Block](#block)
constructs, which hold [Inline](#inline) content. Each construct has a stable id, set by the
`{#id}` line above its heading, which the [grammar](grammar.md) and the tests refer to it by.
Every example belongs to one construct, or to a row of [Not supported](#not-supported) keyed by
its warning code.

{#metadata}

## Metadata

A few `key: value` lines that GitHub, YAML and formatters all read without an error.

A document can open with a metadata block: key/value pairs between `---` lines, starting at
offset 0 (what other tools call frontmatter). Opening a document with `---` asks for metadata.
When a closing `---` line follows, everything between is the block, and a line the rule below
can't read is a warning, never a reason to read the block as Markdown. So a document can't open
with a `---` rule, and a formatter writes `***` there instead. Without a closing line, the first `---` is a thematic break, and if the next
line is a `key: value` line it gets the warning `metadata-unclosed`. markz parses the block into
`doc.metadata`, an object, and keeps its range.

The rule is JSON-like, with quotes optional: one `key: value` per line, where a value that doesn't
look like anything else is a string as written.

```yaml
---
# a comment
title: Sales Report
summary: "Make it yours: Cloudflare, secrets."
order: 2
draft: false
date: 2026-09-26
image:
tags: [svelte, vite]
deploy.name: my-site
---
```

| Value              | Result                                                              |
| ------------------ | ------------------------------------------------------------------- |
| nothing, or `null` | `null`                                                              |
| `true`, `false`    | boolean                                                             |
| `42`, `-3`, `1.5`  | number                                                              |
| `"text"`           | string, with JSON's escapes                                         |
| `'text'`           | string, with `''` for a quote and no other escapes                  |
| `[a, 2, "b, c"]`   | a list of values by these same rules, one line, no nesting          |
| anything else      | string, as written: `Sales Report`, `2026-09-26`, `C# notes`, `1e3` |

- **Keys** start with a letter or `_`, and hold letters, digits, `_`, `-` and `.`. A `.` is an
  ordinary character, as YAML reads it, so `deploy.name` is one key and nothing nests. A key
  appears once, and of two duplicate keys the first wins and the second gets the warning
  `metadata-duplicate-key`.
- **Comments** are lines that start with `#`.
- **Quote a value that YAML would read another way**, or the line gets the warning
  `metadata-value` and its key is skipped:
  - a value that holds `: `, or starts with one of `{ & * ! | > % @ , # ] }`, a backtick or `- `,
    which GitHub shows as a YAML error
  - a value that holds ` #`, since YAML drops the rest as a comment (`Issue #42`)
  - a yes or no word other than `true`, `false` and `null`, in any case (`True`, `no`, `off`,
    `~`), which code would read as a string that is true
  - a number written so that it would change (`01234`, `1.10`, `+1`, `.5`)

  In a list, also quote an item that contains `,`, `[` or `]`.

- **Both quote styles** are accepted, since a formatter writes the one its configuration picks.
- **Rare YAML forms are strings.** `1e3`, `0x1F` and `.inf` are written by no one in metadata, so
  markz reads them as written, with no warning. A YAML parser may read them as numbers, which is a
  difference, not damage.
- **Everything else in YAML is out:** indented lines (nested maps, `- item` lists, multi-line
  strings), `|` and `>`, `{a: b}`, anchors, aliases and tags. Each gets the warning
  `metadata-line` or `metadata-value`, and its key is skipped. A line that isn't a key line
  belongs to the value before it (`tags:` over `  - a`), so that key is skipped too.

## Block

{#paragraph}

### Paragraphs

A paragraph never continues lazily into a blockquote or list item (see Blockquotes and Lists).

- Text separated by a blank line.

{#heading}

### Headings

Only the `#` form exists, and every heading gets an id.

`#` to `######`, then a space, and one line of content. The optional closing `#`s
(`## Title ##`) are accepted and stripped.

The id is settled as the heading is parsed. No id depends on a later heading, so
none changes once it is written, which keeps streaming simple:

- **`{#id}` on the line above sets it exactly**, giving an anchor that survives renaming the
  heading. If an earlier heading already has that id, both keep it, the browser uses the first,
  and the later one gets the warning `duplicate-id`. A suffix would also need a warning, and the
  id the writer typed is the smaller surprise.
- **Otherwise it is generated** with GitHub's algorithm, and numbered `-1`, `-2`, … past any id
  already used, explicit or generated.

The algorithm:

1. Take the heading's plain text: text and inline-code values, with escapes and numeric
   references decoded, and `\ ` as a space. Link text counts, and URLs, image
   alt text, math and expressions don't.
2. Lowercase it.
3. Remove every character that isn't alphabetic, a mark, a decimal digit, a connector such as
   `_`, a space or `-`. Letters in any script are kept, and so are symbols Unicode counts as
   alphabetic (`Ⓐ`); other numbers (`½`, `²`), other whitespace and every other symbol go. There is
   no NFKC normalization, as on GitHub.
4. Turn each space into `-`, one for one: runs aren't collapsed and nothing is trimmed, so
   `a - b` gives `a---b`.
5. If nothing is left, use `section`.
6. If the id is taken, try `-1`, `-2`, … until one is free.

These cases are the contract, and the tests hold to them:

| Heading                              | id               |
| ------------------------------------ | ---------------- |
| `## Foo`                             | `foo`            |
| `## Foo`                             | `foo-1`          |
| `## Foo 1`                           | `foo-1-1`        |
| `## Café au lait`                    | `café-au-lait`   |
| `## शुरुआत करें`                         | `शुरुआत-करें`        |
| `## 日本語の見出し`                  | `日本語の見出し` |
| `## 1. Rename`                       | `1-rename`       |
| `## See [docs](https://example.com)` | `see-docs`       |
| `## a - b`                           | `a---b`          |
| `## 😄 Smile`                        | `-smile`         |
| `## ???`                             | `section`        |

In a document of its own, a heading whose text looks like a suffix keeps it, and the second
`foo` goes past it: `# foo-1`, `# foo`, `# foo` give `foo-1`, `foo`, `foo-2`.

{#blockquote}

### Blockquotes

`>` starts every line. A line without it ends the blockquote.

{#list}

### Lists

There are no lazy continuation lines, and an item can be a task.

| Construct    | Syntax                              | Notes                                                                                         |
| ------------ | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Bullet list  | `- item`; `*` and `+` also accepted | Changing the marker starts a new list. oxfmt writes `*` for the second of two adjacent lists. |
| Ordered list | `1. item`; `1)` also accepted       | The first number sets `start`. Changing the delimiter starts a new list, as with bullets.     |
| Task item    | `- [ ] todo`, `- [x] done`          | `listItem.checked`                                                                            |

- Content that continues a list item is indented to that item's content column.
- A blank line between items makes the list loose.

{#code-block}

### Code blocks

The fence is backticks only.

` ``` ` or longer, then an info string. The first word is `lang` and the rest is `meta`. Nest by
using a longer fence. A fence with no closing line runs to the end of its container, and gets
the warning `unclosed-block` at its opening line. So does a raw or math block.

{#raw-block}

### Raw blocks

A fenced block whose info string is `=html` is raw output. `html()` writes its content out
verbatim. It is the only way to put HTML in a document, and it's explicit, so it needs no
backtracking:

````md
```=html
<iframe src="https://w.soundcloud.com/player/?url=…" height="166"></iframe>
```
````

- It's for embeds, inline SVG, and `<style>` or `<script>` a page needs. There's no `=css` or
  `=js`: `=format` names an output format (`=html`, `=latex`), not a language. CSS and
  JavaScript go inside `=html` as `<style>` and `<script>`.
- A raw block for any other format (`=latex`) is kept in the AST, and `html()` skips it.
- An ordinary ` ```css ` or ` ```js ` fence is code to show, never to run. What a consumer
  executes is its own decision.
- Raw blocks are trusted content: see [Security](design.md#security).
- On GitHub a raw block shows as a code block.
- `=` names an output format only here, in a fence's info string. Inside `{…}`, `=` has no meaning,
  so `{=html}` is not raw.

{#math-block}

### Math blocks

`$$` fences on lines of their own, or `$$E=mc^2$$` alone on a line. The node holds the raw TeX,
and markz doesn't typeset it. `html()` writes `<pre><code class="language-math math-display">`,
and the host adds KaTeX or Temml. A ` ```math ` fence stays an ordinary code block with `lang: "math"`, and its HTML
is already the `language-math` shape.

{#table}

### Tables

A pipe table with a `---` delimiter row. `:---`, `:---:` and `---:` set alignment.
The outer pipes are optional, and a delimiter row with no pipe needs a colon, so `Title` over
`---` is still a rejected setext heading (`setext-heading`).

{#thematic-break}

### Thematic breaks

The marker is `---`, and `***` is read too.

- A formatter writes `***` for a rule on a document's first line, since `---` there would open
  metadata. markz reads what formatters write, so `***` is a rule wherever it is.
- `***` is three or more `*` with no spaces between. `___` and `* * *` are not rules, since no
  formatter writes them.

{#attributes}

### Attributes

`{…}` is markz's one extension syntax. Attributes decorate an element Markdown already makes, and
`@name` in them makes an element Markdown has no syntax for, a block [element](#element) or an
inline one in a [span](#span).

```md
{#pricing .center}

## Pricing

![hero](hero.png){.wide width=600} and the [docs](/docs){target=_blank}.

{.striped}

| Plan | Price |
| ---- | ----- |
```

| Placement                                                        | Applies to         | For                                                            |
| ---------------------------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| A line holding only `{…}`                                        | the next block     | heading ids, and classes on tables, lists, code and paragraphs |
| Directly after an image or link, with no space                   | that image or link | `width`, `class`, `target`, `rel`                              |
| Directly after `[text]`, with no space                           | a span of the text | classes on words and phrases, and inline elements              |
| Lines holding `{@name …}` and `{/name}`, or `[label]{@name … /}` | an element         | wrappers and components                                        |

This section defines the syntax for all four; the other places are also described under
[Elements](#element), [Links and images](#link) and [Spans](#span).

- **Syntax:** `#id`, `.class` and `key=value`, with `key="a quoted value"` for spaces, and a bare
  `key` for HTML's boolean attributes (`{@details open}`, `{@video-player src=cat.mp4 controls /}`),
  which `html()` writes as `key=""`. Classes accumulate. For other keys, a later value wins. Values
  may contain `${…}`. That is all of it: no single quotes, no spaces around `=`, no `.a.b`
  shorthand, and no character references, since each of those is a second way to write the same
  attribute.
- **`@name` comes first**, once: `{@call-out type=warning}`. So the parser knows it has an element
  at `{@`. A `/` just before the `}` closes a block element on its own line, and is allowed only
  there.
- **Boolean keys need company off an element, span, link or image.** A `{…}` of only bare keys on a
  line of its own, or after a word, stays text, because `{year}` there is an MDX expression or a
  placeholder, not attributes.
- **Block attributes:** blank lines may come between the `{…}` line and its block, because oxfmt
  inserts one before a heading. Consecutive `{…}` lines merge, and a `{…}` line above an element
  merges into the element's own. A `{…}` line can't interrupt a paragraph or a table, where it is
  text. One with no block after it in its container stays text and gets the warning
  `orphan-attributes`.
- **On the element:** `html()` writes block attributes onto the block's own element: the `<p>`,
  `<h2>`, `<table>`, `<ul>`, `<blockquote>`, and `<pre>` for code and math.
- **One line only,** which keeps the block pass free of lookahead.
- **Anywhere else a `{` is text.** Inline, only a `)` or `]` directly before it can make it
  attributes, so `{a, b}`, `{"json": 1}` and prose braces never need escaping. A `{…}` in one of
  the four places that doesn't parse as attributes is text too. Where it can only have been meant
  as attributes, after a link, image or `[text]`, or on a line starting `{@` or `{/`, it also gets
  the warning `attribute-syntax` (`[x]{@kbd type='bar'}`). After a link, image or `[text]`, a `{`
  with no `}` on its line gets it too (`[x]{@kbd`). A line starting `{@` or `{/` needs its `}`,
  and a line holding any other `{…}` gets no warning, since it may be prose.

{#element}

### Elements

An element is a `{…}` whose first item is `@name`, and the name is the element it writes. There is no HTML, so this is how wrappers and components with data are written. Inline
elements are [spans](#span).

```md
{@chart-view data="sales" type="bar" /}

{@call-out type="warning"}
Markdown **inside**, parsed and source-mapped.
{/call-out}
```

- **container**: `{@name attrs}` on a line of its own opens it, and `{/name}` on a line of its own
  closes it. The body between is Markdown.
- **leaf**: `[label]{@name attrs /}` on a line of its own, or `{@name attrs /}` with no label. The
  `/` means closed on this line, not empty: the label is parsed as inline Markdown, and its nodes
  are the element's children. The `/` is what makes the line a block. Without it,
  `[label]{@name}` is a span in a paragraph.
- **The name is an element**: a block element from the list below, or a custom element
  (lowercase letters, digits and `-`, starting with a letter and with a `-` in it, as
  `call-out`). Any other name, such as `{@chart /}` or `{@note}`, leaves the line as text and is
  reported (`element-name`). The name is never a class: classes come only from `.class`, so
  `{@div .note}` is a note and `{@note}` is not an element. Why is in
  [Element names](design.md#element-names).

The block elements are those Markdown has no syntax for and that can't run code: `div`,
`section`, `article`, `aside`, `header`, `footer`, `nav`, `main`, `address`, `hgroup`, `search`,
`details`, `summary`, `figure`, `figcaption`, `dl`, `dt` and `dd`.

Where a container opens and closes:

- **An opener can't interrupt a paragraph or a table**, as a `{…}` line can't. A leaf and a
  closer can, since `{/` and a line ending in `/}` can't be prose.
- **`{/name}` closes the innermost element open in its container** when the names match.
  Otherwise it stays text and is reported (`element-close`), and nothing is closed. After a
  `{#name}` line, the warning says to open the element with `{@name}`. A closing line is read at
  its element's own level, before the containers inside the element take their
  prefixes, so it ends a list or item it follows, as a closing code fence would.
- **A `/` just before the `}` is the leaf's,** never part of an id, class or value:
  `{@div #a/}` is a leaf with the id `a`.
- **An unclosed element runs to the end of its container or the document**, as an unclosed code
  fence does, and gets the warning `unclosed-element` at its opener. A leaf that lost its `/` is
  this case.
- **An element line straight after a table row, or after a paragraph in a blockquote or list
  item, is read as written, with the warning `element-lazy-line`.** A formatter reads that line as
  part of the paragraph or row above, and moves it in ([Canonical form](#canonical-form)). A
  blank line before it keeps it where it is. A line indented into the item is already inside it.

`html()` writes the name as the element, with the attributes as they are for any element. An
element has no label of its own: what HTML puts in a child element is written as one.

```md
{@details .proof}
[Show the proof]{@summary /}

Body **here**.
{/details}
```

```html
<details class="proof">
  <summary>Show the proof</summary>
  <p>Body <strong>here</strong>.</p>
</details>
```

Definition lists are elements too:

```md
{@dl}
[Term]{@dt /}
[Definition]{@dd /}
{/dl}
```

A consumer's own fold, such as visdown's Svelte codegen, maps names to components (`call-out` to
`CallOut`) and attributes to their props.

{#comment}

### Comments

`<!-- … -->` on lines of its own becomes a `comment` node, which `html()` never renders. It is
the only thing kept from HTML, for notes that stay in the source (`<!-- @note … -->`).

- It may span lines, and ends on the line with `-->`. Text after `-->` on that line is part of the
  comment and gets the warning `comment-trailing-text`. An unclosed comment runs to the end of
  its container, with the warning `unclosed-block`.
- A comment that shares its first line with other text is inline, where it is text.

## Inline

{#emphasis}

### Emphasis

The markers are `_emphasis_`, `**strong**` and `~~strikethrough~~`. Where a run may open or
close follows CommonMark's flanking rules, without the rest of its 17.

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
- **A `*` or `**` between two digits is text**, with no warning, so `2*3*4` and `2**10` stay
  arithmetic.

{#inline-code}

### Inline code

`` `code` ``, ` `` a ` b `` `: any number of backticks.

{#link}

### Links and images

Only the inline form exists.

| Construct | Syntax                                          | Notes                                                                  |
| --------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| Link      | `[text](url "title")`                           | Relative URLs go here: `[About](/about)`.                              |
| Image     | `![alt](url "title")`                           |                                                                        |
| Autolink  | `<https://…>`, `<mailto:…>`, `<me@example.com>` | An absolute URL with a scheme, or an email address, in angle brackets. |

A `{…}` directly after the `)` of a link or image, with no space, is its
[attributes](#attributes): `![hero](hero.png){.wide width=600}`.

{#span}

### Spans

`[text]{attrs}`, with no space between `]` and `{`. The text is inline Markdown, and its nodes are
the span's children. `html()` writes a `<span>` with the attributes, or, when they start with
`@name`, that element.

- The brackets balance, unless a `\` escapes one. A lone `[x]` is text, and a `[text]{…}` whose
  braces don't parse is text with the warning `attribute-syntax`.
- A span may start inside a word (`H[2]{@sub}O`), since the `]{` already makes it deliberate.
- The name is an inline element from the list below, or a custom element. Any other name, such as
  `[text]{@note}` or `[text]{@em}`, is reported (`element-name`), and the whole `[…]{…}` stays
  text, with nothing in it read as other syntax. `span` is not a name either, since
  `[text]{.x}` already writes one.
- A span never closes with `/`. `[x]{@kbd /}` in the middle of a line is text with the warning
  `attribute-syntax`, and on a line of its own it is a block [element](#element), where `kbd` is
  not a name.

| Source                    | HTML                                |
| ------------------------- | ----------------------------------- |
| `[hi]{.highlight}`        | `<span class="highlight">hi</span>` |
| `x[2]{@sup}`              | `x<sup>2</sup>`                     |
| `H[2]{@sub}O`             | `H<sub>2</sub>O`                    |
| `[new]{@ins}`             | `<ins>new</ins>`                    |
| `[text]{@mark}`           | `<mark>text</mark>`                 |
| `[Ctrl]{@kbd}`            | `<kbd>Ctrl</kbd>`                   |
| `[HTML]{@abbr title="…"}` | `<abbr title="…">HTML</abbr>`       |

The inline elements are those Markdown has no syntax for and that can't run code: `abbr`, `b`,
`i`, `u`, `s`, `small`, `cite`, `q`, `dfn`, `time`, `data`, `var`, `samp`, `kbd`, `mark`, `sub`,
`sup`, `ins`, `bdi`, `bdo`, `ruby`, `rt` and `rp`. There is no `@em`, `@strong`, `@code` or
`@del`, because `_x_`, `**x**`, `` `x` `` and `~~x~~` already write them: an edit is
`~~old~~ [new]{@ins}`.

{#inline-math}

### Inline math

`$…$`. The opening `$` is followed by a non-space character, and the closing `$` follows a
non-space character and isn't followed by a digit, so `costs $5 and $10` stays text. The TeX
holds no unescaped `$`. A run of two or more dollars never opens it, so `$$x$$` inside a line of
text and ``$`x`$`` stay text with a [`math-delimiter`](#not-supported) warning. Math is read
before emphasis and escapes, so `$a_1 * b_2$` needs no backticks. `${` always starts an
expression and never math. The node holds the raw TeX, and `html()` writes
`<code class="language-math math-inline">`.

{#expression}

### Expressions

`${…}` is a JavaScript template-literal interpolation, parsed as an `expression` node that holds
the code and its range. markz never evaluates it.

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
  expression early. Its code then leaves a `(` or `[` open, which gets the warning
  `expression-bracket`. Write the `}` as `\u007d`, or move the regex out of the document.
- The node's code is what is between the braces, its lines joined by line endings and each
  trimmed, as inline math keeps its TeX, so a container's prefix (`> `) never reaches it.
- `html()` writes `<code class="language-js expression">` holding the code, escaped, the way it
  writes math it doesn't typeset. The host evaluates expressions from the tree, never from the
  HTML. In a link destination or an attribute value, `${…}` stays part of that string.

{#line-break}

### Line breaks

`\` at the end of a line is the only hard break. It is visible and explicit. Any other line
ending inside a paragraph is a soft break. A poem ends each line with `\`, or a site styles it ([Usage](usage.md#keep-a-poems-line-breaks)).

Spaces or tabs after the `\` don't change that: `\ ` at the end of a line is a hard break, not a
[non-breaking space](#escape). The space can't be seen, and formatters strip it, which leaves the
same hard break.

{#escape}

### Escapes and references

There are no named character references, and `\ ` is a non-breaking space.

- A backslash before any ASCII punctuation character is that character: `\*`, `\_`, `\$`, `\{`, …
- Numeric references decode: `&#169;`, `&#x2014;`. They are the only character references.
- `&` is ordinary text. Write it as it is, and `html()` escapes it.
- `\` followed by a space is a non-breaking space (U+00A0), as in `10\ km` and `Dr.\ Smith`. In a
  heading id it counts as a space.

## Not supported

Each of these stays literal text and adds a warning over exactly its characters. The warning's
`code` is the table's first column, and its `instead` is the "Write instead" column. They are
cut on principle, not missing features, and the Why column says what each would cost. Two
look-alikes are ordinary prose, so
they stay text without a report: a lone `[x]` (a reference link's definition is reported instead)
and a bare `{…}`.

### Metadata forms

{.cuts}

| Code            | Syntax                | Write instead          | Why         |
| --------------- | --------------------- | ---------------------- | ----------- |
| `toml-metadata` | TOML metadata (`+++`) | a `---` metadata block | One format. |

### Block forms

{.cuts}

| Code                          | Syntax                                                                                       | Write instead                                                                                           | Why                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `raw-html`                    | Raw HTML blocks and inline tags                                                              | a ` ```=html ` raw block, or elements and attributes                                                    | Seven HTML-block kinds and a tag grammar. HTML stays possible, but only where it's marked.                                                |
| `setext-heading`              | Setext headings (`Title` over `===` or `---`)                                                | `# Title`                                                                                               | A paragraph would turn into a heading when the next line is read.                                                                         |
| `indented-code`               | Indented code blocks                                                                         | fenced code                                                                                             | Indentation meaning code is what makes list indentation hard. The indented line is paragraph text, and never a heading or list inside it. |
| `tilde-fence`                 | `~~~` fences                                                                                 | a longer backtick fence                                                                                 | One fence character.                                                                                                                      |
| `rule-marker`                 | `___`, `* * *` rules                                                                         | `---`                                                                                                   | One marker.                                                                                                                               |
| `trailing-heading-attributes` | Trailing heading attributes (`## Title {#id}`)                                               | `{#id}` on the line above                                                                               | Under djot's rule this `{…}` belongs to the word "Title".                                                                                 |
| `multiline-attributes`        | Multi-line attributes                                                                        | one line                                                                                                | Keeps the block pass free of lookahead.                                                                                                   |
| `directive`                   | Colon directives (`:::name` … `:::`, `::name[label]`, `:name[text]`)                         | `{@name}` … `{/name}`, `[label]{@name /}` or `[text]{@name}`                                            | One extension syntax. `{…}` already holds the attributes, and `@name` in it makes the element, so colons were a second way.               |
| `element-name`                | Element names that aren't elements (`{@chart /}`, `{@note}`, `[x]{@note}`)                   | a `div` or span with a class (`{@div .chart /}`, `[x]{.note}`), or a custom element (`{@chart-view /}`) | The name is the element it writes, so there is one way to add a class and a name can never be `script`.                                   |
| `lazy-line`                   | Lazy continuation lines (a quoted or listed paragraph continuing without `>` or indentation) | `>` on every line, or indent to the item's content column                                               | Lazy lines are the main reason CommonMark's block structure depends on context. Formatters already write them out in full.                |

### Inline forms

{.cuts}

| Code                | Syntax                                                                         | Write instead                                                     | Why                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference-link`    | Reference links: `[x][y]`, `[x][]`, `[y]: url`                                 | inline links                                                      | A link can't be resolved until the whole document is read, which breaks local parsing and streaming.                                                                        |
| `footnote`          | Footnotes (`[^label]`, `[^label]: text`)                                       | a span, such as `[text]{.note}`                                   | A reference can't be resolved until the whole document is read, as with reference links. Nothing we write uses them.                                                        |
| `bare-url`          | Bare URLs (`https://…`, `www.…`, `me@example.com`)                             | `<https://…>` or `[text](url)`                                    | GFM's largest construct, and the only one that has to look back at text already emitted: an email is known only at its `@`, and trailing punctuation is trimmed afterwards. |
| `relative-autolink` | Relative autolinks (`</docs/intro>`)                                           | `[About](/about)`                                                 | An autolink needs a scheme, and `</about>` is a closing HTML tag, reported as raw HTML. A link should have real text.                                                       |
| `named-reference`   | Named character references (`&copy;`, `&amp;`, `&nbsp;`)                       | the character itself (`©`, `&`), or `\ ` for a non-breaking space | Files are UTF-8, `html()` escapes `&` and `<` itself, and the table of 2,125 names is about 12 KB gzip.                                                                     |
| `trailing-spaces`   | Two trailing spaces as a line break                                            | `\` at end of line                                                | Invisible syntax.                                                                                                                                                           |
| `underscore-strong` | `__strong__`                                                                   | `**strong**`                                                      | One marker. oxfmt rewrites it.                                                                                                                                              |
| `star-emphasis`     | `*emphasis*`, except inside `_…_` or touching a letter ([Emphasis](#emphasis)) | `_emphasis_`                                                      | One marker, and the source of most emphasis edge cases. oxfmt rewrites it.                                                                                                  |
| `single-tilde`      | `~single~` strikethrough                                                       | `~~text~~`                                                        | One marker. oxfmt rewrites it.                                                                                                                                              |
| `math-delimiter`    | Other math delimiters: `$$x$$` inside a line of text, ``$`x`$``                | `$x$`, or a `$$` block                                            | One way each: `$x$` in a line, and `$$` for a block, fenced or alone on its line. Read by the `$x$` rule, `$$x$$` would lose a dollar at each end with no report.           |
| `inline-attributes` | Attributes after words, inline code or emphasis (`word{.x}`, `_x_{.x}`)        | `[text]{.x}`                                                      | The brackets mark where a span starts, so one way. Keeping `{` special only after a `)` or `]` means braces in prose are plain text.                                        |
| `jsx`               | MDX: JSX (a capitalised tag, `<Chart />`) and bare `{…}` expressions           | `{@name}` elements, `${…}`                                        | A `{` is only attributes where the rules above say so. Any other brace is prose, so a bare `{…}` stays text without a report.                                               |

## Canonical form

markz's "one way" is what oxfmt writes. oxfmt matches Prettier's Markdown output, and this repo
formats with it. We checked by running `vp fmt` over every alternate form:

| oxfmt rewrites                     | to                                 |
| ---------------------------------- | ---------------------------------- |
| `*em*`, `__strong__`, `***both***` | `_em_`, `**strong**`, `_**both**_` |
| `~one~`                            | `~~one~~`                          |
| `* item` (for a first list)        | `- item`                           |
| `1)` in a first list               | `1.`                               |
| `***` after the first line, `___`  | `---`                              |
| `~~~` fences                       | ` ``` ` fences                     |
| `## Title ##`                      | `## Title`                         |

oxfmt leaves these alone: setext headings, indented code, two-space breaks, named entities,
bare URLs, reference links and raw HTML. For those, markz's warning is the only signal.

oxfmt keeps the attribute syntax, with two quirks the rules above absorb:

- It inserts a blank line between a block-attribute line and a heading that follows it.
- It keeps `{.x}` directly after an image or link.

It knows nothing of elements, so it reads a `{/name}` or leaf line as paragraph text. Straight
after a list, a blockquote or a table, that text is a lazy continuation line to oxfmt, which
indents it into the item, prefixes it with `>` or makes it a table row. So write a blank line
before an element line that follows one of those, and markz warns (`element-lazy-line`) when it
is missing. An indented closing line still closes its
element, since markz reads it at the element's own level, but a leaf moves into the item, and a
closer behind `>` or in a row closes nothing and is reported (`element-close`). oxfmt did the
same to `:::` fences.

One case needs care. For two adjacent lists, oxfmt keeps them apart by switching the marker
(`-` then `*`, `1.` then `1)`). That is why markz accepts all of GFM's list markers. Rejecting
`*` or `)` would reject oxfmt's own output.

## Grammar

[`grammar.md`](grammar.md) states the dialect this page explains. Each construct there has the
same id, under the same part, with its productions in EBNF and the side rules EBNF can't state.
A form cut above has no production. The tests hold the two pages to each other.
