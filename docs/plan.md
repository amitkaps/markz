# Plan

markz parses its dialect to a flat tree and renders it to HTML, with a warning for every input that doesn't do what it looks like. 0.6.0 is on npm as `@amitkaps/markz`, and its docs are at [markz.amitkaps.com](https://markz.amitkaps.com). What each release changed is in its [notes on GitHub](https://github.com/amitkaps/markz/releases). This plan says what's next, in order, and what works now.

## Next, in order

- [ ] **`ids(doc)`, every id `html()` writes.** Each is what a link can land on, so the list is what prose's rules reader and a link checker need. Each id comes with its node, its text and whether it was `written` as `{#id}` or made from a heading's words, in source order:

  ```ts
  interface Id {
    id: string;
    node: NodeId;
    written: boolean;
    text: string;
  }
  ```

  The text is the node's own, a span's label or a heading's words, since a label can be a name and not the id. `headings` becomes the subset on headings, with `depth`, and `idExplicit` is renamed `written`, so the two say it the same way. The ids are all claimed while parsing, so it's a walk, not a new pass. A test holds it to the `id="…"` that `html()` writes for every document in the harness, which also settles whether ids markz makes for itself, like a footnote's, belong in it. It's a release of its own, which prose then bundles.

## Where it is

- **The dialect and the parser.** A flat tree from a block pass and an inline pass. Each construct is tested against the suites it borrows from, like micromark's, GFM's and the yaml-test-suite ([quality](quality.md)).
- **No footguns.** Every input does what it looks like, or gets a warning that says what to write. Smart punctuation went, metadata keys are flat, and a metadata value is kept as written ([syntax](syntax.md#writing-safely)).
- **Warnings by name.** `WARNINGS` gives every code's message and what to write instead, and each code has an id in Syntax that a test holds to it. A cut form's code names the form, like `colon-directive` ([reference](reference.md#warnings)).
- **Ids.** Headings, elements and spans share one set, so a heading's id is numbered past an earlier one, and a `#id` already taken gets `duplicate-id` ([syntax](syntax.md#duplicate-id)).
- **Formatter-friendly.** Metadata lists can wrap onto indented lines, as oxfmt writes them. An element beside text gets `element-blank-lines`, so docs can use `proseWrap: "never"` ([syntax](syntax.md#element-blank-lines)).
- **The package.** TypeScript 7, shipped without comments, with every export documented ([reference](reference.md)).
- **The site.** The README is the home page, and the docs are read in place by prose. Cloudflare's Git build deploys it, on craftz's rules.

## Later

- **djot's inline raw, `{=format}`.** It stays literal text with no warning. Raw blocks are the least used construct so far, so a warning for the inline form waits until they are used more.
- **Items.** A pending text string, or writing nodes during the scan, remain open, though merging items showed no gain.
- **Streaming.** Healing an unfinished document at one point, without changing `parse` ([design](design.md#streaming)).
- **The Quality page.** Robustness, the real-document corpus, formatter agreement and HTML safety could join conformance, size and speed.

## Open questions

- **Streaming's shape.** Whether healing belongs in markz, or in what renders a stream.
