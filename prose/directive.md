# Directive names

A parked question: should a directive's name be the element `html()` writes, so that directives
are how Web Components are written? Nothing here is decided or built. Today a directive writes a
`<div>` or `<span>` with its name as the first class ([`syntax.md`](syntax.md#directive)), and that
stays until this is settled.

## The proposal

> **Directive names are element names.** A name is either a valid markz custom-element name or
> one of a few permitted HTML element names. Attributes stay structured in the AST and `html()`
> writes them safely. Labels and children stay AST data, so a framework's fold reads them its own
> way. ` ```=html ` stays the escape hatch for arbitrary literal HTML.

The three forms don't change: text `:name[label]{attrs}`, leaf `::name[label]{attrs}` and
container `:::name[label]{attrs}` … `:::`. Only what the name means does:

- `:call-out[Warning]` → `<call-out>Warning</call-out>`
- `::chart-widget{type=bar}` → `<chart-widget type="bar"></chart-widget>`
- `:::warning-box{type=error}` … `:::` → `<warning-box type="error">…</warning-box>`

A custom-element name is lowercase ASCII letters, digits and `-`, starts with a letter and has at
least one `-`, less the names HTML reserves (`font-face`, `annotation-xml` and the rest). Any
other name is text with a warning, as for any unsupported syntax.

## Parser and renderer

The two decide different things.

- **The parser** decides whether a name is a directive name. A name that fails is text with a
  warning, and only the parser can warn, so the grammar is where `:script` is stopped: it is
  neither a custom-element name nor a permitted one.
- **`html()`** decides whether a name may become an element. It keeps its own refusal of
  `script`, `iframe`, `style` and the like as a second line, because a document can be built
  without the parser.

## Attributes

The AST keeps every attribute the author wrote, `onclick` included, so a Svelte or Web Component
fold has all of them to decide on. `html()` alone drops `on*` keys and unsafe values, as it does
today.

A boolean attribute is written as the bare key: `{dismissible}` becomes `dismissible`, not
`dismissible=""`. In HTML a boolean attribute is on whenever it is present, so
`dismissible="false"` is on, and the docs should show the bare key.

## Container labels

The label stays AST data, separate from the children. `html()` keeps writing it as it does today,
`<div class="directive-label">`, and invents no slot, since slots are one Web Component
implementation detail. A framework's fold maps the label to whatever its component takes.

## The HTML names

Two directions, and the choice between them is the open part of this note.

**A. A short list, from the corpus.** The amitkaps.github.io Markdown uses `sup`, `sub`, `ins` and
`abbr` as prose elements, and `span` and `div` are the plain wrappers. So six names, and more
only on evidence. `mark` and `kbd`, which the dialect writes as elements today, are unused there.

**B. Semantic text gets syntax; directives carry no semantics.** Words that mean something get
djot-style marks, and directives become only the escape hatch for non-semantic markup: `div`,
`span`, a custom element or a framework component. Then the HTML list is just `div` and `span`,
and the "name is the element" rule has almost nothing to special-case. djot's marks:

| Element  | djot       | In markz today                                                                         |
| -------- | ---------- | -------------------------------------------------------------------------------------- |
| `<sup>`  | `^text^`   | `^` is plain text, so it's free                                                        |
| `<sub>`  | `~text~`   | `~text~` is the `single-tilde` warning, because GFM reads it as strikethrough          |
| `<ins>`  | `{+text+}` | a `{` is only special after a `)`, so this adds a brace rule                           |
| `<mark>` | `{=text=}` | as `{+…+}`                                                                             |
| `<abbr>` | none       | djot writes `[HTML]{title="…"}`, a span with attributes, which markz reads as `:span…` |

B costs:

- **`~text~`** would mean something on GitHub (strikethrough) and something else in markz
  (subscript). That's the kind of silent reinterpretation the dialect forbids, so subscript needs
  another mark or stays a directive.
- **`abbr`** has no mark in djot, so either it stays a directive under a name or it becomes an
  attribute on a span.
- **More inline syntax** means more parser and more bytes, where A is a list lookup.

## Notes for `html()` and the site

A custom element is inline until CSS says `display: block`, so leaf and container elements need
that in the site's styles. That's styling, not dialect.

## Open problems

- **A or B**, above.
- **Names without a hyphen.** Under the rule `:::callout` and `::chart` become text with a warning
  ("write `:::call-out`, or `:::div{.callout}`"). The lenient alternative, falling back to
  `<div class="callout">`, is two mappings for one construct. Strict fits the dialect, and lenient
  keeps the names other directive dialects use.
- **Frameworks don't agree on names.** Custom elements must be kebab-case with a hyphen. Svelte
  and React components are PascalCase, and a lowercase tag is an HTML element to both. Vue
  accepts either. MDX uses JSX's PascalCase, and micromark-extension-directive and djot put no
  rule on names. A Svelte fold maps `call-out` to `CallOut` mechanically, but a single-word
  component such as `Chart.svelte` has no valid name: it needs a hyphenated one (`chart-view`) or
  a class on a `div`. There is no one spec here yet.
