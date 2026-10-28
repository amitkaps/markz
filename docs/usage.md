# Usage

Install markz, render a document, find out what it rejected, and use what it knows about the document. Each section is a short recipe, and every function it uses is in [Reference](reference.md). The language itself is in [Syntax](syntax.md).

## Install

```sh
pnpm add @amitkaps/markz
```

markz has no dependencies and runs the same in Node, Workers and the browser.

## In the browser

A page with no build step imports markz from a CDN, pinned to a version:

```html
<script type="module">
  import { html } from "https://cdn.jsdelivr.net/npm/@amitkaps/markz@0.9/+esm";

  document.querySelector("main").innerHTML = html(markdown);
</script>
```

jsDelivr's `/+esm` serves the module minified. The file in the package is readable and not minified, since a bundler minifies it for its own app.

## Render

```ts
import { html } from "@amitkaps/markz";

const page = html(markdown);
```

The result is a string of HTML with nothing in it that can run script, unless the document has a ` ```=html ` block, which is written as it is.

## Check a document

markz reads its own language, not every Markdown. What it doesn't read stays literal text and is reported, with the form to write instead:

```ts
import { parse, position } from "@amitkaps/markz";

const doc = parse(markdown);
const at = position(markdown);
for (const w of doc.warnings) {
  const { line, column } = at(w.start);
  console.log(`${line}:${column + 1} ${w.message}; write ${w.instead}`);
}
```

An empty `doc.warnings` means the document is plain markz. A document pasted from elsewhere is converted by fixing what this lists.

## Read the metadata

```ts
const doc = parse(markdown);
doc.metadata?.title; // the `title: …` line, or undefined
doc.metadata?.["deploy.name"]; // a `.` is part of the key, as YAML reads it
```

## Build a table of contents

`headings` gives each heading's depth, label and id, and the `id` is the one `html()` writes, so a link to it lands on the heading:

```ts
import { headings, parse } from "@amitkaps/markz";

const contents = headings(parse(markdown))
  .filter((h) => h.depth <= 3)
  .map((h) => `${"  ".repeat(h.depth - 1)}- [${h.label}](#${h.id})`)
  .join("\n");
