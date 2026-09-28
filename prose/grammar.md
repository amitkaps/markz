# Grammar

What markz reads, stated: every construct of [`syntax.md`](syntax.md), by its id, with its
productions and the side rules they can't state. `syntax.md` explains the dialect and this page
states it. The tests read it with markz itself, hold markz to it at every construct's edges, and
generate documents from it.

The productions describe what markz accepts, not how it reads it. On their own they are
ambiguous, as every Markdown grammar is, and the side rules settle each choice: which block a line
opens, what closes a run, how far a container's prefix reaches. The parser is written by hand as
the one reading of both ([Design](design.md#parser-foundation)). A form the dialect cuts has no
production here: it is a Not supported row in `syntax.md`, keyed by its warning code.

## Reading it

- **Notation.** The W3C EBNF of the XML spec, kept small: `name ::= expression`, `|` for
  alternatives, juxtaposition for sequence, `?`, `*` and `+`, parentheses, `'literal'` or
  `"literal"`, `#xA` for a character by code point, and `[a-z]` or `[^…]` for a character
  class, which may hold `#x…` too.
- **Constructs.** Each has the id `syntax.md` gives it (`{#id}` above its heading), under the
  same part, in the same order. Its first production is named by its id.
- **Origins.** The line under each heading names the earliest layer that defines the construct:
  CommonMark, GFM (which extends it), djot, pandoc, GitHub, or markz's own. A construct from
  CommonMark or GFM reads as micromark with GFM does, except where a side rule or a Not supported
  row says otherwise, and only those are compared with it.
- **Side rules.** Listed by name under the productions. An example that tries an ambiguous edge
  names the rule that settles it (`example 17 ambiguous closing-hashes`), and so does
  [`test/harness/cases.ts`](../test/harness/cases.ts) where markz and the productions part.
- **Checked.** Every name is defined, every production is reachable from `document`, and each
  side rule is named once.

## Document

What holds the constructs together: the order of the parts, what a line and a character are, and
the two rules of precedence, one per pass.

```ebnf
document ::= metadata? blank-line* (block blank-line*)*
block ::= paragraph | heading | blockquote | list | code-block | raw-block | math-block | table
  | thematic-break | block-attributes | element | comment
inline ::= inline-line (line-break inline-line)*
inline-line ::= inline-item+
phrase ::= (inline-item | line-break)+
inline-item ::= text | inline-code | inline-math | expression | link | span | emphasis
  | escape | smart-punctuation
text ::= char+
char ::= [^#xA#xD]
line-end ::= #xD #xA | #xA | #xD
blank-line ::= space* line-end
space ::= ' ' | #x9
indent ::= (' ' (' ' ' '?)?)?
digit ::= [0-9]
hex ::= [0-9A-Fa-f]
```

- `last-line`: The last line may end at the end of the document instead of at a line ending.
- `block-order`: At the start of a line, after up to three spaces, the block openings are tried in a fixed order (blockquote, heading, code or raw fence, `$$`, comment, thematic break, list item, element line, attribute line) and the first that matches wins. A line that opens none is paragraph text.
- `indentation`: Four or more columns of indentation, past the enclosing container's, open no block: the line is paragraph text. A tab advances to the next multiple of four columns.
- `container-prefix`: A container's content is written with its prefix removed from every line: `>` and one space for a blockquote, the item's content column for a list item. What is left is read as blocks by these same productions.
- `inline-order`: Inline code, math and expressions bind tightest, then autolinks, links and spans, then emphasis. An opener either closes or stays text, and the input is never read again.
- `text`: Text is any run of characters that opens no other inline construct, or whose construct does not close.
- `blank-lines`: A line of only spaces and tabs is blank, whatever else could read it, and a blank line ends a paragraph.
- `brackets`: The brackets in a link's or a span's text, or a leaf element's label, balance, unless a `\` escapes one.

## Metadata

{#metadata}

### Metadata

Origin: markz.

```ebnf
metadata ::= '---' space* line-end metadata-line* '---' space* line-end
metadata-line ::= (metadata-entry | '#' char*)? space* line-end
metadata-entry ::= metadata-key ':' (space+ metadata-value)? (space+ '#' char*)?
metadata-key ::= [A-Za-z_] [A-Za-z0-9_-]*
metadata-value ::= scalar | '[' space* (scalar (space* ',' space* scalar)*)? space* ']'
scalar ::= 'null' | 'true' | 'false' | number | double-quoted | single-quoted | plain
number ::= '-'? ('0' | [1-9] digit*) ('.' digit+)?
double-quoted ::= '"' ([^"\#xA#xD] | '\' ["\/bfnrt] | '\u' hex hex hex hex)* '"'
single-quoted ::= "'" ([^'#xA#xD] | "''")* "'"
plain ::= ([^ #x9#xA#xD"'{}#x5B#x5D&*!|>%@`,#?:-] | [?:-] [^ #x9#xA#xD]) char*
```

- `metadata-start`: Only at offset 0, and only when a closing `---` follows; whatever is between is metadata, and a line this grammar does not match is a warning. Without the closing line the first `---` is a thematic break.
- `metadata-continuation`: A line that is not a key line belongs to the value before it, which is skipped; lines inside brackets a rejected line left open are skipped too.
- `metadata-keys`: A key appears once.
- `plain-value`: A plain value contains no `: ` and is not one YAML 1.2 reads as another type (`True`, `~`, `0x1F`, `.5`, `1e3`).
- `list-items`: A plain list item contains no `,`, `[`, `]` or `{`, `}`.

## Block

{#paragraph}

### Paragraphs

Origin: CommonMark.

```ebnf
paragraph ::= indent? inline line-end
```

- `paragraph-lines`: A paragraph's lines run until a blank line or a line that opens a block. Inside a container, every line carries the container's prefix: there are no lazy lines.

{#heading}

### Headings

Origin: CommonMark.

```ebnf
heading ::= indent? heading-marker (space+ inline)? (space+ '#'+)? space* line-end
heading-marker ::= '#' '#'? '#'? '#'? '#'? '#'?
```

- `heading-line`: A heading's content is one line.
- `closing-hashes`: A run of `#`s ends the heading only after a space and at the end of the line, so `# b#` keeps its `#`, as does an escaped `\#`.
- `heading-id`: Every heading gets an id as it closes: the `id` of its block attributes, or else the slug of its plain text numbered past the ids already used.

{#blockquote}

### Blockquotes

Origin: CommonMark.

```ebnf
blockquote ::= indent? '>' (space? block+ | blank-line)
```

- `quote-lines`: Every line of a blockquote starts with `>`. A line without it ends the blockquote.

{#list}

### Lists

Origin: CommonMark.

```ebnf
list ::= bullet-item+ | ordered-item+
bullet-item ::= indent? [-*+] (space+ task? block+ | blank-line)
ordered-item ::= indent? digit+ [.)] (space+ task? block+ | blank-line)
task ::= '[' [ xX] ']' space+
```

- `item-content`: An item's content column is past its marker and the spaces after it, or one space past the marker when there are five or more or the item is empty. Its later lines are indented to that column.
- `same-marker`: The items of a list share one bullet character, or one ordered delimiter. A different one starts a new list.
- `ordinal`: An ordered marker has at most nine digits, and the first item's number is the list's start.
- `item-interrupts`: Only a `-`, `*`, `+` or `1.` item with content can interrupt a paragraph.
- `loose`: A blank line between items, or between blocks of an item, makes the list loose.

{#code-block}

### Code blocks

Origin: CommonMark.

````ebnf
code-block ::= indent? fence info? space* line-end code-line* closing-fence?
fence ::= '```' '`'*
info ::= space* [^ #x9#xA#xD`=] [^#xA#xD`]*
code-line ::= char* line-end
closing-fence ::= indent? fence space* line-end
````

- `fence-length`: A fence closes on a line holding only a backtick run at least as long as the opening one. Unclosed, it runs to the end of its container.
- `fence-indent`: Each content line loses up to as much indentation as the opening fence had.
- `info-string`: The first word of the info string, escapes decoded, is `lang`, and the rest is `meta`.

{#raw-block}

### Raw blocks

Origin: djot.

```ebnf
raw-block ::= indent? fence space* '=' format [^#xA#xD`]* line-end code-line* closing-fence?
format ::= [^ #x9#xA#xD`]+
```

{#math-block}

### Math blocks

Origin: GitHub.

```ebnf
math-block ::= indent? '$$' space* line-end code-line* (indent? '$$' space* line-end)?
             | indent? '$$' tex '$$' space* line-end
tex ::= ([^$#xA#xD] | '$' [^$#xA#xD])+
```

- `math-close`: The first line holding only `$$` closes it.
- `math-one-line`: On one line, the TeX between the `$$`s holds no `$$`, and holds something other than spaces and dollars: `$$ $$` and `$$$ $$` are text.

{#table}

### Tables

Origin: GFM.

```ebnf
table ::= table-row delimiter-row table-row*
table-row ::= indent? '|'? cell ('|' cell)* '|'? space* line-end
cell ::= ([^|\#xA#xD] | '\' char)* '\'?
delimiter-row ::= indent? '|'? delimiter-cell ('|' delimiter-cell)* '|'? space* line-end
delimiter-cell ::= space* ':'? '-'+ ':'? space*
```

- `table-columns`: The header row and the delimiter row have the same number of cells, at least one, and the delimiter row has a pipe or a colon. A row of only a pipe has no cells.
- `table-header`: The header row is a paragraph's last line, and not one indented four columns or more. Neither it nor the delimiter row opens another block: `- | -` is a list item.
- `table-end`: A table ends at a blank line, a line indented four columns or more, or a line that opens another block.

{#thematic-break}

### Thematic breaks

Origin: CommonMark.

```ebnf
thematic-break ::= indent? '-' space* '-' space* '-' (space* '-')* space* line-end
```

{#attributes}

### Attributes

Origin: djot.

```ebnf
attributes ::= '{' space* (attribute (space+ attribute)* space*)? '}'
attribute ::= '#' attribute-name | '.' attribute-name | attribute-key '=' attribute-value
  | boolean-key
boolean-key ::= [A-Za-z] [A-Za-z0-9_:-]*
attribute-name ::= [^ #x9#xA#xD{}#."'=]+
attribute-key ::= [A-Za-z0-9_:-]+
attribute-value ::= '"' ([^"\#xA#xD] | '\' char | expression)* '"'
  | ([^ #x9#xA#xD{}"'=$] | '$' | expression)+
block-attributes ::= indent? attributes space* line-end
```

- `attribute-places`: Attributes stand alone on a line before a block, follow a link or image's `)` or a span's `]` with no space, or follow an element's name. Anywhere else a `{` is text.
- `attribute-line`: A block-attribute line decorates the next block in its container, across blank lines. Consecutive lines merge, and a line above an element merges into the element's own. It cannot interrupt a paragraph or a table.
- `attribute-merge`: Classes accumulate. For any other key, the later value wins.
- `attribute-boolean`: A block of only boolean keys counts only after a link, image or span's `]`, or an element's name. On a line of its own or after a word, `{year}` is text.
- `attribute-syntax`: A `{…}` after a link, image or span's `]`, or on a line starting `{@` or `{/`, that does not parse is text, and a warning when it closes on the same line.

{#element}

### Elements

Origin: markz.

```ebnf
element ::= leaf-element | container-element
leaf-element ::= indent? ('[' phrase? ']')? element-open '/' '}' space* line-end
container-element ::= indent? element-open '}' space* line-end (block | blank-line)*
  element-close?
element-open ::= '{@' element-name (space+ attribute)* space*
element-close ::= indent? '{/' element-name '}' space* line-end
element-name ::= block-element | custom-element
block-element ::= 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'nav' | 'main' | 'address' | 'hgroup' | 'search' | 'details' | 'summary' | 'figure' | 'figcaption' | 'dl' | 'dt' | 'dd'
custom-element ::= [a-z] [a-z0-9]* '-' [a-z0-9-]*
```

- `element-name`: The name is the element it writes. A line with any other name is text, and a warning. The names HTML reserves (`font-face`, `annotation-xml`, …) are not custom elements.
- `leaf-label`: A leaf is one line, and its label is inline content, and its children.
- `leaf-slash`: A `/` just before the `}` closes a leaf, and is never part of an id, class or value, so `{@div #a/}` is a leaf with the id `a`.
- `element-interrupts`: An opening line can't interrupt a paragraph or a table. A leaf or a closing line can.
- `element-close`: A closing line closes the innermost element open in its container when the names match. Otherwise it is text, and a warning.
- `unclosed-element`: Unclosed, an element runs to the end of its container, with a warning at its opening line.

{#comment}

### Comments

Origin: markz.

```ebnf
comment ::= indent? '<!--' (('>' | '->' | (char | line-end)* '-->') space* line-end
  | (char | line-end)*)
```

- `comment-close`: A comment ends at the first `-->`, and `<!-->` and `<!--->` are whole comments, as in CommonMark. Unclosed, it runs to the end of its container. A `<!--` after other text on its line is inline text.

## Inline

{#emphasis}

### Emphasis

Origin: CommonMark.

```ebnf
emphasis ::= italic | strong | strikethrough
italic ::= '_' inline '_' | '*' inline '*'
strong ::= '**' inline '**'
strikethrough ::= '~~' inline '~~'
```

- `flanking`: A run can't open before whitespace, or before punctuation that follows a letter, and the mirror image for closing. `_` never opens or closes inside a word.
- `nearest-opener`: A closer takes the nearest open run of its own kind and length. Runs never split, so `***`, `____` and `~~~` are text.
- `emphasis-brackets`: A run opened before a `[` can't close before its `]`.
- `star-places`: `*` emphasis only inside `_…_`, or touching a letter or digit. Anywhere else a `*…*` pair is the `star-emphasis` cut.

{#inline-code}

### Inline code

Origin: CommonMark.

```ebnf
inline-code ::= backtick-run (char | line-end)+ backtick-run
backtick-run ::= '`'+
```

- `code-run`: A code span closes on the next backtick run of the same length. One space is stripped from each side when both are there and the content is not all spaces.

{#link}

### Links and images

Origin: CommonMark.

```ebnf
link ::= '[' phrase? ']' link-target | '!' '[' phrase? ']' link-target | autolink
link-target ::= '(' gap (destination ((space+ | space* line-end space*) title)?)? gap ')'
  attributes?
gap ::= space* (line-end space*)?
destination ::= '<' [^<>#xA#xD]* '>' | destination-start destination-part*
destination-start ::= [^ #x9#xA#xD()<] | '(' destination-part* ')'
destination-part ::= [^ #x9#xA#xD()] | '(' destination-part* ')'
title ::= '"' [^"]* '"' | "'" [^']* "'" | '(' [^()]* ')'
autolink ::= '<' scheme ':' [^ #x9#xA#xD<>]* '>' | '<' email '>'
scheme ::= [A-Za-z] [A-Za-z0-9+.-]+
email ::= [A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+ '@' domain-label ('.' domain-label)*
domain-label ::= [A-Za-z0-9] ([A-Za-z0-9-]* [A-Za-z0-9])?
```

- `link-text`: A link's text holds no link. An image's text is its alt text, as plain text.
- `scheme-length`: A scheme is 2 to 32 characters.
- `destination`: Escapes and `${…}` count inside a destination, and parentheses balance.

{#span}

### Spans

Origin: djot.

```ebnf
span ::= '[' phrase? ']' (attributes | '{@' inline-name (space+ attribute)* space* '}')
inline-name ::= inline-element | custom-element
inline-element ::= 'abbr' | 'b' | 'i' | 'u' | 's' | 'small' | 'cite' | 'q' | 'dfn' | 'time' | 'data' | 'var' | 'samp' | 'kbd' | 'mark' | 'sub' | 'sup' | 'ins' | 'bdi' | 'bdo' | 'ruby' | 'rt' | 'rp'
```

- `span-content`: A span's text is inline content, and its children. It may start inside a word.
- `inline-element-name`: Any other name, `span` included, leaves the whole `[…]{…}` as text, with nothing in it read as other syntax, and a warning.

{#inline-math}

### Inline math

Origin: pandoc.

```ebnf
inline-math ::= '$' [^ #x9#xA#xD${] ([^$]* [^ #x9#xA#xD$])? '$'
```

- `math-end`: The closing `$` is not followed by a digit, so `$5 and $10` is text.
- `math-dollars`: A run of two or more dollars never opens it. Closed by a run of the same length later in the paragraph, it is text reported as `math-delimiter`, as is ``$`…`$``.

{#expression}

### Expressions

Origin: markz.

```ebnf
expression ::= '${' (char | line-end)* '}'
```

- `brace-depth`: The closing `}` is the one that brings brace depth back to zero, with strings, template literals and comments skipped. Regex literals are not recognised.
- `expression-places`: Also in link destinations and attribute values. Inert in code, math and autolinks.

{#line-break}

### Line breaks

Origin: CommonMark.

```ebnf
line-break ::= '\' space* line-end | line-end
```

- `trailing-backslash`: Spaces and tabs between a `\` and the line ending are trailing whitespace, so `\ ` there is a hard break, not a non-breaking space.

{#escape}

### Escapes and references

Origin: CommonMark.

```ebnf
escape ::= '\' [!-/:-@#x5B-`{-~] | '\' ' ' | numeric-reference
numeric-reference ::= '&#' digit+ ';' | '&#' [xX] hex+ ';'
```

- `reference-digits`: At most seven decimal or six hexadecimal digits.
- `escape-binds`: A `\` before ASCII punctuation is always an escape, so the character it escapes opens and closes nothing.

{#smart-punctuation}

### Smart punctuation

Origin: djot.

```ebnf
smart-punctuation ::= '"' | "'" | '--' | '---' | '...'
```

- `quote-side`: A quote opens after the start of text, whitespace, an opening bracket, a dash, another quote or an emphasis marker, and closes otherwise.
- `dash-runs`: A run of more than three hyphens splits into em and en dashes with the same count.
