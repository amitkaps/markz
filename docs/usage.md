# Usage

Install markz, render a document, find out what it rejected, and use what it knows about the
document. Each section is a short recipe, and every function it uses is in
[Reference](reference.md). The language itself is in [Syntax](syntax.md).

## Install

```sh
pnpm add @amitkaps/markz
```

markz has no dependencies and runs the same in Node, Workers and the browser.

## Render

```ts
import { html } from "@amitkaps/markz";

const page = html(markdown);
```

The result is a string of HTML with nothing in it that can run script, unless the document has a
` ```=html ` block, which is written as it is.

## Check a document

markz reads its own language, not every Markdown. What it doesn't read stays literal text and is
reported, with the form to write instead:

```ts
import { parse, position } from "@amitkaps/markz";

const doc = parse(markdown);
const at = position(markdown);
for (const w of doc.warnings) {
  const { line, column } = at(w.start);
  console.log(`${line}:${column + 1} ${w.message}; write ${w.instead}`);
}
```

An empty `doc.warnings` means the document is plain markz. A document pasted from elsewhere is
converted by fixing what this lists.

## Read the metadata

```ts
const doc = parse(markdown);
doc.metadata?.title; // the `title: …` line, or undefined
doc.metadata?.deploy; // `deploy.name: …` lines nest: { name: "…" }
```

## Build a table of contents

`headings` gives each heading's depth, text and id, and the `id` is the one `html()` writes, so
a link to it lands on the heading:

```ts
import { headings, parse } from "@amitkaps/markz";

const contents = headings(parse(markdown))
  .filter((h) => h.depth <= 3)
  .map((h) => `${"  ".repeat(h.depth - 1)}- [${h.text}](#${h.id})`)
  .join("\n");
```

How deep to go, and whether to nest, number or style it, is yours to decide: markz doesn't
put a contents list in `html()`.

## Keep a poem's line breaks

A poem or a quote with its own line breaks can end each line with `\`, the language's only
hard break. `html()` writes a `<br />` there, which shows wherever the HTML goes.

On a site, a class and one CSS rule do the same without the `\` on every line:

```md
{.verse}
Moko kahan dhundhe re bande
Main to tere paas mein
```

```css
.verse {
  white-space: pre-line;
}
```

`html()` writes `<p class="verse">` and keeps the paragraph's newlines, as it does for every
paragraph. The class means nothing to markz, and the breaks show only where that CSS applies.
In a feed, an email or a preview without it, the lines run together. `html()` never adds a class
for styling, so this one is the author's choice.

## For agents

An agent that writes Markdown for a project that uses markz should write markz, and check it. Copy
this into the project's `CLAUDE.md` or `AGENTS.md`:

````markdown
- Write Markdown in markz's dialect (https://markz.amitkaps.com/docs/syntax.md): everyday GFM
  without setext headings, reference links, footnotes, indented code, `*emphasis*`, `__strong__`
  or raw HTML. Use `_emphasis_`, `**strong**`, `# Title` headings and fenced code. Attributes and
  elements are `{#id .class}` and `{@name}`; raw HTML goes in a ` ```=html ` block.
- After writing or editing a document, parse it with `parse` from `@amitkaps/markz` and fix every
  entry in `doc.warnings`: each one names the supported form to write instead (`w.instead`). A
  document with warnings isn't done.
- Never keep rejected syntax: markz leaves it as literal text, so it shows up on the page as
  written.
````

The checking step can be a script or a test that parses each `.md` file and fails on any warning,
as the `docs.test.ts` in the markz repo does for its own docs.