```

markz doesn't put a contents list in `html()`. How deep to go, and whether to nest, number or style it, is yours to decide.

## Check links within a page

`ids` gives every id `html()` writes, on headings and on anything with a `{#id}`, so a link to `#id` can be checked before the page is built:

```ts
import { ids, parse, walk } from "@amitkaps/markz";

const doc = parse(markdown);
const targets = new Set(ids(doc).map((i) => i.id));
walk(doc, {
  enter(node) {
    if (doc.type(node) !== "link") return;
    const { destination } = doc.data(node, "link");
    if (destination.startsWith("#") && !targets.has(destination.slice(1))) {
      console.warn(`no #${destination.slice(1)} on this page`);
    }
  },
});
```

## Keep a poem's line breaks

End each line of a poem or a quote with `\`, the language's only hard break. `html()` writes a `<br />` there, which shows wherever the HTML goes:

```md
Moko kahan dhundhe re bande\
Main to tere paas mein
```

The `\` is also what keeps the lines apart in the source. A formatter set to `proseWrap: "never"` joins a paragraph's lines into one, and `"always"` rewraps them, but neither moves a line past a hard break.

A class with `white-space: pre-line` shows a paragraph's own newlines without the `\`, but only where that CSS applies and only while nothing reflows the source. In a feed, an email or a preview, or after a formatter has joined the lines, the poem runs together. `html()` never adds a class for styling, so the `\` is the form that holds.

## On the command line

The package has a `markz` command, which runs in Node. Each command is stated once, here, with how it's run and what it does, and `markz help` prints them from the version installed:

- [`markz check <files>`]{#check}: prints every warning in the files, one line each, and fails on any.
- [`markz html [file]`]{#html}: writes a document's HTML, with its warnings on stderr.
- [`markz rules [id]`]{#rules}: prints the rules, or one rule or code by its id.
- [`markz help [command]`]{#help}: lists the commands, or prints what one does.

```sh
pnpm markz check docs/*.md      # every warning, one line each, and fails on any
pnpm markz html README.md       # the HTML, with warnings on stderr
pnpm markz rules                # the rules below, as raw text
pnpm markz rules star-emphasis  # one code, with the rule it serves
pnpm markz help                 # the commands above
```

`check` prints a line for each warning, in the form every tool built on markz uses:

```text
markz: warning: docs/a.md:3:6: star-emphasis: `*emphasis*`; write `_emphasis_`
```

The level is `error` when the tool can't do its job, such as a file it can't read, and it always fails. It's `warning` when a rule is broken, which fails `check`, while `html` prints it and carries on. It's `note` when nothing is broken, and that never fails. Every markz code is a warning. `html` reads stdin when it's given no file, and writes a fragment, with no `<html>` around it.

## For agents

An agent that writes Markdown for a project that uses markz writes markz, and checks it. `markz rules` prints the rules below, from the version installed, so have the project's `AGENTS.md` or `CLAUDE.md` say to run it before writing Markdown, and `markz check` after:

```markdown
- Write Markdown in markz's dialect. Run `pnpm markz rules` before writing it, and `pnpm markz check <files>` after, and fix every warning.
```

Each rule is a list item that opens with its id, under a heading for its group. Each code in [Not supported](syntax.md#not-supported) and in the constructs is linked from the one rule it serves. So `markz rules` prints each rule with the codes that check it, and a test holds the two to each other. A rejected form stays literal text, so it shows on the page as written.

### Metadata

- [`metadata-block`]{#metadata-block}: Metadata is a block between `---` lines at the very start of a document, closed by its own `---` line ([`metadata-unclosed`](syntax.md#metadata-unclosed)). It's never `+++` ([`toml-metadata`](syntax.md#toml-metadata)).
- [`metadata-flat`]{#metadata-flat}: Each metadata line is `key: value`, with a one-line value or a `[a, b]` list, and each key appears once ([`metadata-line`](syntax.md#metadata-line), [`metadata-duplicate-key`](syntax.md#metadata-duplicate-key)). Quote a value YAML would read another way, like one starting with a symbol, a yes or no word, `01234`, or a value holding `: ` or ` #` ([`metadata-value`](syntax.md#metadata-value)).

### Blocks

- [`heading-hash`]{#heading-hash}: Write a heading as `# Title`, never underlined with `===` or `---` ([`setext-heading`](syntax.md#setext-heading)). Set its id with `{#id}` on the line above it, not after the title ([`trailing-heading-attributes`](syntax.md#trailing-heading-attributes)).
- [`code-fenced`]{#code-fenced}: Fence code with three or more backticks, and show a fence inside with a longer one ([`indented-code`](syntax.md#indented-code), [`tilde-fence`](syntax.md#tilde-fence)). Close every fence, `$$` block and comment before its container ends ([`unclosed-block`](syntax.md#unclosed-block)).
- [`rule-dashes`]{#rule-dashes}: Write a thematic break as `---` ([`rule-marker`](syntax.md#rule-marker)).
- [`lines-marked`]{#lines-marked}: Start every line of a quote with `>`, and indent every line of a list item to its content ([`lazy-line`](syntax.md#lazy-line)).
- [`html-raw-block`]{#html-raw-block}: Write no HTML in a document. Use elements and attributes, or put HTML in a ` ```=html ` block ([`raw-html`](syntax.md#raw-html)). A component is a `{@name}` element, and a value is `${…}` ([`jsx-component`](syntax.md#jsx-component)).
- [`comment-alone`]{#comment-alone}: End a `<!-- … -->` comment with `-->` and nothing after it on that line ([`comment-trailing-text`](syntax.md#comment-trailing-text)).

### Inline

- [`emphasis-underscore`]{#emphasis-underscore}: Write `_emphasis_` and `**strong**`, never `*emphasis*` or `__strong__` ([`star-emphasis`](syntax.md#star-emphasis), [`underscore-strong`](syntax.md#underscore-strong)). Nest them for both, as `_**both**_` ([`triple-emphasis`](syntax.md#triple-emphasis)). Strike through with `~~text~~` ([`single-tilde`](syntax.md#single-tilde)).
- [`link-inline`]{#link-inline}: Write a link as `[text](url)`, with its URL in place ([`reference-link`](syntax.md#reference-link)). A bare URL goes in `<https://…>` ([`bare-url`](syntax.md#bare-url)), and a relative one needs text, as `[About](/about)` ([`relative-autolink`](syntax.md#relative-autolink)).
- [`note-span`]{#note-span}: Write a note as a span, like `[text]{.note}`, since there are no footnotes ([`caret-footnote`](syntax.md#caret-footnote)).
- [`character-itself`]{#character-itself}: Write a character itself, like `©`, not `&copy;`, and `\ ` for a non-breaking space ([`named-reference`](syntax.md#named-reference)).
- [`break-backslash`]{#break-backslash}: End a line with `\` for a hard break, never two spaces ([`trailing-spaces`](syntax.md#trailing-spaces)).
- [`math-dollar`]{#math-dollar}: Write `$x$` for math in a line, and a `$$` block for math on its own ([`math-delimiter`](syntax.md#math-delimiter)).
- [`expression-closed`]{#expression-closed}: Close every bracket inside `${…}`, and keep a regex out of it ([`expression-bracket`](syntax.md#expression-bracket)).

### Attributes and elements

- [`attributes-span`]{#attributes-span}: Put attributes on a span, as `[text]{.x}`, or on a link or an image, never straight after a word, code or emphasis ([`inline-attributes`](syntax.md#inline-attributes)). Inside the braces write `#id`, `.class`, `key=value`, `key="a value"` or a bare `key`, all on one line ([`attribute-syntax`](syntax.md#attribute-syntax), [`multiline-attributes`](syntax.md#multiline-attributes)).
- [`attributes-above`]{#attributes-above}: Put a block's `{…}` line directly above the block ([`orphan-attributes`](syntax.md#orphan-attributes)). Give each id once in a document ([`duplicate-id`](syntax.md#duplicate-id)).
- [`blank-lines`]{#blank-lines}: Put a blank line before and after an element or attribute line, wherever text, a list, a quote or a table would touch it ([`element-blank-lines`](syntax.md#element-blank-lines)).
- [`element-braces`]{#element-braces}: Write an element as `{@name}` … `{/name}`, `{@name /}` or `[text]{@name}`, never with colons ([`colon-directive`](syntax.md#colon-directive)). Its name is a block element such as `div` or `details`, or a custom element with a hyphen, like `call-out` ([`element-name`](syntax.md#element-name)). Close each element with its own `{/name}`, innermost first ([`element-close`](syntax.md#element-close), [`unclosed-element`](syntax.md#unclosed-element)).

### Checking

- [`check-after`]{#check-after}: After writing or editing a document, run `markz check` on it and fix every warning, by writing what it says instead. A document with warnings isn't done.
