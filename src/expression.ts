/** @prose
 * # Expressions
 *
 * Where a `${…}` ends. markz never evaluates or validates the JavaScript inside; it only finds the
 * `}` that matches the opening brace, skipping strings, template literals (with their own nested
 * `${}`) and comments, so a brace inside any of them doesn't count (syntax.md: Expressions).
 * Regex literals aren't recognised, which is the documented limit. The same scanner serves inline
 * expressions, link destinations and attribute values.
 */

/**
 * `source[at]` is the `$` of a `${`. Returns the offset just past the matching `}`, or -1 when it
 * doesn't close before `end`.
 */
export function scanExpression(source: string, at: number, end: number): number {
	// One entry per open context: a brace depth for code, TEMPLATE inside a template literal.
	const stack = [1];
	let i = at + 2;
	while (i < end) {
		const c = source.charCodeAt(i);
		const top = stack.length - 1;
		if (stack[top] === TEMPLATE) {
			if (c === BACKSLASH) i += 2;
			else if (c === BACKTICK) {
				stack.pop();
				i++;
			} else if (c === DOLLAR && source.charCodeAt(i + 1) === OPEN) {
				stack.push(1);
				i += 2;
			} else i++;
		} else if (c === QUOTE || c === APOSTROPHE) {
			i = skipString(source, i, end);
			if (i < 0) return -1;
		} else if (c === BACKTICK) {
			stack.push(TEMPLATE);
			i++;
		} else if (c === SLASH && source.charCodeAt(i + 1) === SLASH) {
			i = lineEnd(source, i, end);
		} else if (c === SLASH && source.charCodeAt(i + 1) === STAR) {
			const close = source.indexOf('*/', i + 2);
			if (close < 0 || close + 2 > end) return -1;
			i = close + 2;
		} else if (c === OPEN) {
			stack[top]!++;
			i++;
		} else if (c === CLOSE) {
			i++;
			if (--stack[top]! === 0) {
				stack.pop();
				if (stack.length === 0) return i;
			}
		} else i++;
	}
	return -1;
}

function skipString(source: string, at: number, end: number): number {
	const quote = source.charCodeAt(at);
	for (let i = at + 1; i < end; i++) {
		const c = source.charCodeAt(i);
		if (c === BACKSLASH) i++;
		else if (c === quote) return i + 1;
		else if (c === NEWLINE || c === RETURN) return -1;
	}
	return -1;
}

function lineEnd(source: string, at: number, end: number): number {
	let i = at;
	while (i < end && source.charCodeAt(i) !== NEWLINE && source.charCodeAt(i) !== RETURN) i++;
	return i;
}

const TEMPLATE = -1;
const NEWLINE = 10;
const RETURN = 13;
const QUOTE = 34;
const DOLLAR = 36;
const APOSTROPHE = 39;
const STAR = 42;
const SLASH = 47;
const BACKSLASH = 92;
const BACKTICK = 96;
const OPEN = 123;
const CLOSE = 125;
