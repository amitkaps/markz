/** @prose
 * # Warning codes
 *
 * Every warning markz can raise, by a stable code, with its default message and the supported
 * form to write instead. The code is what editors, tests and `syntax.md` refer to, so the wording
 * can change without breaking anything that keys on it. Each form `syntax.md` cuts has one code,
 * named in the Code column of its Not supported table; the rest belong to a construct (a reused
 * heading id, a malformed metadata line) and are named in that construct's section.
 */
export const WARNINGS = {
	// Not supported: metadata.
	'toml-metadata': ['TOML metadata', 'a `---` metadata block'],
	// Not supported: blocks.
	'raw-html': ['raw HTML', 'a ` ```=html ` raw block, or elements and attributes'],
	'setext-heading': ['setext heading underline', '`# Title`'],
	'indented-code': ['indented code block', 'fenced code'],
	'tilde-fence': ['`~~~` fence', 'a longer backtick fence'],
	'rule-marker': ['`***`, `___` or `* * *` rule', '`---`'],
	'trailing-heading-attributes': ['trailing heading attributes', '`{#id}` on the line above'],
	'multiline-attributes': ['multi-line attributes', 'one line'],
	directive: ['a colon directive', '`{@name}` … `{/name}`, `[label]{@name /}` or `[text]{@name}`'],
	'element-name': [
		'a name that is not an element',
		'a `div` or span with a class (`{@div .chart /}`, `[x]{.note}`), or a custom element (`{@chart-view /}`)'
	],
	'lazy-line': [
		'lazy continuation line',
		"`>` on every line, or indent to the item's content column"
	],
	// Not supported: inline.
	'reference-link': ['reference link', 'inline links'],
	footnote: ['footnote', 'a span, such as `[text]{.note}`'],
	'bare-url': ['bare URL', '`<https://…>` or `[text](url)`'],
	'relative-autolink': ['relative autolink', '`[About](/about)`'],
	'named-reference': [
		'named character reference',
		'the character itself (`©`, `&`), or `\\ ` for a non-breaking space'
	],
	'trailing-spaces': [
		'two trailing spaces as a line break',
		'`\\` at end of line, or `{.verse}` on a poem'
	],
	'underscore-strong': ['`__strong__`', '`**strong**`'],
	'star-emphasis': ['`*emphasis*`', '`_emphasis_`'],
	'single-tilde': ['`~single~` strikethrough', '`~~text~~`'],
	'math-delimiter': ['math delimiters other than `$…$` in a line', '`$x$`, or a `$$` block'],
	'inline-attributes': ['attributes after inline text', '`[text]{.x}`'],
	jsx: ['JSX', '`{@name}` elements, `${…}`'],
	// A construct's own.
	'duplicate-id': ['id already used by an earlier heading', 'a different id'],
	'element-close': [
		'a closing line with no open element of that name in its container',
		'close the innermost open element, at its own level'
	],
	'unclosed-element': ['an element with no closing line', 'a `{/name}` line, or `/}` for a leaf'],
	'attribute-syntax': [
		'attributes markz does not read',
		'`#id`, `.class`, `key=value` or `key="a value"`, and a bare `key`, on one line'
	],
	'orphan-attributes': [
		'block attributes with no block after them',
		'put the `{…}` line directly above a block'
	],
	'comment-trailing-text': [
		'text after `-->` is part of the comment',
		'end the comment on a line of its own'
	],
	'metadata-unclosed': ['metadata block with no closing `---`', 'a `---` line after the metadata'],
	'metadata-indented': [
		'indented metadata line: nested values, lists and multi-line strings are not supported',
		'a one-line value, or a `[a, b]` list'
	],
	'metadata-line': ['not a `key: value` line', '`key: value`'],
	'metadata-duplicate-key': ['duplicate metadata key; the first one wins', 'each key once'],
	'metadata-value': ['a value YAML reads differently', 'the canonical form, or quote the value']
} as const satisfies Record<string, readonly [message: string, instead: string]>;

export type WarningCode = keyof typeof WARNINGS;
