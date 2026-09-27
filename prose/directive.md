# Directive names

A parked question: should a directive's name be the element `html()` writes, so that directives
are how Web Components are written? Nothing here is decided or built. Today a directive writes a
`<div>` or `<span>` with its name as the first class ([`syntax.md`](syntax.md#directive)), and that
stays until this is settled.

## The proposal

Keep the three forms: text `:name[label]{attrs}`, leaf `::name[label]{attrs}` and container
`:::name[label]{attrs}` … `:::`. Change what the name means:

> A directive's name is the element it writes. It is a custom-element name (lowercase ASCII
> letters, digits and `-`, starting with a letter, with at least one `-`) or one of a short list of
> HTML elements. Any other name is text with a warning.

- `:call-out[Warning]` → `<call-out>Warning</call-out>`
- `::chart-widget{type=bar}` → `<chart-widget type="bar"></chart-widget>`
- `:::warning-box{type=error}` … `:::` → `<warning-box type="error">…</warning-box>`

Attributes are the element's attributes, as they already are: any key, with `on*` keys and unsafe
values dropped by `html()`. The AST already keeps the name, attributes, label and children apart
from any renderer, so a consumer's fold can still map a name to its own component.

Directives would be the structured way to write an element, with Markdown parsed inside, and
` ```=html ` stays the opaque escape hatch for literal HTML.

## Why the name rule matters

If the name is the tag, the name rule is the safety rule. It is what keeps `:script{…}`,
`::iframe{src=…}` and `:::style` from writing real elements. So the hyphen is not style. The names
HTML reserves (`font-face`, `annotation-xml` and the rest) would be excluded as well.

## The HTML names

The hyphen rule alone rejects the names the dialect already has (`:sup`, `:sub`, `:ins`, `:mark`,
`:kbd`, `:abbr`, `:span`), so it needs a list of HTML elements beside it. The test for a place on
the list is that the element does something a class can't: carries meaning for assistive
technology or search, or changes what the browser does. The author can always fall back to `div`
or `span` with a class. Left out: elements Markdown already writes (`em`, `a`, `del`, `pre`,
`table`, …), anything that runs code or embeds other documents (`script`, `style`, `iframe`,
`object`, `embed`, `template`, `svg`, form controls), and bidirectional or ruby text while markz is
Latin-first.

A candidate list, fifteen names:

| Kind   | Names                                                                               |
| ------ | ----------------------------------------------------------------------------------- |
| Inline | `span`, `sup`, `sub`, `ins`, `mark`, `kbd`, `abbr`; new: `q`, `cite`, `dfn`, `time` |
| Block  | `div`, `details`, `figure`, `aside`                                                 |

Maybe later: `small`, `section`, and `video` and `audio` if the site migration needs them.

## Open problems

- **Names without a hyphen.** Under a strict rule `:::callout` and `::chart` become text with a
  warning ("write `:::call-out`, or `:::div{.callout}`"). A lenient rule would fall back to
  `<div class="callout">`, which is two mappings for one construct. Strict fits the dialect;
  lenient keeps the directive names other dialects use.
- **Frameworks don't agree on names.** Custom elements must be kebab-case with a hyphen. Svelte
  and React components are PascalCase, and a lowercase tag is an HTML element to both. Vue
  accepts either. MDX uses JSX's PascalCase, and micromark-extension-directive and djot put no
  rule on names. So a Svelte fold would map `call-out` to `CallOut`, which is mechanical, but a
  single-word component such as `Chart.svelte` has no valid directive name: it would need a
  hyphenated name (`chart-view`) or a class on a `div`. There is no one spec here yet.
- **The container label.** Today it is `<div class="directive-label">`. A custom element would
  take it as a slot (`<span slot="label">Warning</span>`), which means nothing inside a plain
  HTML element. `details` and `figure` have a natural home for it, `<summary>` and
  `<figcaption>`, but `div` and `aside` have none. Either they keep `directive-label`, or only
  custom elements, `details` and `figure` accept a container label and the rest warn.
- **Boolean attributes.** An HTML boolean attribute is on whenever it is present, so
  `dismissible="false"` is on. The docs should show the bare key, `{dismissible}`, and `html()`
  should write it as `dismissible`, not `dismissible=""`.
- **Display.** A custom element is inline until CSS says `display: block`, so a leaf or container
  needs that in the site's styles, where a `div` doesn't.
