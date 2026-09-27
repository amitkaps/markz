/** @prose
 * # The grammar
 *
 * The dialect as data: every construct of `syntax.md`, with a stable id, its part, where its rule
 * comes from, its productions and the rules EBNF can't state. `syntax.md` explains the dialect and
 * this states it. Each construct heading there carries its id (`{#heading}` on the line above), and
 * examples are filed by id, so a heading can be reworded without breaking anything.
 *
 * The productions describe what markz accepts, not how it reads it. They are ambiguous on their
 * own, as Markdown grammars are, and the side rules settle every choice: which block a line opens,
 * what closes a run, how far a container's prefix reaches. The parser is the one deterministic
 * reading of productions plus rules (`spec.md`, Parser foundation). A form the dialect cuts has no
 * production here; it is a Not supported row, keyed by its warning code.
 *
 * It lives in `test/` and never ships. The tests hold it to `syntax.md`, and from step 16 the
 * fuzzer generates documents from it.
 */
import { BLOCK, INLINE } from '../src/elements';
import { productions, references, type Production } from './ebnf';

/** An allowlist of element names as alternatives. */
const names = (list: ReadonlySet<string>) => [...list].map((n) => `'${n}'`).join(' | ');

/** @prose
 * ## Origins
 *
 * Where a construct's rule comes from: the earliest layer that defines it, in the order the layers
 * build on each other. CommonMark, then GFM, which extends it, then micromark-extension-directive,
 * then djot. Math sits outside that chain: its delimiters are pandoc's and GitHub's, written in
 * GitHub's HTML shape. What no layer defines is markz's own. Each construct in `syntax.md` opens
 * with its origin's lead, in bold, and the tests hold the two together.
 */
export type Origin = 'CommonMark' | 'GFM' | 'directive' | 'djot' | 'GitHub' | 'pandoc' | 'markz';

export const LEADS: Record<Origin, string> = {
	CommonMark: 'As CommonMark',
	GFM: 'As GFM',
	directive: 'From micromark-extension-directive',
	djot: 'From djot',
	GitHub: 'As GitHub',
	pandoc: 'From pandoc',
	markz: 'markz'
};

export type ConstructPart = 'Metadata' | 'Block' | 'Inline';

export interface Construct {
	/** The id in `syntax.md` (`{#id}`), and the production the construct is named by. */
	id: string;
	part: ConstructPart;
	origin: Origin;
	/** Its productions, in EBNF, the first one named by the id. */
	grammar: string;
	/** What EBNF can't state, by name. */
	rules: Record<string, string>;
}

/** @prose
 * ## The document
 *
 * What holds the constructs together: the order of the parts, what a line and a character are,
 * and the two rules of precedence, one per pass.
 */
export const DOCUMENT: Omit<Construct, 'id' | 'part' | 'origin'> = {
	grammar: `
		document ::= metadata? blank-line* (block blank-line*)*
		block ::= paragraph | heading | blockquote | list | code-block | raw-block | math-block | table
			| thematic-break | directive | block-attributes | comment
		inline ::= inline-item+
		inline-item ::= text | inline-code | inline-math | expression | link | text-directive | emphasis
			| escape | line-break | smart-punctuation
		text ::= char+
		char ::= [^#xA#xD]
		line-end ::= #xD #xA | #xA | #xD
		blank-line ::= space* line-end
		space ::= ' ' | #x9
		indent ::= (' ' (' ' ' '?)?)?
		digit ::= [0-9]
		hex ::= [0-9A-Fa-f]
	`,
	rules: {
		'last-line': 'The last line may end at the end of the document instead of at a line ending.',
		'block-order':
			'At the start of a line, after up to three spaces, the block openings are tried in a fixed order (blockquote, heading, code or raw fence, `$$`, comment, thematic break, list item, directive, attribute line) and the first that matches wins. A line that opens none is paragraph text.',
		indentation:
			"Four or more columns of indentation, past the enclosing container's, open no block: the line is paragraph text. A tab advances to the next multiple of four columns.",
		'container-prefix':
			"A container's content is written with its prefix removed from every line: `>` and one space for a blockquote, the item's content column for a list item. What is left is read as blocks by these same productions.",
		'inline-order':
			'Inline code, math and expressions bind tightest, then autolinks, directives and links, then emphasis. An opener either closes or stays text, and the input is never read again.',
		text: 'Text is any run of characters that opens no other inline construct, or whose construct does not close.'
	}
};

