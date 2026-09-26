/** @prose
 * # Metadata
 *
 * The `---` block at the top of a document, read by syntax.md's JSON-like rule: one `key: value`
 * per line, where a value is null, a boolean, a number, a quoted string, a one-line `[…]` list, or
 * otherwise a string as written. It is not a YAML parser, but it never disagrees with one: a value
 * YAML 1.2 would read as something else (`True`, `~`, `1e3`) is a warning, and so is anything
 * YAML has that the rule doesn't (indented lines, `|`, `{a: b}`, anchors). A line in error skips its
 * key; the rest of the block is still read.
 */
import { type Warning, type MetadataScalar, type MetadataValue } from './ast';

type Report = (warning: Warning) => void;

const YAML = 'syntax.md: Metadata';

/** Reads the lines between `start` and `end` (the fences excluded). */
export function parseMetadata(
	source: string,
	start: number,
	end: number,
	report: Report
): Record<string, MetadataValue> {
	const value: Record<string, MetadataValue> = {};
	// The key the previous line set, so an indented line after it can skip it.
	let last: string | null = null;
	for (let at = start; at < end;) {
		let lineEnd = at;
		while (lineEnd < end && source[lineEnd] !== '\n' && source[lineEnd] !== '\r') lineEnd++;
		const line = source.slice(at, lineEnd);
		const fail = (message: string, instead: string) =>
			report({ start: at, end: lineEnd, message, instead });

		if (/^[ \t]/.test(line) && line.trim() !== '') {
			fail(
				'indented metadata line: nested values, lists and multi-line strings are not supported',
				`a one-line value, or a [a, b] list (${YAML})`
			);
			if (last !== null) delete value[last];
			last = null;
		} else if (line.trim() !== '' && line[0] !== '#') {
			const match = /^([A-Za-z_][\w-]*):(?:[ \t]+|$)/.exec(line);
			last = null;
			if (!match) fail('not a `key: value` line', `key: value (${YAML})`);
			else if (Object.hasOwn(value, match[1]!)) {
				fail(`duplicate metadata key \`${match[1]}\`; the first one wins`, 'each key once');
			} else {
				const result = parseValue(stripComment(line.slice(match[0].length)));
				if (typeof result === 'string' && result.startsWith('!'))
					fail(result.slice(1), `the canonical form, or quote the value (${YAML})`);
				else {
					value[match[1]!] = (result as { value: MetadataValue }).value;
					last = match[1]!;
				}
			}
		}
		at = lineEnd;
		if (source[at] === '\r') at++;
		if (source[at] === '\n') at++;
	}
	return value;
}

/** A value, or a `!message` string when it is rejected. */
function parseValue(text: string): { value: MetadataValue } | string {
	if (text.startsWith('[')) {
		if (!text.endsWith(']')) return '!a list must close on its line';
		const inner = text.slice(1, -1).trim();
		if (inner === '') return { value: [] };
		const items: MetadataScalar[] = [];
		for (const item of splitList(inner)) {
			if (item === null) return '!unbalanced quotes in a list';
			const trimmed = item.trim();
			if (trimmed === '') return '!empty list item';
			if (/^[[\]{]/.test(trimmed) || /[[\]{}]/.test(unquotedPart(trimmed))) {
				return '!nested lists and maps are not supported';
			}
			const scalar = parseScalar(trimmed);
			if (typeof scalar === 'string') return scalar;
			items.push(scalar.value);
		}
		return { value: items };
	}
	return parseScalar(text);
}

function parseScalar(text: string): { value: MetadataScalar } | string {
	if (text === '' || text === 'null') return { value: null };
	if (text === 'true') return { value: true };
	if (text === 'false') return { value: false };
	if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(text)) return { value: Number(text) };
	if (text[0] === '"') {
		if (!/^"(?:[^"\\]|\\.)*"$/.test(text)) return '!a double-quoted value must close at the end';
		try {
			return { value: JSON.parse(text) as string };
		} catch {
			return '!not a valid JSON string';
		}
	}
	if (text[0] === "'") {
		if (!/^'(?:[^']|'')*'$/.test(text)) return '!a single-quoted value must close at the end';
		return { value: text.slice(1, -1).replaceAll("''", "'") };
	}
	if (LOOKALIKE.test(text)) return `!\`${text}\` reads as a different type in YAML`;
	if (/^[{&*!|>%@`,#\]}]|^[-?:](?:[ \t]|$)/.test(text)) {
		return `!\`${text[0]}\` at the start of a value is YAML syntax`;
	}
	if (/:(?:[ \t]|$)/.test(text)) return '!`: ` inside a value is YAML syntax';
	return { value: text };
}

/**
 * Plain values YAML 1.2's core schema reads as null, a boolean or a number, other than the
 * canonical forms `parseScalar` has already taken.
 */
const LOOKALIKE =
	/^(?:~|null|Null|NULL|true|True|TRUE|false|False|FALSE|[-+]?\d+|0o[0-7]+|0x[\da-fA-F]+|[-+]?(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][-+]?\d+)?|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$/;

/** Drops a ` #` comment that is outside quotes. */
function stripComment(text: string): string {
	let quote = '';
	for (let i = 0; i < text.length; i++) {
		const c = text[i]!;
		if (quote) {
			if (c === '\\' && quote === '"') i++;
			else if (c === quote) quote = '';
		} else if (c === '"' || c === "'") {
			if (i === 0 || /[\s[,]/.test(text[i - 1]!)) quote = c;
		} else if (c === '#' && (i === 0 || /[ \t]/.test(text[i - 1]!))) return text.slice(0, i).trim();
	}
	return text.trim();
}

/** Splits on commas outside quotes; `null` for an unclosed quote. */
function splitList(text: string): (string | null)[] {
	const items: (string | null)[] = [];
	let quote = '';
	let from = 0;
	for (let i = 0; i < text.length; i++) {
		const c = text[i]!;
		if (quote) {
			if (c === '\\' && quote === '"') i++;
			else if (c === quote) quote = '';
		} else if ((c === '"' || c === "'") && text.slice(from, i).trim() === '') quote = c;
		else if (c === ',') {
			items.push(text.slice(from, i));
			from = i + 1;
		}
	}
	items.push(quote ? null : text.slice(from));
	return items;
}

function unquotedPart(text: string): string {
	return text[0] === '"' || text[0] === "'" ? '' : text;
}
