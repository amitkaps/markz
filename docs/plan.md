# Plan

markz parses its dialect to a flat tree and renders it to HTML, with a warning for every input that doesn't do what it looks like. 0.7.0 is on npm as `@amitkaps/markz`, and its docs are at [markz.amitkaps.com](https://markz.amitkaps.com). What each release changed is in its [notes on GitHub](https://github.com/amitkaps/markz/releases). This plan says what's next, in order, and what works now.

## Next, in order

Every tool's rules compose from here, since every tool builds on markz. prose and pagez each copy markz's codes today, and prose words markz's rules in its own `markz-markdown`.

- [ ] **Rules that say what to write.** A warning says what not to write, so markz gains the positive rules, worded once in a For agents section of [syntax](syntax.md). Each is a list item that opens with its id, like `emphasis-underscore`, under a heading for its group. Each code's row in Not supported gains a link to the rule it serves, and a level, which is `warning` for every markz code. The harness holds the codes and the rules to each other.
- [ ] **The rules in code, as `@amitkaps/markz/rules`.** A subpath for Node, so the browser bundle and its budget don't change. It reads a rules doc with `ids`, composes a tool's rules with those of the packages it builds on, and finds a rule by its id or a code. Ids are unique across what composes, since a lookup searches them all. It prints the rules grouped by heading, each with its codes, and resolves a relative link against the site.
- [ ] **One line for a finding, and three levels.** The subpath formats every tool's finding the same way, as `<tool>: <level>: <file>:<line>:<col>: <code>: <message>; write <instead>`. A part with nothing in it is dropped, and the tool is the one that ran, so its `rules` command finds the code. The level belongs to the code, so a code means the same in every tool, and each command has one policy.
  - **error.** The tool can't do its job, like a page that can't build. It always fails.
  - **warning.** A rule is broken. `check` fails on it, unless the repository holds the rule with a reason, which the line ends with as `; held: <reason>`. A build prints it and carries on.
  - **note.** No rule is broken, but it's worth knowing, like a newer version or style advice. It never fails.
- [ ] **A command line, as marked has.** `markz check <files>` prints markz's warnings in that line, and `markz rules [id]` prints its rules. It's a `bin` that runs in Node, with the rules doc bundled into it.
- [ ] **The harness reads with `ids`.** `test/harness/syntax.ts` finds the constructs and the codes in the tree, in place of reading lines.

## Where it is

- **The dialect and the parser.** A flat tree from a block pass and an inline pass. Each construct is tested against the suites it borrows from, like micromark's, GFM's and the yaml-test-suite ([quality](quality.md)).
- **No footguns.** Every input does what it looks like, or gets a warning that says what to write. Smart punctuation went, metadata keys are flat, and a metadata value is kept as written ([syntax](syntax.md#writing-safely)).
- **Warnings by name.** `WARNINGS` gives every code's message and what to write instead, and each code has an id in Syntax that a test holds to it. A cut form's code names the form, like `colon-directive` ([reference](reference.md#warnings)).
- **Ids.** Headings, elements and spans share one set, so a heading's id is numbered past an earlier one, and a `#id` already taken gets `duplicate-id` ([syntax](syntax.md#duplicate-id)). `ids(doc)` lists every id `html()` writes, for a link checker, and `headings` is its subset on headings ([reference](reference.md#idsdoc-id)). Each tool reads its rules doc with `ids`, in place of a regex.
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
