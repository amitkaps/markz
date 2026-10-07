# Lessons

What building markz taught, and what could still be better. The build itself is in git history.
This keeps what should shape the next change.

## The dialect

- **Cut what backtracks, keep the symbols people type.** Setext headings, reference links, raw
  HTML, lazy lines, indented code and CommonMark's emphasis rules each make a parser go back and
  change its mind. Removing them is what lets the parser be one pass and small. Keeping `**`,
  `_` and `-` means existing documents and formatter output carry over.
- **A cut form stays text and warns.** Every vendored suite found places where markz read a cut
  form as something else in silence. The rule holds only because each cut has a code, a range
  and a replacement, and tests key on codes, never on wording.
- **Warn when the page can't be what was meant.** Beyond the cut forms, markz warns only where
  the output is almost certainly a mistake: a block with no closing line that swallows the rest of
  its container, a `{` after a `]` that never closes, a `{/name}` after a `{#name}` line. Text
  that could be ordinary prose gets no warning, so a clean document stays clean.
- **One extension syntax.** Colon directives came with fence counting, a label HTML has no place
  for, and a bare `:name` that swallows prose. `{…}` with `@name` does the same work with one
  recognition rule. A closing line that names what it closes turns a mismatch into a warning.
  `=` then keeps one meaning: a raw format in a fence's info string.
- **Metadata is what a reader sees.** A closed `---` block at offset 0 is metadata whatever it
  holds, and a line markz can't read warns. Treating one bad line as "not metadata" surprised
  everyone.
- **One way for each thing, as it is already written.** Math is `$x$` and a `$$` block, as
  GitHub writes them. `\ ` at the end of a line is a hard break, since the space is invisible and
  formatters strip it. Heading ids are GitHub's, which four Unicode properties give, not an 8 KB
  character class.

## Testing

- **The grammar is the judge, and it can be wrong.** Generating every one-character edit of each
  construct found as many mistakes in the grammar as in the parser. A disagreement is settled by
  naming the side rule that decides it and testing that rule narrowly, never by widening a check.
- **An oracle only where markz agrees with it.** micromark judges the constructs markz shares
  with CommonMark and GFM. Where markz has its own rule, the example is filed as `differ` under
  that rule instead of bending the parser to match.
- **Vendored suites find real bugs, then need curating.** Tables, autolinks, footnotes, math,
  YAML and heading ids each found gaps, and one found a hang. Whole suites also buried the page
  in variants of forms markz cuts, so each keeps what tests a decision and the rest only has to
  run cleanly.
- **Linear time needs its own tests.** Before adversarial patterns were timed, 23 of 51 were
  quadratic. The common fix: a scan that fails remembers where, and settles every opener it
  passed, so nothing is scanned twice.
- **Real documents catch what examples don't.** Agent-written and human-written docs, read as
  written and after oxfmt, check that formatting never changes meaning.

## Speed

- **The largest cost was a data structure, not the algorithm.** Joining a leaf's lines with `+=`
  made a rope that V8 walks on every character read. Joining once gave +35%, more than any
  scanner change.
- **Then the usual things, measured one at a time.** Plain text taken in one sticky regex step
  (+11%), block starts tried only on their first character (+8%), and less allocated per leaf
  and node (+12%). A `switch` on character codes measured no faster, and halving the number of
  inline items changed nothing: making and copying items isn't where the time goes.
- **Measure warm.** Timing code the engine hadn't finished optimizing hid most of these gains.
  Every figure now comes after a second of warm-up, as the median of repeated passes.
- **Construct timings need realistic input.** Headings looked slow because the test repeated the
  same few thousands of times, which timed id numbering no author asks for.
- **Comparisons across trade-offs mislead.** Other parsers read different syntax with different
  guarantees, so a table of speeds or sizes says little. markz compares privately and publishes
  only its own conformance, size and speed.

## Size

- **The budget decided the design.** A general parser with GFM and extensions leaves almost no
  room under 20 KB, so markz parses for itself. Dropping named entities removes a 12 KB table
  from every build.
- **Measured in every PR.** `pnpm size` fails above the budget, so growth shows where it's
  caused. Allowlists and messages are most of what features add.

## Ideas to improve

- **djot's inline raw, `{=format}`.** It stays literal text with no warning. Raw blocks are the
  least used construct so far, so a warning for the inline form waits until they are used more.
- **Leaves with no syntax.** What is left of a heading's cost is the inline pass on its short
  title. A leaf with no character in the plain-text stop set could become one text node without
  the pass, which would help table cells and short paragraphs too. Bare URLs, quotes and dashes
  all start on stop characters, so skipping the pass loses nothing.
- **Block lines without copies.** The lazy-line check, setext, fence and `$$` tests copy the rest
  of a line before testing it, and the lazy-line check runs on every paragraph line. Sticky
  regexes at the line's offset would test the source in place. Short copies are cheap in V8, so
  the gain may be small.
- **Items.** A pending text string, or writing nodes during the scan, remain open, though
  merging items showed no gain.
- **Streaming.** Healing an unfinished document at one point, without changing `parse`
  ([Design](design.md#streaming)).
- **The Quality page.** Robustness, the real-document corpus, formatter agreement and HTML
  safety could join conformance, size and speed.
- **amitkaps.github.io migrates to the dialect:** `<img>` to `![](…){…}`; video wrappers to
  `{@div .video-container}` … `{/div}`; `<br>` to a trailing `\`; embeds, SVG and scripts to
  ` ```=html ` blocks; poems to `{.verse}`; `<sup>`, `<sub>`, `<ins>` and `<abbr>` to
  `[…]{@sup}` and the like; named references to their characters.
