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
- **A search finds only what its generator writes.** The edge cases nested at depth one, and one
  depth count covered every alternative. So each choice nested under another took its first
  option, and every element was a `div` and every link's destination had angle brackets. A longer
  search didn't help, since no seed could write the rest. Each recursion now counts its own depth,
  and the cases keep drawing until they take every choice, for two more seconds of `pnpm test`.
  That found three side rules the edge tests didn't apply, and one the grammar didn't state.
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
- **Skipping the inline pass on plain leaves paid where leaves are short.** A one-line leaf
  with no syntax is written as one text node: headings +12%, tables +10%, paragraphs +6%. Whole
  documents barely moved, since nearly every sentence holds a `.`, which may start a bare URL.
  Its test first ran past a cell's end to the row's, which the wide-table complexity test caught.
- **`escape` is the top hotspot and stays as it is.** It takes about a tenth of parse and HTML
  time. Most of that is the test that finds nothing, since only 7% of the strings it gets hold a
  character to escape. A loop over character codes was 25–33% slower, and `replaceAll` or a
  `switch` measured flat. A `search` followed by a loop won 15% alone but lost 2–4% on whole
  documents.
- **The parser doesn't mark text as needing escaping.** Text nodes and inline code are 85% of
  the calls, and the inline scanner already stops at `<`, `&` and `"`. A flag could skip most
  tests, for an estimated few percent. It's ruled out because every place that builds text would
  then share the safety check, and one wrong flag lets unescaped text into the page. Merging
  adjacent text nodes is out too, since only 6% of text nodes have a text sibling next.
- **Block lines need no copy-free tests.** The lazy-line check copies the rest of its line, but
  it runs only when a line misses an open container. The other copies are on lines that start
  with `#`, a fence or `$$`, so an ordinary line copies nothing.
- **Measure warm.** Timing code the engine hadn't finished optimizing hid most of these gains.
  Every figure now comes after a second of warm-up, as the median of repeated passes.
- **Construct timings need realistic input.** Headings looked slow because the test repeated the
  same few thousands of times, which timed id numbering no author asks for. The profile still
  shows it, as the id lookup, and an ASCII fast path for the slug measured flat.
- **Two runs of the bench can differ by 30% on unchanged code.** The machine drifts between runs
  by more than either run's noise band, so the bench no longer keeps a baseline. It loads both
  versions of `src/` in one process and alternates their passes.
- **One process isn't enough either.** Whichever version warmed up last ran a few percent
  faster, so they warm in turns. Even then a version's luck with the JIT holds for a whole
  process, and one construct could come out 15% apart on unchanged code. A change now counts only
  when three fresh processes all show it.
- **Comparisons across trade-offs mislead.** Other parsers read different syntax with different
  guarantees, so a table of speeds or sizes says little. markz compares privately and publishes
  only its own conformance, size and speed.

## Size

- **The budget decided the design.** A general parser with GFM and extensions leaves almost no
  room under 20 KB, so markz parses for itself. Dropping named entities removes a 12 KB table
  from every build.
- **Measured in every PR.** `pnpm size` fails above the budget, so growth shows where it's
  caused. Allowlists and messages are most of what features add.
- **Count memory where the engine keeps it.** The tree's typed arrays live outside V8's heap, so a
  figure from the heap alone missed them. It reported 4.5× the source for the spec's tree while
  the tree held 7.1×. The arrays start with room for one node per 8 bytes, and real documents have
  one per 22–56. `finish` returned views onto the whole guess. It now copies each array to its
  nodes, which brought the tree to 4.8× with no change in speed.
- **A string built with `+=` is cheap to make and costly to hold.** Code-block values grew a
  line at a time, so each one kept a rope with a piece per line. Text values sliced each leaf's
  joined lines, so each kept a copy of its whole paragraph. Together they were most of the heap.
  A code block whose lines are untouched now takes one slice of the source, and a leaf whose
  joined lines match the source reads from it. That brought the spec's tree from 4.8× to 3.2× its
  source, and code blocks got a few percent faster.
- **Copying to save memory cost speed where it ran per line or per node.** Joining every code
  block's lines made raw blocks 13% slower, since `html()` writes them as they are. Matching each
  text node against its source made documents 3–5% slower. One check per leaf costs nothing
  measurable, so the copies are only made where the source can't be used.

## Ideas to improve

- **djot's inline raw, `{=format}`.** It stays literal text with no warning. Raw blocks are the
  least used construct so far, so a warning for the inline form waits until they are used more.
- **`***` as a thematic break.** oxfmt writes `***` for a rule that starts a document, since
  `---` there opens metadata, and scripts and docs often use it. Accepting it breaks the rule of
  one marker. `*` emphasis has a precedent, since markz reads it where oxfmt writes it.
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
