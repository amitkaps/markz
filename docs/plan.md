# Plan

markz parses its dialect to a flat tree and renders it to HTML, with a warning for every input that doesn't do what it looks like. 0.7.0 is on npm as `@amitkaps/markz`, and its docs are at [markz.amitkaps.com](https://markz.amitkaps.com). What each release changed is in its [notes on GitHub](https://github.com/amitkaps/markz/releases). This plan says what's next, in order, and what works now.

## Next, in order

- [x] **Release 0.8.0.** prose, pagez and craftz read their rules with `@amitkaps/markz/rules`.
- [x] **Commands, stated once.** `readCommands` and `printHelp` read a tool's commands from its usage and print its help, and `readRules` reads under one heading, so a doc's commands aren't read as its rules. markz states its own commands, and `markz help` prints them.
- [ ] **Release 0.9.0.** Then prose and pagez state their commands and print `help` with it, and craftz moves its own to it, each in its own plan.

## Where it is

- **The dialect and the parser.** A flat tree from a block pass and an inline pass. Each construct is tested against the suites it borrows from, like micromark's, GFM's and the yaml-test-suite ([quality](quality.md)).
- **No footguns.** Every input does what it looks like, or gets a warning that says what to write. Smart punctuation went, metadata keys are flat, and a metadata value is kept as written ([syntax](syntax.md#writing-safely)).
- **Warnings by name.** `WARNINGS` gives every code's message and what to write instead, and each code has an id in Syntax that a test holds to it. A cut form's code names the form, like `colon-directive` ([reference](reference.md#warnings)).
- **Rules that say what to write.** Each code is linked from one rule, worded once in [usage](usage.md#for-agents) as a list item that opens with its id. `@amitkaps/markz/rules` reads a tool's rules with `ids`, composes them with markz's, prints them, and formats every finding as `<tool>: <level>: <file>:<line>:<col>: <code>: <message>; write <instead>`. A test holds the codes and the rules to each other ([reference](reference.md#rules)).
- **A command line.** `markz check <files>` prints each warning in that line and fails on one, `markz html [file]` writes a document's HTML, `markz rules [id]` prints the rules, and `markz help` the commands. Each is stated once in [usage](usage.md#on-the-command-line), and a test holds cli.ts to it.
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
