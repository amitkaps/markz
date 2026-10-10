# Syntax

The markz language. It is the Markdown people already write, plus `{…}` for attributes and
elements, a metadata block, math and `${…}` expressions. There is one way to write each thing.
Anything markz doesn't read stays literal text, with a warning that says what to write instead.

This page starts with the whole language at a glance, then explains each construct. The exact
rules, with every edge case, are in the [grammar](grammar.md).

## At a glance

| To write                 | Write                                                                   |
| ------------------------ | ----------------------------------------------------------------------- |
| Metadata                 | `key: value` lines between `---` lines, at the very top                 |
| A heading                | `#` to `######` and a space: `## Title`                                 |
| A heading's id           | `{#id}` on the line above the heading                                   |
| A paragraph              | lines of text, with a blank line between paragraphs                     |
| Emphasis, strong, struck | `_emphasis_`, `**strong**`, `~~struck~~`                                |
| Inline code              | `` `code` ``                                                            |
| A link                   | `[text](url "title")`                                                   |
| A link to a URL or email | `<https://example.com>`, `<me@example.com>`                             |
| An image                 | `![alt](image.png "title")`                                             |
| A list                   | `- item`, or `1. item` for a numbered one                               |
| A task                   | `- [ ] to do`, `- [x] done`                                             |
| A quote                  | `>` at the start of every line                                          |
| A code block             | a ` ``` ` fence, with the language after it                             |
| A table                  | pipes, with a `---` row under the header, and `:---:` to align          |
| A rule                   | `---`                                                                   |
| A line break             | `\` at the end of the line                                              |
| Math                     | `$x$` in a line, and `$$` fences or `$$x$$` alone on a line for a block |
| A value from code        | `${name}`                                                               |
| A class, id or attribute | `{.class #id key=value open}` above a block, or after a link or image   |
| A styled word            | `[text]{.class}`                                                        |
| An inline element        | `[Ctrl]{@kbd}`                                                          |
| A block element          | `{@call-out}` … `{/call-out}`, or `[label]{@name /}` on one line        |
| HTML                     | a ` ```=html ` fence                                                    |
| A comment                | `<!-- … -->` on lines of its own                                        |
| A symbol as itself       | `\` before it (`\*`, `\$`), or a number (`&#169;`)                      |
| A non-breaking space     | `\ `, a backslash and a space                                           |

## Writing safely

Three rules keep a document safe. markz warns when one is broken, so none needs remembering.

- **Leave a blank line between a list, quote or table and an element line after it.** A formatter
  would otherwise move the line into the list, quote or table (`element-lazy-line`).
- **Quote a metadata value that YAML would read another way.** That is a value holding `: ` or
  ` #`, one starting with a symbol, a yes or no word, or a number YAML would read differently
  (`metadata-value`).
- **Give a custom element a hyphen in its name,** as `call-out`, not `callout` (`element-name`).

## What markz doesn't read

Some Markdown forms aren't part of the language. Each stays literal text, with a warning that
names the form to write. The common ones are setext headings, indented code, reference links,
footnotes, raw HTML, bare URLs, two trailing spaces as a line break, `*emphasis*`, `__strong__`,
`~~~` fences and `___` rules. [Not supported](#not-supported) lists every cut form, with its
warning code. The other warnings are named with the rule they guard.

{#metadata}

## Metadata

A few `key: value` lines that GitHub, YAML and formatters all read without an error.

A document can open with a metadata block, between `---` lines, starting at the first character
(what other tools call frontmatter). When a closing `---` line follows, everything between is
metadata, and a line markz can't read is a warning. Without a closing line, the first `---` is a
rule, and a `key: value` line after it gets the warning `metadata-unclosed`. markz parses the
block into `doc.metadata`.

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

| Value              | Result                                                             |
| ------------------ | ------------------------------------------------------------------ |
| nothing, or `null` | `null`                                                             |
| `true`, `false`    | boolean                                                            |
| `42`, `-3`, `1.5`  | number                                                             |
| `"text"`           | string, with JSON's escapes                                        |
| `'text'`           | string, with `''` for a quote                                      |
| `[a, 2, "b, c"]`   | a list of values by these same rules                               |
| anything else      | string, as written: `Sales Report`, `2026-09-26`, `C# notes`, `v2` |

- **Keys** start with a letter or `_`, and hold letters, digits, `_`, `-` and `.`. A `.` is part
  of the key, as YAML reads it, so `deploy.name` is one key. A repeated key gets the warning
  `metadata-duplicate-key`, and the first one wins.
- **Comments** are lines that start with `#`.
- **Quote a value that YAML would read another way.** Otherwise the line gets the warning
  `metadata-value`. That is a value starting with a symbol such as `*`, `@` or `{`, a yes or no
  word in any case (`True`, `no`, `off`), or a number YAML would read differently (`01234`,
  `1.10`, `1e3`). Its key is skipped, since any guess could be wrong. In a list, also quote an
  item that holds `,`, `[` or `]`.
- **A value holding `: ` or ` #` is kept as written,** with the same warning. YAML would reject
  the first and cut the second short, so `title: Issue #42` would lose `#42` elsewhere.
- **A long list can wrap** onto indented lines after its key, as a formatter writes it, and
  may end with a comma.
- **The rest of YAML is out.** Other indented lines, `- item` lists and multi-line strings get
  the warning `metadata-line`, and the key they belong to is skipped.

## Block

{#paragraph}

### Paragraphs

Lines of text, with a blank line between paragraphs. Inside a quote or a list item, every line
carries its `>` or its indentation.

{#heading}

### Headings

`#` to `######`, a space, and one line of text. Closing `#`s (`## Title ##`) are dropped.

Every heading gets an id, so a link can point at it.

- **`{#id}` on the line above sets it.** The id then survives renaming the heading. If an
  earlier heading has the same id, both keep it, and the later one gets the warning
  `duplicate-id`.
- **Otherwise it is made from the text, as GitHub makes it.** Lowercase, punctuation removed, and
  each space a `-`: `## Café au lait` is `café-au-lait`. A repeat is numbered: `foo`, `foo-1`,
  `foo-2`. So a link to a heading works on GitHub and on the site. The exact steps are in the
  [grammar](grammar.md#heading).

{#blockquote}

### Blockquotes

`>` starts every line. A line without it ends the quote.

{#list}

### Lists

`- item` for bullets, `1. item` for numbers, and `- [ ] task` or `- [x] task` for tasks.

- The first number sets where a numbered list starts.
- A later line of an item is indented to where the item's text starts.
- A blank line between items makes the list loose, with each item a paragraph.
- `*` and `+` bullets and `1)` numbers are read too, since formatters write them. A different
  marker starts a new list.

{#code-block}

### Code blocks

A fence of three or more backticks, with the language after it. The first word after the fence
is the language, and the rest is metadata for the host. Use a longer fence to show a fence inside.
A fence with no closing line runs to the end of its container, with the warning `unclosed-block`.
So does a raw or math block.

{#raw-block}

### Raw blocks

A fence whose language is `=html` is raw output. `html()` writes what it holds as it is. It is
the only way to put HTML in a document, so HTML is always marked.

````md
```=html
<iframe src="https://w.soundcloud.com/player/?url=…" height="166"></iframe>
```
````

- It is for embeds, inline SVG, and the `<style>` or `<script>` a page needs.
- A raw block for another format (`=latex`) is kept in the tree, and `html()` skips it.
- A ` ```css ` or ` ```js ` fence is code to show, never to run.
- Raw blocks are trusted content. See [Security](design.md#security).
- GitHub shows a raw block as a code block.
- `=` names a format only in a fence. Inside `{…}` it has no meaning, so `{=html}` is text.

{#math-block}

### Math blocks

`$$` fences on lines of their own, or `$$E=mc^2$$` alone on a line. markz keeps the TeX and
doesn't typeset it. `html()` writes `<pre><code class="language-math math-display">`, and the
page adds KaTeX or Temml. A ` ```math ` fence is an ordinary code block.

{#table}

### Tables

Pipes between cells, and a row of `---` under the header. `:---`, `:---:` and `---:` align a
column left, centre or right. The outer pipes are optional.

{#thematic-break}

### Thematic breaks

`---` on a line of its own. `***` is a rule too, since formatters write it on a document's first
line, where `---` would open metadata.

{#attributes}

### Attributes

`{…}` is markz's one extension syntax. Attributes decorate what Markdown makes, and `@name` in
them makes an [element](#element) Markdown has no syntax for.

```md
{#pricing .center}

## Pricing

![hero](hero.png){.wide width=600} and the [docs](/docs){target=_blank}.

{.striped}

| Plan | Price |
| ---- | ----- |
```

| Where                                                            | Applies to         | For                                                |
| ---------------------------------------------------------------- | ------------------ | -------------------------------------------------- |
| A line holding only `{…}`                                        | the next block     | heading ids, and classes on tables, lists and code |
| Straight after a link or image, with no space                    | that link or image | `width`, `class`, `target`, `rel`                  |
| Straight after `[text]`, with no space                           | a span of the text | classes on words, and inline elements              |
| Lines holding `{@name …}` and `{/name}`, or `[label]{@name … /}` | an element         | wrappers and components                            |

- **Inside the braces:** `#id`, `.class` and `key=value`, with `key="a value"` for spaces. A
  bare `key` is an HTML attribute that is on or off, as `open`, `hidden` or `download`. Classes
  add up. For any other key, the later value wins. A value may hold `${…}`.
- **Bare keys alone count only on an element, a span, a link or an image:** `{@details open}`,
  `[x]{hidden}`, `[file](/a.pdf){download}`. On a line of its own, `{open}` stays text, since
  `{year}` there reads as a placeholder. Add a class or an id to use one above a block:
  `{.note open}`.
- **One line.** Attributes start and end on the same line.
- **A `{…}` line decorates the next block,** across blank lines, since formatters add one before
  a heading. With no block after it, it stays text with the warning `orphan-attributes`.
- **Anywhere else a `{` is text,** so `{a, b}` and `{"json": 1}` need no escaping. A `{…}` after a
  link or `[text]`, or on a line starting `{@` or `{/`, that doesn't parse gets the warning
  `attribute-syntax`.

{#element}

### Elements

An element is a `{…}` whose first item is `@name`, and the name is the element it writes. Elements
are how wrappers and components are written, since a document holds no HTML. Inline elements are
[spans](#span).

```md
{@chart-view data="sales" type="bar" /}

{@call-out type="warning"}
Markdown **inside**.
{/call-out}
```

- **A container** opens with `{@name attrs}` on a line of its own, and closes with `{/name}`. The
  lines between are Markdown.
- **A leaf** is `[label]{@name attrs /}` or `{@name attrs /}` on one line. The `/` makes it a
  block. Without it, `[label]{@name}` is a span inside a paragraph.
- **The name** is a block element from the list below, or a custom element: lowercase letters,
  digits and `-`, with a `-` in it (`call-out`). Any other name stays text, with the warning
  `element-name`. A class comes only from `.class`, so a note is `{@div .note}`.
- **Closing:** `{/name}` closes the innermost open element when the names match. Otherwise it
  stays text, with the warning `element-close`. An element never closed runs to the end of its
  container, with the warning `unclosed-element`.
- **After a list, quote or table,** leave a blank line before an element line. Without one, it
  gets the warning `element-lazy-line`, since a formatter would move it in.

The block elements are those Markdown has no syntax for and that can't run code: `div`,
`section`, `article`, `aside`, `header`, `footer`, `nav`, `main`, `address`, `hgroup`, `search`,
`details`, `summary`, `figure`, `figcaption`, `dl`, `dt` and `dd`.

`html()` writes the name as the element, with its attributes. What HTML puts in a child element is
written as one:

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

A framework can map names to its own components (`call-out` to `CallOut`) and attributes to
their props, in its own pass over the tree.

{#comment}

### Comments

`<!-- … -->` on lines of its own is a note that stays in the source. `html()` never writes it.
It may span lines, and ends on the line with `-->`. Text after `-->` on that line gets the
warning `comment-trailing-text`. A `<!--` after other text on its line is text, with the
warning `raw-html`.

## Inline

{#emphasis}

### Emphasis

`_emphasis_`, `**strong**` and `~~strikethrough~~`.

- `_` never works inside a word, so `snake_case_name` stays text. `**` may sit inside a word.
- `***`, `____` and `~~~` are text. Nest with two markers, as `_**both**_`.
- `*emphasis*` is read only where formatters write it: inside `_…_`, or touching a letter
  (`a*b*c`). Anywhere else it stays text, with a warning.
- `*` and `**` between two digits are text, so `2*3*4` and `2**10` stay arithmetic.

{#inline-code}

### Inline code

`` `code` ``. To show a backtick inside, use more backticks around it: ` `` a ` b `` `.

{#link}

### Links and images

`[text](url "title")` links, and `![alt](url "title")` shows an image. The title is optional,
and a relative URL works: `[About](/about)`.

`<https://example.com>` and `<me@example.com>` link the URL or email as its own text. An autolink
needs a scheme or an `@`.

A `{…}` straight after the `)` sets the link's or image's attributes:
`![hero](hero.png){.wide width=600}`.

{#span}

### Spans

`[text]{attrs}`, with no space between `]` and `{`. `html()` writes a `<span>` with the
attributes, or the element `@name` names.

| Source                    | HTML                                |
| ------------------------- | ----------------------------------- |
| `[hi]{.highlight}`        | `<span class="highlight">hi</span>` |
| `x[2]{@sup}`              | `x<sup>2</sup>`                     |
| `H[2]{@sub}O`             | `H<sub>2</sub>O`                    |
| `[new]{@ins}`             | `<ins>new</ins>`                    |
| `[text]{@mark}`           | `<mark>text</mark>`                 |
| `[Ctrl]{@kbd}`            | `<kbd>Ctrl</kbd>`                   |
| `[HTML]{@abbr title="…"}` | `<abbr title="…">HTML</abbr>`       |

- A span may start inside a word, as `H[2]{@sub}O`.
- The name is an inline element from the list below, or a custom element. Any other name, `span`
  included, leaves the whole `[…]{…}` as text, with the warning `element-name`.

The inline elements are those Markdown has no syntax for and that can't run code: `abbr`, `b`,
`i`, `u`, `s`, `small`, `cite`, `q`, `dfn`, `time`, `data`, `var`, `samp`, `kbd`, `mark`, `sub`,
`sup`, `ins`, `bdi`, `bdo`, `ruby`, `rt` and `rp`. There is no `@em`, `@strong`, `@code` or
`@del`, since `_x_`, `**x**`, `` `x` `` and `~~x~~` write them: an edit is `~~old~~ [new]{@ins}`.

{#inline-math}

### Inline math

`$x^2$`. The TeX starts and ends with a character other than a space, and a `$` followed by a
digit doesn't close it, so `costs $5 and $10` stays text. Math is read before emphasis, so
`$a_1 * b_2$` needs no escaping. `$$x$$` inside a line of text stays text, with the warning
`math-delimiter`. `html()` writes `<code class="language-math math-inline">`.

{#expression}

### Expressions

`${…}` holds a JavaScript expression for the page to evaluate, as in a template literal. markz
keeps the code and never runs it.

- It works in text, in link URLs and in attribute values. Inside code and math it is text.
- It binds tighter than emphasis, so `${a * b * c}` is one expression.
- Braces, strings and comments inside it are skipped, so `${f({a: 1})}` is whole.
- A regex isn't recognised. A `}` inside one ends the expression early, with the warning
  `expression-bracket`. Write it as `}`, or move the regex out of the document.
- `\${` is a literal `${`, and an unclosed `${` is text.
- `html()` writes `<code class="language-js expression">` holding the code. A page evaluates
  expressions from the tree, never from the HTML.

{#line-break}

### Line breaks

`\` at the end of a line is a hard break. Any other line ending in a paragraph is a soft break,
which the browser shows as a space. A poem ends each line with `\`, or a site styles it
([Usage](usage.md#keep-a-poems-line-breaks)).

{#escape}

### Escapes and references

- A `\` before any ASCII punctuation is that character: `\*`, `\_`, `\$`, `\{`.
- `\` and a space is a non-breaking space, as in `10\ km`. At the end of a line it is a hard
  break, since formatters strip trailing spaces.
- A number in `&#…;` is that character: `&#169;`, `&#x2014;`. Named ones such as `&copy;` aren't
  read. Write the character itself.
- `&` is ordinary text, and `html()` escapes it.

## Not supported

Each of these stays literal text and adds a warning over exactly its characters. The warning's
`code` is the table's first column, and its `instead` is the "Write instead" column. The Why
column says what each would cost. Two look-alikes are ordinary prose, so they stay text with no
warning: a lone `[x]` and a bare `{…}`.

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
| `setext-heading`              | Setext headings (`Title` over `===` or `---`)                                                | `# Title`                                                                                               | A second heading form.                                                                                                                    |
| `indented-code`               | Indented code blocks                                                                         | fenced code                                                                                             | Indentation meaning code is what makes list indentation hard. The indented line is paragraph text, and never a heading or list inside it. |
| `tilde-fence`                 | `~~~` fences                                                                                 | a longer backtick fence                                                                                 | One fence character.                                                                                                                      |
| `rule-marker`                 | `___`, `* * *` rules                                                                         | `---`                                                                                                   | One marker.                                                                                                                               |
| `trailing-heading-attributes` | Trailing heading attributes (`## Title {#id}`)                                               | `{#id}` on the line above                                                                               | A `{` after a word is text, so this `{…}` would belong to the word "Title".                                                               |
| `multiline-attributes`        | Multi-line attributes                                                                        | one line                                                                                                | One line keeps a `{…}` plain to see.                                                                                                      |
| `directive`                   | Colon directives (`:::name` … `:::`, `::name[label]`, `:name[text]`)                         | `{@name}` … `{/name}`, `[label]{@name /}` or `[text]{@name}`                                            | One extension syntax. `{…}` already holds the attributes, and `@name` in it makes the element, so colons were a second way.               |
| `element-name`                | Element names that aren't elements (`{@chart /}`, `{@note}`, `[x]{@note}`)                   | a `div` or span with a class (`{@div .chart /}`, `[x]{.note}`), or a custom element (`{@chart-view /}`) | The name is the element it writes, so there is one way to add a class and a name can never be `script`.                                   |
| `lazy-line`                   | Lazy continuation lines (a quoted or listed paragraph continuing without `>` or indentation) | `>` on every line, or indent to the item's content column                                               | Lazy lines are the main reason CommonMark's block structure depends on context. Formatters already write them out in full.                |

### Inline forms

{.cuts}

| Code                | Syntax                                                                         | Write instead                                                     | Why                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reference-link`    | Reference links: `[x][y]`, `[x][]`, `[y]: url`                                 | inline links                                                      | A link can't be resolved until the whole document is read, which breaks local parsing and streaming.                                                                        |
| `footnote`          | Footnotes (`[^label]`, `[^label]: text`)                                       | a span, such as `[text]{.note}`                                   | A reference can't be resolved until the whole document is read, as with reference links.                                                                                    |
| `bare-url`          | Bare URLs (`https://…`, `www.…`, `me@example.com`)                             | `<https://…>` or `[text](url)`                                    | GFM's largest construct, and the only one that has to look back at text already emitted: an email is known only at its `@`, and trailing punctuation is trimmed afterwards. |
| `relative-autolink` | Relative autolinks (`</docs/intro>`)                                           | `[About](/about)`                                                 | An autolink needs a scheme, and `</about>` is a closing HTML tag, reported as raw HTML. A link should have real text.                                                       |
| `named-reference`   | Named character references (`&copy;`, `&amp;`, `&nbsp;`)                       | the character itself (`©`, `&`), or `\ ` for a non-breaking space | Files are UTF-8, `html()` escapes `&` and `<` itself, and the table of 2,125 names is about 12 KB gzip.                                                                     |
| `trailing-spaces`   | Two trailing spaces as a line break                                            | `\` at end of line                                                | Invisible syntax.                                                                                                                                                           |
| `underscore-strong` | `__strong__`                                                                   | `**strong**`                                                      | One marker. Formatters rewrite it.                                                                                                                                          |
| `star-emphasis`     | `*emphasis*`, except inside `_…_` or touching a letter ([Emphasis](#emphasis)) | `_emphasis_`                                                      | One marker, and the source of most emphasis edge cases. Formatters rewrite it.                                                                                              |
| `single-tilde`      | `~single~` strikethrough                                                       | `~~text~~`                                                        | One marker. Formatters rewrite it.                                                                                                                                          |
| `math-delimiter`    | Other math delimiters: `$$x$$` inside a line of text, ``$`x`$``                | `$x$`, or a `$$` block                                            | One way each: `$x$` in a line, and `$$` for a block, fenced or alone on its line. Read by the `$x$` rule, `$$x$$` would lose a dollar at each end with no report.           |
| `inline-attributes` | Attributes after words, inline code or emphasis (`word{.x}`, `_x_{.x}`)        | `[text]{.x}`                                                      | The brackets mark where a span starts, so one way. Keeping `{` special only after a `)` or `]` means braces in prose are plain text.                                        |
| `jsx`               | MDX: JSX (a capitalised tag, `<Chart />`) and bare `{…}` expressions           | `{@name}` elements, `${…}`                                        | A `{` is only attributes where the rules above say so. Any other brace is prose, so a bare `{…}` stays text without a report.                                               |

## Formatters

markz reads what Markdown formatters write, so formatting a document never changes what it means.
A formatter rewrites several forms into one, and markz reads both sides.

| A formatter rewrites               | to                                 |
| ---------------------------------- | ---------------------------------- |
| `*em*`, `__strong__`, `***both***` | `_em_`, `**strong**`, `_**both**_` |
| `~one~`                            | `~~one~~`                          |
| `~~~` fences                       | ` ``` ` fences                     |
| `## Title ##`                      | `## Title`                         |
| `___`, and `***` after line one    | `---`                              |

Some of what formatters write is read on purpose:

- **List markers.** Two lists in a row are kept apart by switching the marker, `-` then `*`, or
  `1.` then `1)`. So markz reads every bullet and number marker.
- **`*` emphasis** inside `_…_` or touching a letter, where `_` can't work.
- **`***` on a document's first line,** where `---` would open metadata.
- **A blank line** between a `{…}` line and the heading after it.
- **Either quote style** in metadata, whichever the formatter is set to.

Formatters leave the cut forms alone (setext headings, indented code, two-space breaks, named
references, bare URLs, reference links and raw HTML). For those, markz's warning is the only
signal.

A formatter doesn't know elements, so it reads an element line as paragraph text. Straight after
a list, a quote or a table, that text continues the list item, the quote or the table to the
formatter, which moves it in. That is why markz warns (`element-lazy-line`) when the blank line
before it is missing.

## Grammar

[`grammar.md`](grammar.md) states the language this page explains. Each construct there has the
same id, under the same part, with its exact rules. A form cut above has no rule there. The tests
hold the two pages to each other.
