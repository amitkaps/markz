/** @prose
 * # Attributes
 *
 * The `{…}` block, markz's one extension syntax, wherever syntax.md allows one: `#id`, `.class`,
 * `key=value`, with `key="a quoted value"` for spaces, and a bare `key` for a boolean attribute,
 * on one line. An element's block starts with `@name`, and a block element's may end in `/`.
 * Items are kept verbatim and in source order, each with its range; merging (classes accumulate,
 * a later value wins) is the renderer's job. Anything that doesn't parse returns `null`, and the
 * caller keeps the braces as text (syntax.md: Attributes).
 */
import { type Attribute, type Attributes } from './ast';
import { isSpace, unescape } from './chars';
import { scanExpression, type Memo } from './expression';

/**
 * `source[at]` is a `{`. Returns the attributes, whose `end` is just past the `}`, or `null`.
 * `multiline` reads a line ending as a space, only to tell whether lines would parse if joined.
 * `memo` is `scanExpression`'s, for `source` and `end`.
 */
export function parseAttributes(
	source: string,
	at: number,
	end: number,
	multiline = false,
	memo?: Memo
): Attributes | null {
	const space = multiline ? (c: number) => isSpace(c) || c === 10 || c === 13 : isSpace;
	return scan(source, at, at + 1, end, space, memo, false)?.attributes ?? null;
}

/** An element's `{@name …}`, whose `attributes` are the items after the name. */
export interface ElementHead {
	name: string;
	attributes: Attributes;
	/** It ends in `/}`: a block element closed on its line. */
	slash: boolean;
}

/** `source[at]` is a `{` followed by `@`. Returns the element's head, or `null`. */
export function parseElement(
	source: string,
	at: number,
	end: number,
	memo?: Memo
): ElementHead | null {
	NAME.lastIndex = at + 2;
	const m = NAME.exec(source);
	if (!m || at + 2 + m[0].length > end) return null;
	const i = at + 2 + m[0].length;
	const c = source.charCodeAt(i);
	if (i < end && !isSpace(c) && c !== 125 && c !== 47) return null;
	const out = scan(source, at, i, end, isSpace, memo, true);
	return out && { name: m[0], attributes: out.attributes, slash: out.slash };
}

/** A name as written: `element()` decides whether it is one. */
const NAME = /[A-Za-z][\w-]*/y;

/** The items from `i` to the `}`, and whether a `/` came just before it, where `slash` allows one. */
function scan(
	source: string,
	at: number,
	i: number,
	end: number,
	space: (c: number) => boolean,
	memo: Memo | undefined,
	slash: boolean
): { attributes: Attributes; slash: boolean } | null {
	const items: Attribute[] = [];
	for (;;) {
		while (i < end && space(source.charCodeAt(i))) i++;
		if (i >= end) return null;
		const c = source[i];
		if (c === '}') return { attributes: { start: at, end: i + 1, items }, slash: false };
		if (slash && c === '/' && source[i + 1] === '}') {
			return { attributes: { start: at, end: i + 2, items }, slash: true };
		}
		const start = i;
		if (c === '#' || c === '.') {
			i = name(source, i + 1, end, space, slash);
			if (i === start + 1) return null;
			items.push({
				key: c === '#' ? 'id' : 'class',
				value: source.slice(start + 1, i),
				start,
				end: i
			});
		} else {
			const keyEnd = key(source, i, end);
			if (keyEnd === i) return null;
			const valueStart = keyEnd + 1;
			let value = '';
			if (source[keyEnd] !== '=') {
				// A bare key is a boolean attribute (`open`, `controls`), and starts with a letter.
				if (!/[A-Za-z]/.test(c!)) return null;
				i = keyEnd;
			} else if (source[valueStart] === '"') {
				i = quoted(source, valueStart, end, memo);
				if (i < 0) return null;
				value = unescape(source.slice(valueStart + 1, i - 1));
			} else {
				i = bare(source, valueStart, end, space, memo, slash);
				if (i < 0 || i === valueStart) return null;
				value = source.slice(valueStart, i);
			}
			items.push({ key: source.slice(start, keyEnd), value, start, end: i });
		}
		// Items are separated by whitespace, or end at the `}`.
		if (i < end && !space(source.charCodeAt(i)) && source[i] !== '}') {
			if (!(slash && source[i] === '/')) return null;
		}
	}
}

/**
 * Whether every item is a bare key. Such a block counts only where attributes attach to a link,
 * image, span or element: on a line of its own or after a word, `{year}` is an MDX expression or
 * a placeholder, and stays text.
 */
export function bareOnly(source: string, a: Attributes): boolean {
	return a.items.length > 0 && a.items.every((i) => source.slice(i.start, i.end) === i.key);
}

/** Where a `{…}` that didn't parse ends, just past its `}` on the same line, or -1. */
export function braceEnd(source: string, at: number, end: number): number {
	for (let i = at; i < end; i++) if (source.charCodeAt(i) === 125) return i + 1;
	return -1;
}

/**
 * An id or class name: anything up to whitespace or one of the characters that delimit items.
 * Where `slash` allows a closing `/}`, a `/` just before the `}` is the leaf's, not the name's.
 */
function name(source: string, at: number, end: number, space = isSpace, slash = false): number {
	let i = at;
	while (
		i < end &&
		!space(source.charCodeAt(i)) &&
		!'{}#."\'='.includes(source[i]!) &&
		!(slash && closes(source, i))
	)
		i++;
	return i;
}

/** A `/` just before the `}`. */
const closes = (source: string, i: number) => source[i] === '/' && source[i + 1] === '}';

function key(source: string, at: number, end: number): number {
	let i = at;
	while (i < end && /[\w:-]/.test(source[i]!)) i++;
	return i;
}

/** A `"…"` value, with backslash escapes and `${…}` inside. Returns the offset past the `"`. */
function quoted(source: string, at: number, end: number, memo?: Memo): number {
	for (let i = at + 1; i < end;) {
		const c = source[i];
		if (c === '\\') i += 2;
		else if (c === '"') return i + 1;
		else if (c === '$' && source[i + 1] === '{') {
			i = scanExpression(source, i, end, memo);
			if (i < 0) return -1;
		} else i++;
	}
	return -1;
}

/** An unquoted value runs to whitespace or `}`, or a closing `/}`, with `${…}` skipped whole. */
function bare(
	source: string,
	at: number,
	end: number,
	space: (c: number) => boolean,
	memo?: Memo,
	slash = false
): number {
	let i = at;
	while (i < end) {
		const c = source[i]!;
		if (c === '$' && source[i + 1] === '{') {
			i = scanExpression(source, i, end, memo);
			if (i < 0) return -1;
		} else if (space(c.charCodeAt(0)) || '{}"\'='.includes(c) || (slash && closes(source, i)))
			break;
		else i++;
	}
	return i;
}