/** @prose
 * ## Constructs
 *
 * In `syntax.md`'s order. Every production a construct names is defined here or in the document's
 * productions, and every production is reachable from `document`.
 */
export const CONSTRUCTS: Construct[] = [
	{
		id: 'metadata',
		part: 'Metadata',
		origin: 'markz',
		grammar: `
			metadata ::= '---' space* line-end metadata-line* '---' space* line-end
			metadata-line ::= (metadata-entry | '#' char*)? space* line-end
			metadata-entry ::= metadata-key ':' (space+ metadata-value)? (space+ '#' char*)?
			metadata-key ::= [A-Za-z_] [A-Za-z0-9_-]*
			metadata-value ::= scalar | '[' space* (scalar (space* ',' space* scalar)*)? space* ']'
			scalar ::= 'null' | 'true' | 'false' | number | double-quoted | single-quoted | plain
			number ::= '-'? ('0' | [1-9] digit*) ('.' digit+)?
			double-quoted ::= '"' ([^"\\#xA#xD] | '\\' ["\\/bfnrt] | '\\u' hex hex hex hex)* '"'
			single-quoted ::= "'" ([^'#xA#xD] | "''")* "'"
			plain ::= [^ #x9#xA#xD"'{}#x5B#x5D&*!|>%@\`,#?:-] char*
		`,
		rules: {
			'metadata-start':
				'Only at offset 0, and only when a closing `---` follows; whatever is between is metadata, and a line this grammar does not match is a warning. Without the closing line the first `---` is a thematic break.',
			'metadata-continuation':
				'A line that is not a key line belongs to the value before it, which is skipped; lines inside brackets a rejected line left open are skipped too.',
			'metadata-keys': 'A key appears once.',
			'plain-value':
				'A plain value contains no `: ` and is not one YAML 1.2 reads as another type (`True`, `~`, `0x1F`, `.5`, `1e3`).',
			'list-items': 'A plain list item contains no `,`, `[`, `]` or `{`, `}`.'
		}
	},
	{
		id: 'paragraph',
		part: 'Block',
		origin: 'CommonMark',
		grammar: `
			paragraph ::= indent? inline line-end
		`,
		rules: {
			'paragraph-lines':
				"A paragraph's lines run until a blank line or a line that opens a block. Inside a container, every line carries the container's prefix: there are no lazy lines."
		}
	},
	{
		id: 'heading',
		part: 'Block',
		origin: 'CommonMark',
		grammar: `
			heading ::= indent? heading-marker (space+ inline)? (space+ '#'+)? space* line-end
			heading-marker ::= '#' '#'? '#'? '#'? '#'? '#'?
		`,
		rules: {
			'heading-line': "A heading's content is one line.",
			'heading-id':
				'Every heading gets an id as it closes: the `id` of its block attributes, or else the slug of its plain text numbered past the ids already used.'
		}
	},
	{
		id: 'blockquote',
		part: 'Block',
		origin: 'CommonMark',
		grammar: `
			blockquote ::= indent? '>' space? block+
		`,
		rules: {
			'quote-lines':
				'Every line of a blockquote starts with `>`. A line without it ends the blockquote.'
		}
	},
	{
		id: 'list',
		part: 'Block',
		origin: 'CommonMark',
		grammar: `
			list ::= bullet-item+ | ordered-item+
			bullet-item ::= indent? [-*+] (space+ task? block+ | blank-line)
			ordered-item ::= indent? digit+ [.)] (space+ task? block+ | blank-line)
			task ::= '[' [ xX] ']' space+
		`,
		rules: {
			'item-content':
				"An item's content column is past its marker and the spaces after it, or one space past the marker when there are five or more or the item is empty. Its later lines are indented to that column.",
			'same-marker':
				'The items of a list share one bullet character, or one ordered delimiter. A different one starts a new list.',
			ordinal:
				"An ordered marker has at most nine digits, and the first item's number is the list's start.",
			'item-interrupts':
				'Only a `-`, `*`, `+` or `1.` item with content can interrupt a paragraph.',
			loose: 'A blank line between items, or between blocks of an item, makes the list loose.'
		}
	},
	{
		id: 'code-block',
		part: 'Block',
		origin: 'CommonMark',
		grammar: `
			code-block ::= indent? fence info? line-end code-line* closing-fence?
			fence ::= '\`\`\`' '\`'*
			info ::= space* [^ #x9#xA#xD\`=] [^#xA#xD\`]*
			code-line ::= char* line-end
			closing-fence ::= indent? fence space* line-end
		`,
		rules: {
			'fence-length':
				'A fence closes on a line holding only a backtick run at least as long as the opening one. Unclosed, it runs to the end of its container.',
			'fence-indent': 'Each content line loses up to as much indentation as the opening fence had.',
			'info-string':
				'The first word of the info string, escapes decoded, is `lang`, and the rest is `meta`.'
		}
	},
	{
		id: 'raw-block',
		part: 'Block',
		origin: 'djot',
		grammar: `
			raw-block ::= indent? fence '=' format [^#xA#xD\`]* line-end code-line* closing-fence?
			format ::= [^ #x9#xA#xD\`]+
		`,
		rules: {}
	},
	{
		id: 'math-block',
		part: 'Block',
		origin: 'GitHub',
		grammar: `
			math-block ::= indent? '$$' space* line-end code-line* (indent? '$$' space* line-end)?
			             | indent? '$$' tex '$$' space* line-end
			tex ::= ([^$] | '$' [^$])+
		`,
		rules: {
			'math-close': 'The first line holding only `$$` closes it.',
			'math-one-line': 'On one line, the TeX between the `$$`s is not blank and holds no `$$`.'
		}
	},
	{
		id: 'table',
		part: 'Block',
		origin: 'GFM',
		grammar: `
			table ::= table-row delimiter-row table-row*
			table-row ::= indent? '|'? cell ('|' cell)* '|'? line-end
			cell ::= ([^|\\#xA#xD] | '\\' char)*
			delimiter-row ::= indent? '|'? delimiter-cell ('|' delimiter-cell)* '|'? line-end
			delimiter-cell ::= space* ':'? '-'+ ':'? space*
		`,
		rules: {
			'table-columns':
				'The header row and the delimiter row have the same number of cells, and the delimiter row has a pipe or a colon.',
			'table-end':
				'A table ends at a blank line, a line indented four columns or more, or a line that opens another block.'
		}
	},
	{
		id: 'thematic-break',
		part: 'Block',
		origin: 'CommonMark',
		grammar: `
			thematic-break ::= indent? '-' space* '-' space* '-' (space* '-')* space* line-end
		`,
		rules: {}
	},
	{
		id: 'directive',
		part: 'Block',
		origin: 'directive',
		grammar: `
			directive ::= leaf-directive | container-directive
			leaf-directive ::= indent? '::' directive-name directive-label? attributes? space* line-end
			container-directive ::= indent? ':::' ':'* directive-name directive-label? attributes? space*
				line-end block* directive-close?
			directive-close ::= indent? ':::' ':'* space* line-end
			directive-name ::= block-element | custom-element
			block-element ::= ${names(BLOCK)}
			custom-element ::= [a-z] [a-z0-9]* '-' [a-z0-9-]*
			directive-label ::= '[' label-text ']'
			label-text ::= ([^#x5B#x5D\\#xA#xD] | '\\' char | '[' label-text ']')*
		`,
		rules: {
			'directive-close':
				'A closing fence has at least as many colons as the opening one, and the outermost open container it can close takes it. Unclosed, it runs to the end of its container.',
			'directive-label':
				"A leaf's label is inline content. A container's label is plain text with escapes decoded, and only `details`, `figure` and custom elements have a place for it: on any other block it is reported and not written.",
			'element-name':
				'The name is the element the directive writes. A line with any other name is text, and a warning. The names HTML reserves (`font-face`, `annotation-xml`, …) are not custom elements.'
		}
	},
	{
		id: 'attributes',
		part: 'Block',
		origin: 'djot',
		grammar: `
			attributes ::= '{' space* (attribute (space+ attribute)* space*)? '}'
			attribute ::= '#' attribute-name | '.' attribute-name | attribute-key '=' attribute-value
				| boolean-key
			boolean-key ::= [A-Za-z] [A-Za-z0-9_:-]*
			attribute-name ::= [^ #x9#xA#xD{}#."'=]+
			attribute-key ::= [A-Za-z0-9_:-]+
			attribute-value ::= '"' ([^"\\] | '\\' char | expression)* '"'
				| ([^ #x9#xA#xD{}"'=$] | '$' | expression)+
			block-attributes ::= indent? attributes space* line-end
		`,
		rules: {
			'attribute-places':
				"Attributes follow a directive's name or label, stand alone on a line before a block, or follow a link or image's `)` with no space. Anywhere else a `{` is text.",
			'attribute-line':
				'A block-attribute line decorates the next block in its container, across blank lines. Consecutive lines merge. It cannot interrupt a paragraph or a table.',
			'attribute-merge': 'Classes accumulate. For any other key, the later value wins.',
			'attribute-boolean':
				'A block of only boolean keys counts only after a directive, link or image. On a line of its own or after a word, `{year}` is text.',
			'attribute-syntax':
				'A `{…}` after a directive, link or image that does not parse is text, and a warning when it closes on the same line.'
		}
	},
	{
		id: 'comment',
		part: 'Block',
		origin: 'markz',
		grammar: `
			comment ::= indent? '<!--' (char | line-end)* '-->' space* line-end
		`,
		rules: {
			'comment-close':
				'A comment ends at the first `-->`. Unclosed, it runs to the end of its container. A `<!--` after other text on its line is inline text.'
		}
	},
	{
		id: 'emphasis',
		part: 'Inline',
		origin: 'CommonMark',
		grammar: `
			emphasis ::= '_' inline '_' | '*' inline '*' | '**' inline '**' | '~~' inline '~~'
		`,
		rules: {
			flanking:
				"A run can't open before whitespace, or before punctuation that follows a letter, and the mirror image for closing. `_` never opens or closes inside a word.",
			'nearest-opener':
				'A closer takes the nearest open run of its own kind and length. Runs never split, so `***`, `____` and `~~~` are text.',
			'emphasis-brackets': "A run opened before a `[` can't close before its `]`.",
			'star-places':
				'`*` emphasis only inside `_…_`, or touching a letter or digit. Anywhere else a `*…*` pair is the `star-emphasis` cut.'
		}
	},
	{
		id: 'inline-code',
		part: 'Inline',
		origin: 'CommonMark',
		grammar: `
			inline-code ::= backtick-run (char | line-end)+ backtick-run
			backtick-run ::= '\`'+
		`,
		rules: {
			'code-run':
				'A code span closes on the next backtick run of the same length. One space is stripped from each side when both are there and the content is not all spaces.'
		}
	},
	{
		id: 'link',
		part: 'Inline',
		origin: 'CommonMark',
		grammar: `
			link ::= '[' inline? ']' link-target | '!' '[' inline? ']' link-target | autolink
			link-target ::= '(' space* destination? (space+ title)? space* ')' attributes?
			destination ::= '<' [^<>#xA#xD]* '>' | destination-part+
			destination-part ::= [^ #x9#xA#xD()<] | '(' destination-part* ')'
			title ::= '"' [^"]* '"' | "'" [^']* "'" | '(' [^()]* ')'
			autolink ::= '<' scheme ':' [^ #x9#xA#xD<>]* '>' | '<' email '>'
			scheme ::= [A-Za-z] [A-Za-z0-9+.-]+
			email ::= [A-Za-z0-9.!#$%&'*+/=?^_\`{|}~-]+ '@' domain-label ('.' domain-label)*
			domain-label ::= [A-Za-z0-9] ([A-Za-z0-9-]* [A-Za-z0-9])?
		`,
		rules: {
			'link-text': "A link's text holds no link. An image's text is its alt text, as plain text.",
			'scheme-length': 'A scheme is 2 to 32 characters.',
			destination: 'Escapes and `${…}` count inside a destination, and parentheses balance.'
		}
	},
	{
		id: 'text-directive',
		part: 'Inline',
		origin: 'directive',
		grammar: `
			text-directive ::= ':' inline-name (directive-label attributes? | attributes)
			inline-name ::= inline-element | custom-element
			inline-element ::= ${names(INLINE)}
		`,
		rules: {
			'text-directive-start':
				"A text directive can't start straight after another `:`. Its label is inline content.",
			'inline-element-name':
				'Any other name, or a `::name[…]` inside a line, leaves the whole span as text, with nothing in it read as other syntax. Only the one-colon form is reported.'
		}
	},
	{
		id: 'inline-math',
		part: 'Inline',
		origin: 'pandoc',
		grammar: `
			inline-math ::= '$' [^ #x9#xA#xD\${] ([^$]* [^ #x9#xA#xD$])? '$'
		`,
		rules: {
			'math-end': 'The closing `$` is not followed by a digit, so `$5 and $10` is text.',
			'math-dollars':
				'A run of two or more dollars never opens it. Closed by a run of the same length later in the paragraph, it is text reported as `math-delimiter`, as is `` $`…`$ ``.'
		}
	},
	{
		id: 'expression',
		part: 'Inline',
		origin: 'markz',
		grammar: `
			expression ::= '\${' (char | line-end)* '}'
		`,
		rules: {
			'brace-depth':
				'The closing `}` is the one that brings brace depth back to zero, with strings, template literals and comments skipped. Regex literals are not recognised.',
			'expression-places':
				'Also in link destinations and attribute values. Inert in code, math and autolinks.'
		}
	},
	{
		id: 'line-break',
		part: 'Inline',
		origin: 'CommonMark',
		grammar: `
			line-break ::= '\\' line-end | line-end
		`,
		rules: {}
	},
	{
		id: 'escape',
		part: 'Inline',
		origin: 'CommonMark',
		grammar: `
			escape ::= '\\' [!-/:-@#x5B-\`{-~] | '\\' ' ' | numeric-reference
			numeric-reference ::= '&#' digit+ ';' | '&#' [xX] hex+ ';'
		`,
		rules: {
			'reference-digits': 'At most seven decimal or six hexadecimal digits.'
		}
	},
	{
		id: 'smart-punctuation',
		part: 'Inline',
		origin: 'djot',
		grammar: `
			smart-punctuation ::= '"' | "'" | '--' | '---' | '...'
		`,
		rules: {
			'quote-side':
				'A quote opens after the start of text, whitespace, an opening bracket, a dash, another quote or an emphasis marker, and closes otherwise.',
			'dash-runs':
				'A run of more than three hyphens splits into em and en dashes with the same count.'
		}
	}
];

/** Every production, by name, with the construct that defines it (`null` for the document's). */
export const PRODUCTIONS = new Map<string, Production & { construct: string | null }>();
for (const [construct, grammar] of [
	[null, DOCUMENT.grammar] as const,
	...CONSTRUCTS.map((c) => [c.id, c.grammar] as const)
]) {
	for (const p of productions(grammar)) {
		if (PRODUCTIONS.has(p.name)) throw new Error(`production ${p.name} is defined twice`);
		PRODUCTIONS.set(p.name, { ...p, construct });
	}
}

export const construct = (id: string): Construct | undefined => CONSTRUCTS.find((c) => c.id === id);

/** The names reachable from `document`. */
export function reachable(): Set<string> {
	const seen = new Set<string>();
	const visit = (name: string) => {
		if (seen.has(name)) return;
		seen.add(name);
		const p = PRODUCTIONS.get(name);
		if (p) for (const n of references(p.expr)) visit(n);
	};
	visit('document');
	return seen;
}
