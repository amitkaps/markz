# Lessons

What building markz taught, for whoever changes it next. Each lesson says what went wrong and what to do about it. What the dialect is and why is in [Design](design.md) and [Syntax](syntax.md), and the story is in the pull request.

The first groups follow the principles in [craftz's Practice](https://craftz.amitkaps.com/docs/rules.md#practice), and each says what holds its principle here. markz's own groups come after them. A lesson that repeats one in its group means the principle needs a check.

## Try it on the real thing

The rule is [Try it on the real thing](https://craftz.amitkaps.com/docs/rules.md#try-it-on-the-real-thing). Vendored suites and real documents, read as written and after formatting, run in `pnpm test`.

- **Vendored suites find real bugs, then need curating.** Tables, autolinks, footnotes, math, YAML and heading ids each found gaps, and one found a hang. Whole suites also buried the page in variants of forms markz cuts, so each keeps what tests a decision and the rest only has to run cleanly.
- **Real documents catch what examples don't.** Agent-written and human-written docs, read as written and after formatting, check that formatting never changes meaning.
- **More documents of one kind add nothing.** Fourteen Rust book chapters and ten Vite pages reached the same parser code as two and four of them. Measured by the code each document runs, 23 of the 48 documents reached 99% of what all of them did. So a new document is chosen for the code, constructs and warnings it reaches that the rest don't, like the Rust blog's TOML front matter or the Chinese and math of d2l-zh.
- **Joining a paragraph's lines isn't a change in meaning.** With `proseWrap: "never"`, oxfmt joins a paragraph's lines, and the documents test read the newline it replaced as a difference, in 32 documents. A soft line break is whitespace to HTML, so the test now sets aside any run of whitespace. A hard break is still `<br />`, so it still counts.
- **A claim about another tool needs that tool run.** Syntax said formatters rewrite `~one~` to `~~one~~`, and gave that as the reason `single-tilde` is cut. Neither Prettier nor oxfmt does it. Syntax's Formatters section is now run through both, so each claim it makes holds or fails a test.

## Measure before changing

The rule is [Measure before changing](https://craftz.amitkaps.com/docs/rules.md#measure-before-changing). `pnpm speed` compares the working tree with `main` in one process, and `pnpm hotspots` says where the time goes ([Design](design.md#performance-and-size)).

- **The largest cost was a data structure, not the algorithm.** Joining a leaf's lines with `+=` made a rope that V8 walks on every character read. Joining once gave +35%, more than any scanner change.
- **Then the usual things, measured one at a time.** Plain text taken in one sticky regex step gave +11%, block starts tried only on their first character +8%, and less allocated per leaf and node +12%. A `switch` on character codes measured no faster, and halving the number of inline items changed nothing.
- **Skipping the inline pass on plain leaves paid where leaves are short.** A one-line leaf with no syntax is written as one text node, for headings +12%, tables +10% and paragraphs +6%. Whole documents barely moved, since nearly every sentence holds a `.`, which may start a bare URL. Its test first ran past a cell's end to the row's, which the wide-table complexity test caught.
- **Measure warm.** Timing code the engine hadn't finished optimizing hid most of these gains. Every figure now comes after a second of warm-up, as the median of repeated passes.
- **Construct timings need realistic input.** Headings looked slow because the test repeated the same few thousands of times, which timed id numbering no author asks for.
- **Two runs of the bench can differ by 30% on unchanged code.** The machine drifts between runs by more than either run's noise band, so the bench keeps no baseline. It loads both versions of `src/` in one process and alternates their passes.
- **One process isn't enough either.** Whichever version warmed up last ran a few percent faster, so they warm in turns. Even then a version's luck with the JIT holds for a whole process, and one construct could come out 15% apart on unchanged code. A change counts only when three fresh processes all show it.
- **Count memory where the engine keeps it.** The tree's typed arrays live outside V8's heap, so a figure from the heap alone missed them. It reported 4.5× the source for the spec's tree while the tree held 7.1×.
- **Time each step of `verify` before deciding a slow one is the tests.** The Quality page searched every construct's edges again, with the same seed and runs as `pnpm test`, which was 11 of its 16 seconds. The test now keeps what it reached, and the page reads it ([kept.ts](../test/harness/kept.ts)). The timing tests warmed each size with a full timed run, for 27 seconds, and one warm-up pass and the best of three take 11.
- **`verify` stays over craftz's 10 second budget, at about 28 seconds on CI.** The tests run side by side and keep the cores busy, so splitting the slowest files saved only 3 of 30 seconds. The timing tests run alone, since a busy core skews their clocks, and the Quality page now runs beside them. What's left is the edge searches, so markz takes the note `craftz status` prints, and keeps its tests whole rather than thinner.

## Silence is the failure

The rule is [Silence is the failure](https://craftz.amitkaps.com/docs/rules.md#silence-is-the-failure). Every cut form has a code, a range and a form to write instead ([Not supported](syntax.md#not-supported)), and tests key on codes, never on wording.

- **A cut form read as something else, with no warning.** Every vendored suite found places where markz did this. So a cut form stays text and warns, and the rule holds only because each cut has a code.
- **Metadata that wasn't metadata surprised everyone.** A closed `---` block whose one bad line made the whole block "not metadata" turned a document's settings into a rule and a paragraph. A closed block at offset 0 is now metadata whatever it holds, and a line markz can't read warns.

## Parse, don't match text

The rule is [Parse, don't match text](https://craftz.amitkaps.com/docs/rules.md#parse-dont-match-text). The harness and `readRules` read docs with markz's own `ids`.

- **Read a doc with the parser.** The harness read Syntax a line at a time, keeping track of fences by hand. Read with `ids`, it finds the same constructs, rows and codes in half the code, and a sample in a fence can't pass for the page.
- **A doc holds more than one kind of list.** Stating markz's commands in usage the way its rules are would have made each command a rule too, since `readRules` read every list item that opens with an id. Reading under one heading keeps them apart, and the reader still keeps no regex for its layout.

## State it once

The rule is [State it once](https://craftz.amitkaps.com/docs/rules.md#state-it-once). A test holds each warning code to the one agent rule that says it.

- **A warning says what not to write.** An agent asked to write markz needed the form to write, which was scattered over Syntax. So each code is linked from one rule that says it, and a code can't ship without one.

## Testing

- **The grammar is the judge, and it can be wrong.** Generating every one-character edit of each construct found as many mistakes in the grammar as in the parser. A disagreement is settled by naming the side rule that decides it and testing that rule narrowly, never by widening a check.
- **An oracle only where markz agrees with it.** micromark judges the constructs markz shares with CommonMark and GFM. Where markz has its own rule, the example is filed as `differ` under that rule instead of bending the parser to match.
- **A search finds only what its generator writes.** The edge cases nested at depth one, and one depth count covered every alternative. So each choice nested under another took its first option, and every element was a `div`. A longer search didn't help, since no seed could write the rest. Each recursion now counts its own depth, and the cases keep drawing until they take every choice. That found three side rules the edge tests didn't apply, and one the grammar didn't state.
- **Linear time needs its own tests.** Before adversarial patterns were timed, 23 of 51 were quadratic. The common fix is a scan that fails remembering where, and settling every opener it passed, so nothing is scanned twice.

## Size

- **The budget decided the design.** A general parser with GFM and extensions leaves almost no room under 20 KB, so markz parses for itself. Dropping named entities removes a 12 KB table from every build. Allowlists and messages are most of what features add.
- **A typed array's guess is held as long as a view of it.** The arrays start with room for one node per 8 bytes, and real documents have one per 22–56. `finish` returned views onto the whole guess. It now copies each array to its nodes, which brought the spec's tree from 7.1× its source to 4.8×, with no change in speed.
- **A string built with `+=` is cheap to make and costly to hold.** Code-block values grew a line at a time, so each one kept a rope with a piece per line. Text values sliced each leaf's joined lines, so each kept a copy of its whole paragraph. A code block whose lines are untouched now takes one slice of the source, and a leaf whose joined lines match the source reads from it. That brought the tree from 4.8× to 3.2×.
- **Copying to save memory cost speed where it ran per line or per node.** Joining every code block's lines made raw blocks 13% slower, since `html()` writes them as they are. Matching each text node against its source made documents 3–5% slower. One check per leaf costs nothing measurable, so the copies are only made where the source can't be used.
