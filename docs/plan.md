# Plan

Where markz is and what comes next. Finished work gets a line or two. The detail lives in the
release notes, the code's `@prose`, the tests and [lessons](lessons.md).

## Where it is

markz parses its dialect to a flat tree and renders it to HTML, with a warning for every input
that doesn't do what it looks like. The latest release is 0.4.1, on npm as `@amitkaps/markz`,
and its docs are at [markz.amitkaps.com](https://markz.amitkaps.com).

### 0.4.1

- **Metadata lists that wrap.** A list can continue on indented lines after its key, as oxfmt
  writes a long one, and may end with a comma.

### 0.4.0

- **No footguns.** Every input does what it looks like, or gets a warning that says what to
  write. Smart punctuation went, metadata keys are flat, and a metadata value is kept as
  written ([syntax](syntax.md#writing-safely)).

### 0.3.0

- **TypeScript 7, and a smaller package.** It ships without comments, and every export is
  documented ([reference](reference.md)).
- **The docs as the site.** The README is the home page, the docs are read in place, and the
  site deploys from Cloudflare's Git build.
- **More warnings.** Unclosed blocks, and an element closed by the wrong name.

### 0.2.0

- **`headings(doc)`, and the usage and reference pages.** The site is built with prose, from
  `docs/`.

### 0.1.0

- **The dialect, and the parser.** A flat tree, block and inline passes, warning codes, and the
  grammar. Each construct is tested against the suites it borrows from, like micromark's, GFM's
  and the yaml-test-suite ([quality](quality.md)).

## Next, in order

Nothing is queued. The ideas below wait for a use that needs them.

## Later

- **djot's inline raw, `{=format}`.** It stays literal text with no warning. Raw blocks are the
  least used construct so far, so a warning for the inline form waits until they are used more.
- **Items.** A pending text string, or writing nodes during the scan, remain open, though
  merging items showed no gain.
- **Streaming.** Healing an unfinished document at one point, without changing `parse`
  ([design](design.md#streaming)).
- **The Quality page.** Robustness, the real-document corpus, formatter agreement and HTML
  safety could join conformance, size and speed.

## Open questions

- **Streaming's shape.** Whether healing belongs in markz, or in what renders a stream.
