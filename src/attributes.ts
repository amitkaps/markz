/** @prose
 * # Attributes
 *
 * The `{…}` block, wherever syntax.md allows one: `#id`, `.class` and `key=value`, with
 * `key="a quoted value"` for spaces, on one line. Items are kept verbatim and in source order, each
 * with its range; merging (classes accumulate, a later value wins) is the renderer's job. Anything
 * that doesn't parse returns `null`, and the caller keeps the braces as text (syntax.md:
 * Attributes).
 */
import { type Attribute, type Attributes } from './ast';
import { isSpace, unescape } from './chars';
import { scanExpression } from './expression';

/** `source[at]` is a `{`. Returns the attributes, whose `end` is just past the `}`, or `null`. */
export function parseAttributes(source: string, at: number, end: number): Attributes | null {
	const items: Attribute[] = [];
	let i = at + 1;
	for (;;) {
		while (i < end && isSpace(source.charCodeAt(i))) i++;
		if (i >= end) return null;
		const c = source[i];
		if (c === '}') return { start: at, end: i + 1, items };
		const start = i;
		if (c === '#' || c === '.') {
			i = name(source, i + 1, end);
			if (i === start + 1) return null;
			items.push({
				key: c === '#' ? 'id' : 'class',
				value: source.slice(start + 1, i),
				start,
				end: i
			});
		} else {
			const keyEnd = key(source, i, end);
			if (keyEnd === i || source[keyEnd] !== '=') return null;
			const valueStart = keyEnd + 1;
			let value: string;
			if (source[valueStart] === '"') {
				i = quoted(source, valueStart, end);
				if (i < 0) return null;
				value = unescape(source.slice(valueStart + 1, i - 1));
			} else {
				i = bare(source, valueStart, end);
				if (i < 0 || i === valueStart) return null;
				value = source.slice(valueStart, i);
			}
			items.push({ key: source.slice(start, keyEnd), value, start, end: i });
		}
		// Items are separated by whitespace, or end at the `}`.
		if (i < end && !isSpace(source.charCodeAt(i)) && source[i] !== '}') return null;
	}
}

/** An id or class name: anything up to whitespace or one of the characters that delimit items. */
function name(source: string, at: number, end: number): number {
	let i = at;
	while (i < end && !isSpace(source.charCodeAt(i)) && !'{}#."\'='.includes(source[i]!)) i++;
	return i;
}

function key(source: string, at: number, end: number): number {
	let i = at;
	while (i < end && /[\w:-]/.test(source[i]!)) i++;
	return i;
}

/** A `"…"` value, with backslash escapes and `${…}` inside. Returns the offset past the `"`. */
function quoted(source: string, at: number, end: number): number {
	for (let i = at + 1; i < end;) {
		const c = source[i];
		if (c === '\\') i += 2;
		else if (c === '"') return i + 1;
		else if (c === '$' && source[i + 1] === '{') {
			i = scanExpression(source, i, end);
			if (i < 0) return -1;
		} else i++;
	}
	return -1;
}

/** An unquoted value runs to whitespace or `}`, with `${…}` skipped whole. */
function bare(source: string, at: number, end: number): number {
	let i = at;
	while (i < end) {
		const c = source[i]!;
		if (c === '$' && source[i + 1] === '{') {
			i = scanExpression(source, i, end);
			if (i < 0) return -1;
		} else if (isSpace(c.charCodeAt(0)) || '{}"\'='.includes(c)) break;
		else i++;
	}
	return i;
}
