# Plan

markz parses its dialect to a flat tree and renders it to HTML, with a warning for every input that doesn't do what it looks like. 0.7.0 is on npm as `@amitkaps/markz`, and its docs are at [markz.amitkaps.com](https://markz.amitkaps.com). What each release changed is in its [notes on GitHub](https://github.com/amitkaps/markz/releases). This plan says what's next, in order, and what works now.

## Next, in order

Nothing is queued. The ideas under Later wait for a use that needs them.

## Where it is

- **The dialect and the parser.** A flat tree from a block pass and an inline pass. Each construct is tested against the suites it borrows from, like micromark's, GFM's and the yaml-test-suite ([quality](quality.md)).
- **No footguns.** Every input does what it looks like, or gets a warning that says what to write. Smart punctuation went, metadata keys are flat, and a metadata value is kept as written ([syntax](syntax.md#writing-safely)).
- **Warnings by name.** `WARNINGS` gives every code's message and what to write instead, and each code has an id in Syntax that a test holds to it. A cut form's code names the form, like `colon-directive` ([reference](reference.md#warnings)).
- **Ids.** Headings, elements and spans share one set, so a heading's id is numbered past an earlier one, and a `#id` already taken gets `duplicate-id` ([syntax](syntax.md#duplicate-id)). `ids(doc)` lists every id `html()` writes, for a link checker, and `headings` is its subset on headings ([reference](reference.md#idsdoc-id)).
- **Formatter-friendly.** Metadata lists can wrap onto indented lines, as oxfmt writes them. An element beside text gets `element-blank-lines`, so docs can use `proseWrap: "never"` ([syntax](syntax.md#element-blank-lines)).
- **The package.** TypeScript 7, shipped without comments, with every export documented ([reference](reference.md)). It is 19.4 KB gzipped of its 20 KB budget, so the next feature makes room before it fits ([design](design.md#performance-and-size)).
- **The site.** The README is the home page, and the docs are read in place by prose. Cloudflare's Git build deploys it, on craftz's rules.

## Later

- **djot's inline raw, `{=format}`.** It stays literal text with no warning. Raw blocks are the least used construct so far, so a warning for the inline form waits until they are used more.
- **Items.** A pending text string, or writing nodes during the scan, remain open, though merging items showed no gain.
- **Streaming.** Healing an unfinished document at one point, without changing `parse` ([design](design.md#streaming)).
- **The Quality page.** Robustness, the real-document corpus, formatter agreement and HTML safety could join conformance, size and speed.

## Open questions

- **Streaming's shape.** Whether healing belongs in markz, or in what renders a stream.
