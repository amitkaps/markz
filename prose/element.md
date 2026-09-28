# Elements

markz has one extension syntax, `{…}`. Attributes decorate an element Markdown already makes, and
`@name` in them makes an element Markdown has no syntax for: a plain wrapper, an HTML element or a
custom element, with Markdown parsed inside. Elements carry no meaning of their own.
[`syntax.md`](syntax.md#element) states the rule; this note keeps the reasoning.

## The rule

> **`{…}` is the extension syntax, and `@name` is an element name.** A name is an HTML element on
> the allowlist for its kind, or a valid custom-element name. Classes come only from `.class`. Any
> other name is text with a warning. Attributes stay structured in the AST and `html()` writes them
> safely. Children stay AST data, so a framework's fold reads them its own way. ` ```=html ` stays
> the escape hatch for arbitrary literal HTML.

Where the `{…}` stands decides what it makes:

| Source                                    | HTML                                            |
| ----------------------------------------- | ----------------------------------------------- |
| `[hello]{.highlight}`                     | `<span class="highlight">hello</span>`          |
| `[Ctrl]{@kbd}`                            | `<kbd>Ctrl</kbd>`                               |
| `[Sales]{@div .chart type=bar /}`         | `<div class="chart" type="bar">Sales</div>`     |
| `{@chart-view type=bar /}`                | `<chart-view type="bar"></chart-view>`          |
| `{@section .intro #start}` … `{/section}` | `<section class="intro" id="start">…</section>` |
| `{@chart type=bar /}`                     | `<p>{@chart type=bar /}</p>`, and a warning     |

## Why one syntax

markz used to have two: `{…}` attributes, and micromark-extension-directive's `:name`, `::name`
and `:::name`, which carried `{…}` attributes of their own. Once a directive's name was made the
element it writes, a directive was just an element name plus attributes plus content, and the
colons only said which of three kinds it was. `@name` inside the braces says the name, and where
the braces stand says the kind:

- `[text]{…}` is inline, as in djot.
- A line ending in `/}` is a block closed on that line.
- `{@name}` and `{/name}` lines open and close a block that holds Markdown.

So there is one recognition rule for `{`, and `{@` tells the parser at once that it has an
element. What went with the colons: fence-length counting for nesting, the outermost-open-fence
closing rule, the bare `:name` that swallows prose
([directive#33](https://github.com/micromark/micromark-extension-directive/issues/33)), and a
container label that was plain text in a place HTML has no room for. A closer that names what it
closes also makes a mismatch a warning instead of a silent wrong nesting.

What is lost is compatibility with remark-directive content, which markz reports (`directive`)
with the form to write instead.

## Names

A **custom-element name** is lowercase ASCII letters, digits and `-`, starts with a letter and has
at least one `-`, less the names HTML reserves (`font-face`, `annotation-xml` and the rest). It is
allowed inline and as a block. A framework's fold maps it to a component, as `chart-view` to
`ChartView` in Svelte, so a single-word component takes a hyphenated name in the Markdown.

The **HTML allowlists** are liberal, since a list is a lookup and few elements do harm. Three
filters make them:

- **Not an element Markdown already writes**: `em`, `strong`, `code`, `a`, `img`, `del`, `br`,
  `p`, headings, lists, `blockquote`, `pre`, `table`, `hr`. `[x]{@em}` warns and says `_x_`, so
  each element has one way in.
- **Not a second way**: `span`, since `[text]{.x}` already writes one.
- **Nothing active**: `script`, `style`, `iframe`, `object`, `embed`, `canvas`, `svg`, `math`,
  `template`, `slot`, form controls, `dialog`, `audio` and `video`. Media can join if the site
  needs it.

The kinds are separate, so a block element never lands inside a paragraph:

| Kind                          | Allowed names                                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline (spans)                | `abbr`, `b`, `i`, `u`, `s`, `small`, `cite`, `q`, `dfn`, `time`, `data`, `var`, `samp`, `kbd`, `mark`, `sub`, `sup`, `ins`, `bdi`, `bdo`, `ruby`, `rt`, `rp`           |
| Block (leaves and containers) | `div`, `section`, `article`, `aside`, `header`, `footer`, `nav`, `main`, `address`, `hgroup`, `search`, `details`, `summary`, `figure`, `figcaption`, `dl`, `dt`, `dd` |

Definition lists come free: `{@dl}` holding `[Term]{@dt /}` and `[Definition]{@dd /}` lines.

## Content, not labels

A leaf's `[label]` and a span's `[text]` are its content, parsed as inline Markdown. A container
has no label: its body is its content, and what HTML puts in a child element is written as one.
`details` takes a `[Show the proof]{@summary /}` line, and `figure` a `[…]{@figcaption /}` line.
So `html()` needs no rule for where a label goes, and a custom element's component reads its
children and attributes like any other.

## The `/`

The `/` means closed on this line, not empty, which is where it differs from HTML's `<br />`: a
leaf keeps its label as content. It is what makes `[label]{@name /}` a block; without it the line
is a span in a paragraph. With an allowlisted block name that is caught, because `dt` is not an
inline name. With a custom element it isn't: `<p><call-out>hello</call-out></p>` is valid output,
not a reinterpretation.

A `{@name …}` line that lost its `/` opens a container instead, and it runs to the end of its
container or the document. That is the risk every Markdown parser already has with an unclosed
code fence. markz reports it (`unclosed-element`) at the opener.

## Parser and renderer

- **The parser** decides whether a name is an element name, and warns when it isn't. The grammar
  is where `{@script}` stops, since it is on no list and has no `-`. There is no deny list beyond
  the reserved custom-element names.
- **`html()`** decides what it writes. It keeps refusing `script`, `iframe`, `style` and the like
  as a second line, because a document can be built without the parser.

## A bad name is text

When the name check fails, the whole `[…]{…}` or `{…}` is literal text, in the paragraph it would
be anyway, with a warning such as "`chart` isn't an element name; write `{@chart-view /}` or
`{@div .chart /}`". It is `<p>`, not `<pre>`: it is ordinary text, as every other unsupported
construct is, and nothing in it is read as other syntax. For a container, only the opener and
closer lines are text, and the body between them is still parsed as Markdown. The page stays
readable and the warning is the signal.

micromark-extension-directive, by contrast, writes nothing for a directive without a handler:
the directive, its label and its body vanish with no warning.

## Attributes

The AST keeps every attribute the author wrote, `onclick` included, so a Svelte or Web Component
fold has all of them to decide on. `html()` alone drops `on*` keys and unsafe values.

A boolean attribute is written as the bare key: `{@call-out dismissible}` has `dismissible`, not
`dismissible=""`. In HTML a boolean attribute is on whenever it is present, so
`dismissible="false"` is on, and the docs show the bare key.

## Notes for `html()` and the site

A custom element is inline until CSS says `display: block`, so block elements need that in the
site's styles. That's styling, not dialect.
