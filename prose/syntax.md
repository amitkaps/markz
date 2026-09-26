# Syntax

This is markz's dialect, one construct per row. It keeps GFM's everyday symbols, uses directives as its one extension syntax (with
`{…}` attributes in a few fixed places), and adds a metadata block, math and `${…}` expressions. It cuts
everything that makes Markdown need backtracking. There is one way to write each thing. The
rendered site is the primary target. A markz document stays readable on GitHub, but it doesn't
have to render identically there. Anything markz rejects stays literal text and adds an entry to
`doc.diagnostics` saying what to write instead. It is never silently reinterpreted.

The cuts and the attribute rules follow [djot](https://github.com/jgm/djot#rationale). The
reasons are in the [spec](spec.md#markdown-dialect).

## Fully supported

The same syntax and result as GFM.

`&` is ordinary text: write it literally, and `html()` escapes it. The only character references
are numeric ones.

| Construct         | Syntax                                          | Notes                                                                                                    |
| ----------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Paragraph         | text separated by a blank line                  |                                                                                                          |
| Heading           | `#` to `######`, then a space                   | Ids are generated, and `{#id}` overrides them ([Heading ids](#heading-ids)).                             |
| Strong            | `**text**`                                      |                                                                                                          |
| Emphasis          | `_text_`                                        |                                                                                                          |
| Strikethrough     | `~~text~~`                                      |                                                                                                          |
| Inline code       | `` `code` ``, ` `` a ` b `` `                   | Any number of backticks.                                                                                 |
| Fenced code       | ` ``` ` or longer, then an info string          | The first word is `lang` and the rest is `meta`. Nest by using a longer fence.                           |
| Link              | `[text](url "title")`                           | Relative URLs go here: `[About](/about)`.                                                                |
| Image             | `![alt](url "title")`                           |                                                                                                          |
| Autolink          | `<https://…>`, `<mailto:…>`, `<me@example.com>` | An absolute URL with a scheme, or an email address, in angle brackets.                                   |
| Blockquote        | `> ` on every line                              |                                                                                                          |
| Bullet list       | `- item`; `*` and `+` also accepted             | Changing the marker starts a new list, as in GFM. oxfmt writes `*` for the second of two adjacent lists. |
| Ordered list      | `1. item`; `1)` also accepted                   | The first number sets `start`. Changing the delimiter starts a new list, as with bullets.                |
| Task item         | `- [ ] todo`, `- [x] done`                      | `listItem.checked`                                                                                       |
| Table             | GFM pipe table with a `---` delimiter row       | `:---`, `:---:` and `---:` set alignment.                                                                |
| Horizontal rule   | `---`                                           |                                                                                                          |
| Hard line break   | `\` at end of line                              | A visible, explicit break. GitHub renders it too.                                                        |
| Backslash escape  | `\*`, `\_`, `\$`, `\{`, …                       | Any ASCII punctuation character.                                                                         |
| Numeric character | `&#169;`, `&#x2014;`                            |                                                                                                          |

## Supported, with limits

### Attributes

Directives are the universal extension syntax: components, wrappers around blocks, and inline
spans. `{…}` is their attribute part. It may also appear in two other places, where it decorates
an element Markdown itself made and a directive would have to wrap or reinvent that element:

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

- **Syntax:** `#id`, `.class` and `key=value`, with `key="a quoted value"` for spaces. Classes
  accumulate. For other keys, a later value wins. Values may contain `${…}`.
- **Block attributes:** blank lines may come between the `{…}` line and its block, because oxfmt
  inserts one before a heading.
- **One line only.** djot lets attributes span lines, and markz doesn't. That keeps the block pass
  free of lookahead.
- **Anywhere else a `{` is text.** Inline, only a `)` directly before it can make it attributes,
  so `{a, b}`, `{"json": 1}` and prose braces never need escaping. A `{…}` in one of the three
  places that doesn't parse as attributes is text too.
- **Words and phrases** use a text directive: `:span[word]{.highlight}`. There is no djot-style
  `word{.x}` or `[span]{.x}`.

### Heading ids

Every heading gets an id. An explicit `{#id}` wins. Otherwise the id is generated with GitHub's
algorithm ([spec](spec.md#heading-ids)).

- Generated ids skip every explicit id in the document, so a generated `pricing` can't take the
  name an explicit `{#pricing}` claimed. Generated duplicates get `-1`, `-2`, …
- Explicit duplicates aren't resolved, as in djot: the HTML keeps both, and the browser uses the
  first. Each duplicate adds a diagnostic.

### Emphasis rules

The markers are GFM's. The rules for where they may open and close are djot's, not CommonMark's
17:

- An opener can't be followed by whitespace, and a closer can't be preceded by whitespace.
- `_` never opens or closes inside a word, so `snake_case_name` stays text. `**` may appear inside
  a word.
- There is no rule of 3, and delimiter runs don't split.

On ordinary text this matches GFM. Where it disagrees, differential fuzzing against micromark
finds the case, and it is either fixed or listed here.

### Lists

- Content that continues a list item is indented to that item's content column. There are no
  lazy continuation lines.
- Tight and loose lists follow GFM: a blank line between items makes the list loose.

### Headings

The optional closing `#`s (`## Title ##`) are accepted and stripped, as GFM does. A heading is a
single line.

### Comments

`<!-- … -->` on lines of its own becomes a `comment` node, which `html()` never renders. It is the
only thing kept from HTML. prose's Markdown notes need it (`<!-- @note … -->`), and GitHub hides
comments too. A comment in the middle of a line is text.

### Metadata

A document can open with a metadata block: key/value pairs between `---` lines, starting at
offset 0 (what other tools call frontmatter). markz parses it into `doc.metadata`, a flat object,
and keeps the block's range.

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
  1.2. So a plain value YAML would read differently gets a diagnostic, not a silent string:
  `True`, `FALSE`, `~`, `Null`, `+1`, `.5`, `1e3`, `0x1F`, `.inf`. Write the canonical form or
  quote it.
- **Everything else in YAML is out:** indented lines (nested maps, `- item` lists, multi-line
  strings), `|` and `>`, `{a: b}`, anchors, aliases and tags. Each gets a diagnostic, and its key
  is skipped. Of two duplicate keys, the first wins and the second gets a diagnostic.

markz is not a YAML parser. The `yaml` package is its dev-only test oracle, as micromark is for
the Markdown: every accepted block must give the same object from both.

### Directives

The syntax is `micromark-extension-directive`'s, with one cut. The trailing `{…}` follows the
attribute syntax above:

- **text**: `:name[label]`, `:name{attrs}` or `:name[label]{attrs}`. A label or attributes is
  required, so `hello :world` and `10:30` stay plain text: a colon in prose is never special, and
  the parser knows it has a directive as soon as it reaches the `[` or `{`. A bare `:name` is not
  a construct in markz, so it gets no diagnostic.
- **leaf**: `::name[label]{attrs}`, on a line of its own. A bare `::name` is allowed, since the
  line can't be prose.
- **container**: `:::name[label]{attrs}` … `:::`

Directives are how components with data are written, since there is no HTML:

```md
::chart{data="sales" type="bar"}

:::callout{type="warning"}
Markdown **inside**, parsed and source-mapped.
:::
```

`html()` writes a `<div>` for container and leaf directives and a `<span>` for text directives.
`:span[text]{.x}` is the plain inline wrapper. The name becomes the first class, and the attributes
are written as they are for any element.

Six text-directive names are HTML's own inline elements, for text that needs its real tag rather
than a styled span. `html()` writes them as that element, with the attributes and no name class:

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

The label means different things by kind:

- **leaf and text:** the label is the content. It is parsed as inline Markdown, and its nodes are
  the directive's children.
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

### Math

- **inline**: `$…$`, by pandoc's rule. The opening `$` is followed by a non-space character, and
  the closing `$` follows a non-space character and isn't followed by a digit, so
  `costs $5 and $10` stays text. `${` always starts an expression and never math.
- **block**: `$$` fences on lines of their own.

The node holds the raw TeX, and markz doesn't typeset it. `html()` writes GitHub's shape
(`<code class="language-math math-inline">`), and the host adds KaTeX or Temml. A ` ```math `
fence stays an ordinary code block with `lang: "math"`, and its HTML is already the
`language-math` shape.

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
  expression early. Write it as `\u007d`, or move the regex out of the document.
- `html()` writes the literal source text, escaped.

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
  `=js`: in djot, `=format` names an output format (`=html`, `=latex`), not a language. CSS and
  JavaScript go inside `=html` as `<style>` and `<script>`.
- A raw block for any other format (`=latex`) is kept in the AST, and `html()` skips it.
- An ordinary ` ```css ` or ` ```js ` fence is code to show, never to run. What a consumer
  executes (visdown's `js` cells) is the consumer's own decision.
- Raw blocks are trusted content: see [the spec's security section](spec.md#security).
- On GitHub a raw block shows as a code block.

### Line breaks and verse

- **`\` at the end of a line** is a hard break. It is the only explicit break.
- **A poem or a quote with its own line breaks** gets `{.verse}` on the line above. `html()`
  writes it as a normal paragraph, `<p class="verse">`, and the paragraph's newlines are kept in
  the output. The site's CSS `.verse { white-space: pre-line }` shows them. The `\` on every
  line isn't needed.

```md
{.verse}
Moko kahan dhundhe re bande
Main to tere paas mein
```

### Non-breaking space

`\` followed by a space is a non-breaking space (U+00A0), as in djot: `10\ km`, `Dr.\ Smith`.
GFM keeps both characters as text. In a heading id it counts as a space.

### Smart punctuation

Built in, as in djot. It applies to text only, never to code, math, expressions, URLs or
attribute values.

| Source              | Text value                                                           |
| ------------------- | -------------------------------------------------------------------- |
| `"quoted"`          | `“quoted”`                                                           |
| `'quoted'`, `don't` | `‘quoted’`, `don’t`                                                  |
| `--`                | `–` (en dash)                                                        |
| `---`               | `—` (em dash). A line holding only `---` is still a horizontal rule. |
| `...`               | `…`                                                                  |

- Whether a quote opens or closes is decided by the character before it: start of text,
  whitespace, an opening bracket or a dash means it opens.
- `\"`, `\'`, `\-` and `\.` keep the straight character.
- The text node's `value` holds the typographic character, and its range still covers the
  source characters. `value` and `textContent()` are the rendered text: escapes and numeric
  references decoded, punctuation curled. What the author typed is always
  `source.slice(start, end)`, and a consumer that needs the source uses that.
- Heading ids are slugged from the typographic text. Quotes and dashes are punctuation, so they
  drop out.

## Not supported

Each of these stays literal text and adds a diagnostic suggesting the supported form.

| Syntax                                                                                       | Write instead                                                     | Why                                                                                                                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raw HTML blocks and inline tags                                                              | a ` ```=html ` raw block, or directives and attributes            | Seven HTML-block kinds and a tag grammar. HTML stays possible, but only where it's marked.                                                                                  |
| Setext headings (`Title` over `===` or `---`)                                                | `# Title`                                                         | A paragraph would turn into a heading when the next line is read.                                                                                                           |
| Indented code blocks                                                                         | fenced code                                                       | Indentation meaning code is what makes list indentation hard.                                                                                                               |
| `~~~` fences                                                                                 | a longer backtick fence                                           | One fence character.                                                                                                                                                        |
| Reference links: `[x][y]`, `[x][]`, `[x]`, `[y]: url`                                        | inline links                                                      | A link can't be resolved until the whole document is read, which breaks local parsing and streaming.                                                                        |
| Bare URLs (`https://…`, `www.…`, `me@example.com`)                                           | `<https://…>` or `[text](url)`                                    | GFM's largest construct, and the only one that has to look back at text already emitted: an email is known only at its `@`, and trailing punctuation is trimmed afterwards. |
| Relative autolinks (`</about>`)                                                              | `[About](/about)`                                                 | An autolink needs a scheme. `</about>` reads as a closing HTML tag, and a link should have real text.                                                                       |
| Named character references (`&copy;`, `&amp;`, `&nbsp;`)                                     | the character itself (`©`, `&`), or `\ ` for a non-breaking space | Files are UTF-8, `html()` escapes `&` and `<` itself, and the table of 2,125 names is about 12 KB gzip.                                                                     |
| Two trailing spaces as a line break                                                          | `\` at end of line, or `{.verse}` on a poem                       | Invisible syntax.                                                                                                                                                           |
| `__strong__`                                                                                 | `**strong**`                                                      | One marker. oxfmt rewrites it.                                                                                                                                              |
| `*emphasis*`                                                                                 | `_emphasis_`                                                      | One marker, and the source of most emphasis edge cases. oxfmt rewrites it.                                                                                                  |
| `***`, `___`, `* * *` rules                                                                  | `---`                                                             | One marker.                                                                                                                                                                 |
| `~single~` strikethrough                                                                     | `~~text~~`                                                        | One marker. oxfmt rewrites it.                                                                                                                                              |
| Trailing heading attributes (`## Title {#id}`)                                               | `{#id}` on the line above                                         | Under djot's rule this `{…}` belongs to the word "Title".                                                                                                                   |
| Multi-line attributes                                                                        | one line                                                          | Keeps the block pass free of lookahead.                                                                                                                                     |
| Attributes after words, inline code or emphasis (`word{.x}`), and djot spans (`[text]{.x}`)  | `:span[text]{.x}`                                                 | Directives already wrap inline text, so one way. Keeping `{` special only after a `)` means braces in prose are plain text.                                                 |
| MDX: JSX and bare `{…}` expressions                                                          | directives, `${…}`                                                | A `{` is only attributes where the rules above say so.                                                                                                                      |
| Footnotes (`[^label]`, `[^label]: text`)                                                     | a text directive, such as `:note[text]`                           | A reference can't be resolved until the whole document is read, as with reference links. Nothing we write uses them.                                                        |
| TOML metadata (`+++`)                                                                        | a `---` metadata block                                            | One format.                                                                                                                                                                 |
| Lazy continuation lines (a quoted or listed paragraph continuing without `>` or indentation) | `>` on every line, or indent to the item's content column         | Lazy lines are the main reason CommonMark's block structure depends on context. Formatters already write them out in full.                                                  |

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
bare URLs, reference links and raw HTML. For those, markz's diagnostic is the only signal.

oxfmt keeps the attribute syntax, with two quirks the rules above absorb:

- It inserts a blank line between a block-attribute line and a heading that follows it.
- It keeps `{.x}` directly after an image or link.

One case needs care. For two adjacent lists, oxfmt keeps them apart by switching the marker
(`-` then `*`, `1.` then `1)`). That is why markz accepts all of GFM's list markers. Rejecting
`*` or `)` would reject oxfmt's own output.

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
