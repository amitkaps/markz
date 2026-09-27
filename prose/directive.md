# Directive names

A directive's name is the element it writes. Directives carry no meaning of their own: they are
markz's way to write a plain wrapper, an HTML element Markdown has no syntax for, or a custom
element, with Markdown parsed inside. This is decided and not yet built; [plan](plan.md) step 14
changes the parser, `html()` and the tests, and until then [`syntax.md`](syntax.md#directive)
describes what markz does today (a `<div>` or `<span>` with the name as its first class).

## The rule

> **Directive names are element names.** A name is an HTML element on the allowlist for its kind,
> or a valid custom-element name. Classes come only from `{…}`. Any other name is text with a
> warning. Attributes stay structured in the AST and `html()` writes them safely. Labels and
> children stay AST data, so a framework's fold reads them its own way. ` ```=html ` stays the
> escape hatch for arbitrary literal HTML.

The three forms don't change: text `:name[label]{attrs}`, leaf `::name[label]{attrs}` and
container `:::name[label]{attrs}` … `:::`. What the name means does:

| Source                          | HTML                                             |
| ------------------------------- | ------------------------------------------------ |
| `:span[hello]{.highlight}`      | `<span class="highlight">hello</span>`           |
| `:kbd[Ctrl]`                    | `<kbd>Ctrl</kbd>`                                |
| `::div[Sales]{.chart type=bar}` | `<div class="chart" type="bar">Sales</div>`      |
| `::chart-view[Sales]{type=bar}` | `<chart-view type="bar">Sales</chart-view>`      |
| `:::section{.intro #start}` …   | `<section class="intro" id="start">…`            |
| `:::details[Show the proof]` …  | `<details><summary>Show the proof</summary>…`    |
| `::chart[Sales]{type=bar}`      | `<p>::chart[Sales]{type=bar}</p>`, and a warning |

The name is never a class, so there is one way to add one. What is lost is the one-word name:
`:::note` and `::chart` become `:::div{.note}` or `:::note-box`, and `::div{.chart}` or
`::chart-view`.

## Names

A **custom-element name** is lowercase ASCII letters, digits and `-`, starts with a letter and has
at least one `-`, less the names HTML reserves (`font-face`, `annotation-xml` and the rest). It is
allowed in all three forms. A framework's fold maps it to a component, as `chart-view` to
`ChartView` in Svelte, so a single-word component takes a hyphenated name in the Markdown.

The **HTML allowlists** are liberal, since a list is a lookup and few elements do harm. Two filters
make them:

- **Not an element Markdown already writes**: `em`, `strong`, `code`, `a`, `img`, `del`, `br`,
  `p`, headings, lists, `blockquote`, `pre`, `table`, `hr`. `:em[x]` warns and says `_x_`, so each
  element has one way in.
- **Nothing active**: `script`, `style`, `iframe`, `object`, `embed`, `canvas`, `svg`, `math`,
  `template`, `slot`, form controls, `dialog`, `audio` and `video`. Media can join if the site
  needs it.

The kinds are separate, so a block element never lands inside a paragraph:

| Kind                                  | Allowed names                                                                                                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inline (text directives)              | `span`, `abbr`, `b`, `i`, `u`, `s`, `small`, `cite`, `q`, `dfn`, `time`, `data`, `var`, `samp`, `kbd`, `mark`, `sub`, `sup`, `ins`, `bdi`, `bdo`, `ruby`, `rt`, `rp` |
| Block (leaf and container directives) | `div`, `section`, `article`, `aside`, `header`, `footer`, `nav`, `main`, `address`, `hgroup`, `search`, `details`, `figure`, `figcaption`, `dl`, `dt`, `dd`          |

Definition lists come free: `:::dl` holding `::dt[Term]` and `::dd[Definition]`.

## Parser and renderer

- **The parser** decides whether a name is a directive name, and warns when it isn't. The grammar
  is where `:script` stops, since it is on no list and has no `-`. There is no deny list beyond
  the reserved custom-element names.
- **`html()`** decides what it writes. It keeps refusing `script`, `iframe`, `style` and the like
  as a second line, because a document can be built without the parser.

## A bad name is text

When the name check fails, the whole `::name[…]{…}` is literal text, in the paragraph it would
be anyway, with a warning such as "`chart` isn't an element name; write `::chart-view` or
`::div{.chart}`". It is `<p>`, not `<pre>`: it is ordinary text, as every other unsupported
construct is, and nothing in the span is read as other syntax (`[Sales]` is never a link). For a
container, only the two fence lines are text, and the body between them is still parsed as
Markdown. The page stays readable and the warning is the signal.

micromark-extension-directive, by contrast, writes nothing for a directive without a handler:
the directive, its label and its body vanish with no warning.

## Attributes

The AST keeps every attribute the author wrote, `onclick` included, so a Svelte or Web Component
fold has all of them to decide on. `html()` alone drops `on*` keys and unsafe values, as it does
today.

A boolean attribute is written as the bare key: `{dismissible}` becomes `dismissible`, not
`dismissible=""`. In HTML a boolean attribute is on whenever it is present, so
`dismissible="false"` is on, and the docs show the bare key.

## Labels

A leaf or text directive's label is its content, as today. A container's label is metadata, and
it goes where the element has a place for it:

- `details`: its `<summary>`.
- `figure`: its `<figcaption>`.
- A custom element: kept in the AST for the component, and written as today's
  `<div class="directive-label">`. `html()` invents no slot, since slots are one Web Component
  implementation detail.
- Any other block (`div`, `section`, `aside`, …): the parser warns ("`section` takes no label; put
  a heading inside"). The AST keeps the label for a fold, and `html()` doesn't write it.

## Notes for `html()` and the site

A custom element is inline until CSS says `display: block`, so leaf and container elements need
that in the site's styles. That's styling, not dialect.
