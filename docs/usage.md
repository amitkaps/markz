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
  import { html } from "https://cdn.jsdelivr.net/npm/@amitkaps/markz@0.6/+esm";

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

## For agents

An agent that writes Markdown for a project that uses markz should write markz, and check it. Copy this into the project's `CLAUDE.md` or `AGENTS.md`:

````markdown
- Write Markdown in markz's dialect (https://markz.amitkaps.com/docs/syntax.md): everyday GFM without setext headings, reference links, footnotes, indented code, `*emphasis*`, `__strong__` or raw HTML. Use `_emphasis_`, `**strong**`, `# Title` headings and fenced code. Attributes and elements are `{#id .class}` and `{@name}`; raw HTML goes in a ` ```=html ` block.
- After writing or editing a document, parse it with `parse` from `@amitkaps/markz` and fix every entry in `doc.warnings`: each one names the supported form to write instead (`w.instead`). A document with warnings isn't done.
- Never keep rejected syntax: markz leaves it as literal text, so it shows up on the page as written.
````

The checking step can be a script or a test that parses each `.md` file and fails on any warning, as the `docs.test.ts` in the markz repo does for its own docs.
