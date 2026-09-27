/** @prose
 * # Inline pass
 *
 * Turns a leaf's content lines into inline nodes under the builder's current node, in one pass
 * (spec: Parser foundation). The block pass hands it the lines as source ranges with container
 * prefixes and outer whitespace already cut, so it never sees a `> ` or an item's indentation.
 *
 * The lines are joined into one string with `\n` between them, and every position in it maps
 * back to the source, so a node may span lines while its range stays exact. Atomic constructs
 * (code, math, expressions, autolinks, escapes, references, directives) are consumed where they
 * start, which is how they bind tighter than emphasis. Emphasis and link brackets are openers
 * that either close or stay text: the pass builds a linked list of items, and a match wraps the
 * items between opener and closer into one node, so nothing is read twice.
 */
import { type Attributes, type Builder, type NodeData, type NodeType, type Range } from './ast';
import { bareOnly, braceEnd, parseAttributes } from './attributes';
import { NAMED, unescape } from './chars';
import { element } from './elements';
import { memo, scanExpression, type Memo } from './expression';
import { type WarningCode } from './warnings';

/** Writes the inline nodes and returns their plain text, which a heading's id is made from. */
export function inline(b: Builder, source: string, lines: readonly Range[], cell = false): string {
	if (lines.length === 0) return '';
	const pass = new InlinePass(b, source, lines, cell);
	const list = pass.scan(0, pass.text.length);
	pass.emit(list);
	for (const [start, end] of pass.urls) b.warn('bare-url', start, end);
	return plainText(list.first, false);
}

/** @prose
 * ## Items
 *
 * What a scan produces, in a doubly linked list: text with its decoded value, delimiter runs and
 * brackets that may still become nodes (and are text if they don't), and finished nodes with
 * their children. Ranges are source offsets.
 */
interface Item {
	prev: Item | null;
	next: Item | null;
	start: number;
	end: number;
	/** The text this item renders as while it is text: decoded for text, raw for openers. */
	value: string;
	node?: NodeType;
	data?: unknown;
	attributes?: Attributes;
	first?: Item | null;
	/** A delimiter run's kind (`_1`, `*2`, …) or a bracket (`[`, `![`). */
	opener?: string;
	/** Creation order, which is also source order. */
	order: number;
	/** A bracket that can no longer make a link, because a link already closed inside it. */
	inactive?: boolean;
	/** A bracket's position in the joined text. */
	at?: number;
}

interface List {
	first: Item | null;
	last: Item | null;
}

/** @prose
 * ## Emphasis kinds
 *
 * A delimiter run's kind is its character and length. `_`, `**` and `~~` are the dialect's;
 * `*` is accepted where formatters write it (syntax.md: Emphasis); `__` and `~` are rejected
 * forms that are matched only to be reported. Runs of any other length are plain text.
 */
const KINDS: Record<string, NodeType> = {
	_1: 'emphasis',
	'*1': 'emphasis',
	'*2': 'strong',
	'~2': 'delete'
};
const REJECTED: Record<string, WarningCode> = {
	_2: 'underscore-strong',
	'~1': 'single-tilde',
	'*1': 'star-emphasis'
};

const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c);
const isWord = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);
const isPunct = (c: string | undefined) => c !== undefined && /[!-/:-@[-`{-~]/.test(c);
/** Unicode punctuation and symbols, which flanking treats alike. */
const isMark = (c: string | undefined) => c !== undefined && /[\p{P}\p{S}]/u.test(c);

class InlinePass {
	readonly b: Builder;
	readonly src: string;
	readonly lines: readonly Range[];
	readonly cell: boolean;
	/** The lines joined with `\n`, and where each line starts in it. */
	readonly text: string;
	readonly starts: number[] = [];
	order = 0;
	/** Backtick run lengths with no closing run left in the text. */
	readonly noCode = new Set<number>();
	noMath = false;
	/** Runs of dollars that found no closing run of the same length. */
	readonly noDollars = new Set<number>();
	/** `scanExpression`'s records by text, the joined text (`t`) or the source (`s`), and range end. */
	readonly memos = new Map<string, Memo>();
	/** `labelEnd`'s records by range end. */
	readonly labels = new Map<number, Map<number, number>>();
	/** `next`'s last search per token. */
	readonly found = new Map<string, { from: number; at: number }>();
	/** The last `braceEnd` search: from where, on which line, and what it found. */
	lastBrace = { from: -1, lineEnd: -1, close: -1 };
	/** Openers waiting for a closer, by kind, and link brackets. */
	stacks: Record<string, Item[]> = {};
	brackets: Item[] = [];
	/** Bare URLs, reported once the leaf is done unless a link turns out to hold them. */
	urls: [start: number, end: number][] = [];

	constructor(b: Builder, src: string, lines: readonly Range[], cell: boolean) {
		this.b = b;
		this.src = src;
		this.lines = lines;
		this.cell = cell;
		let text = '';
		for (const [i, line] of lines.entries()) {
			this.starts.push(text.length);
			text += src.slice(line.start, line.end) + (i < lines.length - 1 ? '\n' : '');
		}
		this.text = text;
	}

	memo(text: 't' | 's', end: number): Memo {
		const key = text + end;
		let record = this.memos.get(key);
		if (!record) this.memos.set(key, (record = memo()));
		return record;
	}

	/**
	 * The next `token` at or after `t`, or -1. The last search per token is kept, so asking again
	 * from before what it found, or after it found nothing, costs nothing.
	 */
	next(token: string, t: number): number {
		const last = this.found.get(token);
		if (last && t >= last.from && (last.at < 0 || t <= last.at)) return last.at;
		const at = this.text.indexOf(token, t);
		this.found.set(token, { from: t, at });
		return at;
	}

	/**
	 * The `]` that closes the label opening at `j`, with nested brackets balanced and escapes
	 * skipped, or -1 before `to`. Like `scanExpression`, one scan settles every `[` it passes: a
	 * later label starting at one of them closes where the scan's depth fell back below it.
	 */
	labelEnd(j: number, to: number): number {
		let closes = this.labels.get(to);
		if (!closes) this.labels.set(to, (closes = new Map()));
		const known = closes.get(j);
		if (known !== undefined) return known;
		const open: number[] = [];
		for (let k = j; k < to; k++) {
			const c = this.text[k];
			if (c === '\\') k++;
			else if (c === '[') open.push(k);
			else if (c === ']') {
				closes.set(open.pop()!, k);
				if (open.length === 0) return k;
			}
		}
		for (const k of open) closes.set(k, -1);
		return -1;
	}

	/** @prose
	 * ## Positions
	 *
	 * A position in the joined text maps to the source through its line. A `\n` between lines
	 * stands for the line's trailing whitespace and line ending, which `eol` finds, so a soft
	 * break's range never covers the next line's container prefix.
	 */
	line(t: number): number {
		let lo = 0;
		let hi = this.starts.length - 1;
		while (lo < hi) {
			const mid = (lo + hi + 1) >> 1;
			if (this.starts[mid]! <= t) lo = mid;
			else hi = mid - 1;
		}
		return lo;
	}

	at(t: number): number {
		const i = this.line(t);
		return this.lines[i]!.start + (t - this.starts[i]!);
	}

	/** The source offset for an end position, taken from the character before it. */
	to(t: number): number {
		if (t === 0) return this.lines[0]!.start;
		return this.at(t - 1) + 1;
	}

	/** Where the line ending after line `i` ends, trailing whitespace included. */
	eol(i: number): number {
		const { src } = this;
		let e = this.lines[i]!.end;
		while (src[e] === ' ' || src[e] === '\t') e++;
		if (src[e] === '\r') e++;
		if (src[e] === '\n') e++;
		return e;
	}

	/** @prose
	 * ## Scanning
	 *
	 * One loop over a range of the joined text, with a case per character that can open a
	 * construct. Everything else is gathered into text. A text directive's label is scanned
	 * again as its own range, with its own openers, so emphasis can't cross its brackets.
	 */
	scan(from: number, to: number): List {
		const saved = { stacks: this.stacks, brackets: this.brackets };
		this.stacks = {};
		this.brackets = [];
		const list: List = { first: null, last: null };
		const { text } = this;
		if (from === 0) this.referenceDefinition();
		let t = from;
		while (t < to) {
			const c = text[t]!;
			if (c === '\n') {
				const i = this.line(t);
				this.add(list, this.textItem(this.lines[i]!.end, this.eol(i), '\n'));
				t++;
			} else if (c === '\\') t = this.backslash(list, t, to);
			else if (c === '`') t = this.code(list, t, to);
			else if (c === '$')
				t = text[t + 1] === '{' ? this.expression(list, t, to) : this.math(list, t, to);
			else if (c === '<') t = this.angle(list, t, to);
			else if (c === '&') t = this.reference(list, t);
			else if (c === '[' || (c === '!' && text[t + 1] === '[')) t = this.open(list, t);
			else if (c === ']') t = this.close(list, t, to);
			else if (c === '_' || c === '*' || c === '~') t = this.delimiter(list, t, from, to);
			else if (c === ':' && this.directive(list, t, to)) t = this.directiveEnd;
			else if (c === ':' || c === '.' || c === '@') t = this.url(list, t, from, to);
			else if (c === '{') t = this.brace(list, t);
			else if (c === '"' || c === "'") t = this.quote(list, t, from);
			else if (c === '-') t = this.dashes(list, t, to);
			else {
				let e = t + 1;
				while (e < to && !SPECIAL.test(text[e]!)) e++;
				this.add(list, this.textItem(this.at(t), this.to(e), text.slice(t, e)));
				t = e;
			}
		}
		this.stacks = saved.stacks;
		this.brackets = saved.brackets;
		return list;
	}

	/** The joined text between two positions, with each line's trailing whitespace put back. */
	raw(t: number, e: number): string {
		let out = '';
		for (let i = this.line(t); t < e; i++) {
			const lineEnd = this.starts[i]! + (this.lines[i]!.end - this.lines[i]!.start);
			out += this.text.slice(t, Math.min(e, lineEnd));
			if (lineEnd >= e) break;
			let w = this.lines[i]!.end;
			while (this.src[w] === ' ' || this.src[w] === '\t') w++;
			out += this.src.slice(this.lines[i]!.end, w) + '\n';
			t = lineEnd + 1;
		}
		return out;
	}

	textItem(start: number, end: number, value: string): Item {
		return { prev: null, next: null, start, end, value, order: this.order++ };
	}

	nodeItem(
		node: NodeType,
		start: number,
		end: number,
		data?: unknown,
		first: Item | null = null
	): Item {
		return { ...this.textItem(start, end, ''), node, data, first };
	}

	add(list: List, item: Item): void {
		item.prev = list.last;
		item.next = null;
		if (list.last) list.last.next = item;
		else list.first = item;
		list.last = item;
	}

	/** Text straight from the source, extending the last text item when they touch. */
	plain(list: List, t: number, e: number, value = this.text.slice(t, e)): void {
		this.add(list, this.textItem(this.at(t), this.to(e), value));
	}

	/** @prose
	 * ## Escapes, breaks and references
	 *
	 * `\` before ASCII punctuation is that character, before a line ending it is a hard break,
	 * and before a space it is a non-breaking space. At the end of a line, spaces after the `\`
	 * are the line's trailing whitespace, gone before it is read, so `\ ⏎` is a hard break too:
	 * what the author sees, and what it becomes once a formatter strips the space. Anywhere else a
	 * `\` is itself. Numeric references decode, with U+FFFD for any code point HTML can't hold
	 * (`character`). A named one stays text and is reported, since markz has no entity table.
	 */
	backslash(list: List, t: number, to: number): number {
		const next = this.text[t + 1];
		if (next === '\n' && t + 1 < to) {
			const i = this.line(t);
			this.add(list, this.nodeItem('break', this.at(t), this.eol(i)));
			return t + 2;
		}
		if (next === ' ') {
			this.plain(list, t, t + 2, ' ');
			return t + 2;
		}
		if (isPunct(next) && t + 1 < to) {
			this.plain(list, t, t + 2, next);
			return t + 2;
		}
		this.plain(list, t, t + 1);
		return t + 1;
	}

	reference(list: List, t: number): number {
		const m = ENTITY.exec(this.text.slice(t, t + 40));
		if (!m) {
			this.plain(list, t, t + 1);
			return t + 1;
		}
		const e = t + m[0].length;
		if (m[3]) {
			this.report('named-reference', t, e, `named character reference \`${m[0]}\``);
			this.plain(list, t, e);
			return e;
		}
		const code = m[1] ? Number(m[1]) : parseInt(m[2]!, 16);
		this.plain(list, t, e, character(code));
		return e;
	}

	/** A paragraph opening with `[label]:` is a reference definition in GFM, or with `[^label]:`
	 * a footnote's. */
	referenceDefinition(): void {
		const m = /^\[(?:[^\]\\]|\\.)+\]:/.exec(this.text);
		if (!m) return;
		if (m[0][1] === '^') this.report('footnote', 0, m[0].length, 'footnote definition');
		else this.report('reference-link', 0, m[0].length, 'reference definition');
	}

	/** @prose
	 * ## Code, math and expressions
	 *
	 * These bind tightest. A code span closes on the next backtick run of the same length; its
	 * line endings become spaces, and one space is stripped from each end when both are there. In
	 * a table cell, `\|` is a `|` even here. Math is pandoc's `$…$`, and `${…}` is an expression
	 * found by brace matching. A scan that finds no closer records it, so the next opener of the
	 * same kind doesn't scan again.
	 */
	code(list: List, t: number, to: number): number {
		const { text } = this;
		let n = 1;
		while (text[t + n] === '`') n++;
		let j = t + n;
		if (!this.noCode.has(n)) {
			while (j < to) {
				const k = text.indexOf('`', j);
				if (k < 0 || k >= to) break;
				let m = 1;
				while (text[k + m] === '`') m++;
				if (m === n) {
					let value = this.raw(t + n, k).replace(/\n/g, ' ');
					if (/^ .*[^ ].* $|^ [^ ] $/s.test(value)) value = value.slice(1, -1);
					if (this.cell) value = value.replace(/\\\|/g, '|');
					this.add(list, this.nodeItem('inlineCode', this.at(t), this.to(k + n), { value }));
					return k + n;
				}
				j = k + m;
			}
			if (to === this.text.length) this.noCode.add(n);
		}
		this.plain(list, t, t + n);
		return t + n;
	}

	math(list: List, t: number, to: number): number {
		const { text } = this;
		const next = text[t + 1];
		let n = 1;
		while (text[t + n] === '$') n++;
		// Math is `$x$` in a line and a `$$` block on lines of its own. `$$x$$` in a line and
		// GitHub's `` $`x`$ `` are math elsewhere; here they stay text and are reported, and a run of
		// dollars never opens `$x$`, so `$$x$` doesn't lose a dollar silently.
		const other =
			n > 1 ? this.dollars(t, n, to) : next === '`' ? text.indexOf('`$', t + 2) + 2 : -1;
		if (other > t + n && other <= to) {
			this.report('math-delimiter', t, other);
			this.plain(list, t, other);
			return other;
		}
		if (n > 1) {
			this.plain(list, t, t + n);
			return t + n;
		}
		if (!this.noMath && !isSpace(next)) {
			// The first unescaped `$` closes the math or ends the attempt: TeX here holds no `$`.
			let j = t + 2;
			while (j < to && text[j] !== '$') j += text[j] === '\\' ? 2 : 1;
			if (j < to && !isSpace(text[j - 1]) && !/\d/.test(text[j + 1] ?? '')) {
				const range = { start: this.at(t + 1), end: this.to(j) };
				const data: NodeData['math'] = { block: false, value: text.slice(t + 1, j), range };
				this.add(list, this.nodeItem('math', this.at(t), this.to(j + 1), data));
				return j + 1;
			}
			// With no `$` left at all, no later opener can close either.
			if (j >= to && to === this.text.length) this.noMath = true;
		}
		this.plain(list, t, t + 1);
		return t + 1;
	}

	/** Where a run of `n` dollars closes on a run of the same length, or -1. */
	dollars(t: number, n: number, to: number): number {
		const { text } = this;
		if (this.noDollars.has(n)) return -1;
		for (let j = t + n; j < to;) {
			const k = text.indexOf('$', j);
			if (k < 0 || k >= to) break;
			let m = 1;
			while (text[k + m] === '$') m++;
			if (m === n) return k + n;
			j = k + m;
		}
		if (to === text.length) this.noDollars.add(n);
		return -1;
	}

	expression(list: List, t: number, to: number): number {
		const e = scanExpression(this.text, t, to, this.memo('t', to));
		if (e < 0) {
			this.plain(list, t, t + 1);
			return t + 1;
		}
		const data: NodeData['expression'] = {
			code: this.text.slice(t + 2, e - 1),
			range: { start: this.at(t + 2), end: this.to(e - 1) }
		};
		this.add(list, this.nodeItem('expression', this.at(t), this.to(e), data));
		return e;
	}

	/** @prose
	 * ## Angle brackets
	 *
	 * `<scheme:…>` and `<address@host>` are autolinks. Anything shaped like an HTML tag, comment
	 * or declaration is raw HTML, which the dialect cuts: the whole tag stays text, so nothing
	 * inside it is read as Markdown, and it is reported. A capitalised tag is reported as MDX's
	 * JSX, and a relative autolink (`</docs/a>`), which has no scheme, as itself. Any other `<` is
	 * text.
	 */
	angle(list: List, t: number, to: number): number {
		const { text } = this;
		for (const [re, email] of [
			[AUTOLINK, false],
			[EMAIL, true]
		] as const) {
			re.lastIndex = t;
			const m = re.exec(text);
			if (m && t + m[0].length <= to) {
				const e = t + m[0].length;
				const url = m[1]!;
				const data: NodeData['link'] = {
					destination: email ? `mailto:${url}` : url,
					title: null,
					destinationRange: { start: this.at(t + 1), end: this.to(e - 1) },
					expressions: [],
					autolink: true
				};
				const label = this.textItem(this.at(t + 1), this.to(e - 1), url);
				this.add(list, this.nodeItem('link', this.at(t), this.to(e), data, label));
				return e;
			}
		}
		// Every tag, comment and declaration ends in its own closer; with none ahead, skip the regex,
		// whose lazy forms would otherwise search to the end from every `<`.
		const closer = text.startsWith('<!--', t)
			? '-->'
			: text[t + 1] === '?'
				? '?>'
				: text.startsWith('<![CDATA[', t)
					? ']]>'
					: '>';
		const close = this.next(closer, t + 2);
		HTML.lastIndex = t;
		const m = close >= 0 && close < to && HTML.exec(text);
		if (m && t + m[0].length <= to) {
			const e = t + m[0].length;
			// A PascalCase tag is a JSX component; `<DIV>` is still HTML.
			this.report(/^<\/?[A-Z][a-z]/.test(m[0]) ? 'jsx' : 'raw-html', t, e);
			this.plain(list, t, e);
			return e;
		}
		// What opens a GFM HTML block, at the start of a line, even with no complete tag.
		OPENER.lastIndex = t;
		const o = (t === 0 || text[t - 1] === '\n') && OPENER.exec(text);
		if (o && t + o[0].length <= to) {
			const e = t + o[0].length;
			this.report('raw-html', t, e);
			this.plain(list, t, e);
			return e;
		}
		RELATIVE.lastIndex = t;
		const r = RELATIVE.exec(text);
		if (r && t + r[0].length <= to) {
			const e = t + r[0].length;
			this.report('relative-autolink', t, e);
			this.plain(list, t, e);
			return e;
		}
		this.plain(list, t, t + 1);
		return t + 1;
	}

	/** @prose
	 * ## Emphasis
	 *
	 * djot's rules, not CommonMark's: a run opens unless whitespace follows it and closes unless
	 * whitespace precedes it, and `_` never opens or closes inside a word. A closer takes the
	 * nearest open run of its own kind, with no rule of 3 and no splitting of runs; openers of
	 * other kinds between them are left as text. `*` is kept only inside `_…_` or touching a
	 * letter or digit, the two places formatters write it. Anywhere else a `*` pair, like a `__`
	 * or `~` pair, stays text and is reported.
	 */
	delimiter(list: List, t: number, from: number, to: number): number {
		const { text } = this;
		const ch = text[t]!;
		let n = 1;
		while (text[t + n] === ch) n++;
		const kind = `${ch}${n}`;
		const item = {
			...this.textItem(this.at(t), this.to(t + n), text.slice(t, t + n)),
			opener: kind
		};
		this.add(list, item);
		if (!KINDS[kind] && !REJECTED[kind]) return t + n;
		const before = t > from ? text[t - 1] : undefined;
		const after = t + n < to ? text[t + n] : undefined;
		// CommonMark's flanking: a run can't open before whitespace, or before punctuation that
		// follows a letter, and the mirror image for closing. `_` also can't open or close
		// inside a word.
		const left = !isSpace(after) && !(isMark(after) && !isSpace(before) && !isMark(before));
		const right = !isSpace(before) && !(isMark(before) && !isSpace(after) && !isMark(after));
		const canOpen = ch === '_' ? left && (!right || isMark(before)) : left;
		const canClose = ch === '_' ? right && (!left || isMark(after)) : right;
		const stack = (this.stacks[kind] ??= []);
		const opener = stack.at(-1);
		const bottom = this.brackets.at(-1)?.order ?? -1;
		if (canClose && opener && opener.order > bottom) {
			this.match(list, opener, item, kind, t + n, to);
			return t + n;
		}
		if (canOpen) stack.push(item);
		return t + n;
	}

	match(list: List, opener: Item, closer: Item, kind: string, after: number, to: number): void {
		this.stacks[kind]!.pop();
		for (const [k, stack] of Object.entries(this.stacks)) {
			if (k === kind) continue;
			while (stack.length && stack.at(-1)!.order > opener.order) stack.pop();
		}
		let rejected = !KINDS[kind];
		if (kind === '*1') {
			const inside = (this.stacks._1 ?? []).some((o) => o.order < opener.order);
			const touching =
				isWord(this.charBefore(opener)) || isWord(after < to ? this.text[after] : undefined);
			rejected = !inside && !touching;
		}
		if (rejected) {
			this.b.warn(REJECTED[kind]!, opener.start, closer.end);
			return;
		}
		this.wrap(list, opener, closer, this.nodeItem(KINDS[kind]!, opener.start, closer.end));
	}

	/** The source character just before an item, when it is on the same line. */
	charBefore(item: Item): string | undefined {
		return item.prev && item.prev.end === item.start ? item.prev.value.at(-1) : undefined;
	}

	/** Replaces `opener` … `closer` (inclusive) with `node`, whose children are the items between. */
	wrap(list: List, opener: Item, closer: Item, node: Item): void {
		const inner = opener.next === closer ? null : opener.next;
		if (inner) {
			inner.prev = null;
			closer.prev!.next = null;
		}
		node.first = inner;
		node.prev = opener.prev;
		node.next = closer.next;
		if (node.prev) node.prev.next = node;
		else list.first = node;
		if (node.next) node.next.prev = node;
		else list.last = node;
	}

	/** @prose
	 * ## Links and images
	 *
	 * `[` and `![` wait on the bracket stack. At `]`, only the inline form `(destination "title")`
	 * makes a link or image, optionally with `{…}` directly after the `)`. Emphasis openers inside
	 * the brackets can't close outside them, and once a link closes, the brackets around it can't
	 * make links. `[x][y]` and `[x][]` are reference links and `[^x]` is a footnote, which the
	 * dialect cuts: they stay text and are reported. `[x]` alone is just text, since `[sic]` is
	 * prose; its definition, if it has one, is what gets reported.
	 */
	open(list: List, t: number): number {
		const n = this.text[t] === '!' ? 2 : 1;
		const item = {
			...this.textItem(this.at(t), this.to(t + n), this.text.slice(t, t + n)),
			opener: n === 2 ? '![' : '[',
			at: t
		};
		this.add(list, item);
		this.brackets.push(item);
		return t + n;
	}

	close(list: List, t: number, to: number): number {
		const bracket = this.brackets.pop();
		const tail = this.text[t + 1] === '(' ? this.destination(t + 1, to) : null;
		if (!bracket || bracket.inactive || !tail) {
			if (bracket && !tail) this.referenceLink(bracket, t, to);
			this.plain(list, t, t + 1);
			return t + 1;
		}
		this.urls = this.urls.filter(([start]) => start < bracket.start);
		for (const m of this.text.slice(t + 1, tail.end).matchAll(NAMED)) {
			const at = t + 1 + m.index;
			this.report('named-reference', at, at + m[0].length, `named character reference \`${m[0]}\``);
		}
		for (const stack of Object.values(this.stacks)) {
			while (stack.length && stack.at(-1)!.order > bracket.order) stack.pop();
		}
		const image = bracket.opener === '![';
		const destination: NodeData['link'] = {
			destination: tail.destination,
			title: tail.title,
			destinationRange: { start: this.at(tail.destStart), end: this.to(tail.destEnd) },
			expressions: tail.expressions.map(([s, e]) => ({ start: this.at(s), end: this.to(e) })),
			autolink: false
		};
		let end = tail.end;
		const node = this.nodeItem(image ? 'image' : 'link', bracket.start, this.to(end), destination);
		const closer = this.textItem(this.at(t), this.to(t + 1), ']');
		this.add(list, closer);
		this.wrap(list, bracket, closer, node);
		if (image) {
			const { autolink: _, ...rest } = destination;
			node.data = { ...rest, alt: plainText(node.first) };
		} else for (const b of this.brackets) if (b.opener === '[') b.inactive = true;
		if (this.text[end] === '{') {
			const line = this.line(end);
			const lineEnd = this.lines[line]!.end;
			const attributes = parseAttributes(
				this.src,
				this.at(end),
				lineEnd,
				false,
				this.memo('s', lineEnd)
			);
			if (attributes) {
				node.attributes = attributes;
				end += attributes.end - attributes.start;
				node.end = attributes.end;
			} else this.attributeSyntax(end, lineEnd);
		}
		return end;
	}

	/** A bracket that made no link: `[x][y]` and `[x][]` are reference links, `[^x]` a footnote. */
	referenceLink(bracket: Item, t: number, to: number): void {
		const { text } = this;
		// `![^1]` is a `!` before a footnote in GFM, not an image.
		const at = bracket.at! + bracket.opener!.length - 1;
		// A `[^1]:` anywhere but the paragraph's start (already reported) is a definition too: GFM
		// lets one interrupt a paragraph, or sit inside another.
		const definition = text[t + 1] === ':';
		if (text[at + 1] === '^' && t > at + 2 && (!definition || at > 0)) {
			this.report('footnote', at, t + 1, `footnote ${definition ? 'definition' : 'reference'}`);
		} else if (text[t + 1] === '[') {
			const e = text.indexOf(']', t + 2);
			if (e >= 0 && e < to && !text.slice(t + 2, e).includes('[')) {
				this.report('reference-link', at, e + 1);
			}
		}
	}

	/**
	 * The `(…)` after a `]`: a destination, `<…>` or bare with balanced parentheses, then an
	 * optional title after whitespace. Whitespace may include one line ending.
	 */
	destination(
		at: number,
		to: number
	): {
		end: number;
		destination: string;
		title: string | null;
		destStart: number;
		destEnd: number;
		expressions: [number, number][];
	} | null {
		const { text } = this;
		const space = (i: number) => {
			let newlines = 0;
			while (i < to && (text[i] === ' ' || text[i] === '\t' || text[i] === '\n')) {
				if (text[i] === '\n' && ++newlines > 1) return -1;
				i++;
			}
			return i;
		};
		let i = space(at + 1);
		if (i < 0) return null;
		let destStart = i;
		let destEnd = i;
		const expressions: [number, number][] = [];
		if (text[i] === '<') {
			let j = i + 1;
			while (j < to && text[j] !== '>' && text[j] !== '\n' && text[j] !== '<')
				j += text[j] === '\\' ? 2 : 1;
			if (text[j] !== '>' || j >= to) return null;
			destStart = i + 1;
			destEnd = j;
			i = j + 1;
		} else {
			let depth = 0;
			let j = i;
			while (j < to) {
				const c = text[j]!;
				if (c === '\\' && isPunct(text[j + 1])) j += 2;
				else if (c === '$' && text[j + 1] === '{') {
					const e = scanExpression(text, j, to, this.memo('t', to));
					if (e < 0) break;
					expressions.push([j, e]);
					j = e;
				} else if (c === '(') {
					if (++depth > 32) return null;
					j++;
				} else if (c === ')') {
					if (depth === 0) break;
					depth--;
					j++;
				} else if (c <= ' ' || c === '\u007f') break;
				else j++;
			}
			if (depth !== 0) return null;
			destEnd = j;
			i = j;
		}
		const afterDest = i;
		i = space(i);
		if (i < 0) return null;
		let title: string | null = null;
		const quote = text[i];
		if (i > afterDest && (quote === '"' || quote === "'" || quote === '(')) {
			const close = quote === '(' ? ')' : quote;
			let j = i + 1;
			while (j < to && text[j] !== close) {
				if (text[j] === '\\') j++;
				else if (quote === '(' && text[j] === '(') return null;
				else if (text[j] === '\n' && text[j + 1] === '\n') return null;
				j++;
			}
			if (j >= to) return null;
			title = decode(text.slice(i + 1, j));
			i = space(j + 1);
			if (i < 0) return null;
		}
		if (text[i] !== ')') return null;
		return {
			end: i + 1,
			destination: decode(text.slice(destStart, destEnd)),
			title,
			destStart,
			destEnd,
			expressions
		};
	}

	/** @prose
	 * ## Text directives
	 *
	 * `:name[label]`, `:name{…}` or both, as in micromark-extension-directive: not straight after
	 * another `:`, and with a label or attributes, so a colon in prose is never a directive. The
	 * label's brackets balance, and it is scanned as inline content of its own. The name is the
	 * element it writes, an inline element or a custom element. Any other name is reported and the
	 * whole `:name[…]{…}` stays text, nothing in it read as other syntax, as does a `::name[…]` in
	 * a line: the block pass reported it if it was a line of its own.
	 */
	directiveEnd = 0;

	directive(list: List, t: number, to: number): boolean {
		const { text } = this;
		if (text[t - 1] === ':') return false;
		let n = t;
		while (text[n] === ':') n++;
		NAME.lastIndex = n;
		const m = NAME.exec(text);
		if (!m) return false;
		let j = n + m[0].length;
		let label: [number, number] | null = null;
		if (text[j] === '[') {
			const k = this.labelEnd(j, to);
			if (k < 0) return false;
			label = [j + 1, k];
			j = k + 1;
		}
		let attributes: Attributes | null = null;
		if (text[j] === '{') {
			const lineEnd = this.lines[this.line(j)]!.end;
			attributes = parseAttributes(this.src, this.at(j), lineEnd, false, this.memo('s', lineEnd));
			if (attributes) j += attributes.end - attributes.start;
			else if (n === t + 1) this.attributeSyntax(j, lineEnd);
		}
		if (!label && !attributes) return false;
		// A leaf or container shape in a line, or a name that isn't an inline element, is text.
		if (n > t + 1 || !element(m[0], true)) {
			if (n === t + 1) this.report('directive-name', t, j, `\`${m[0]}\` is not an element name`);
			this.plain(list, t, j);
			this.directiveEnd = j;
			return true;
		}
		const data: NodeData['directive'] = {
			kind: 'text',
			name: m[0],
			label: label && {
				start: this.at(label[0]),
				end: this.to(label[1]),
				value: unescape(text.slice(label[0], label[1]))
			}
		};
		const kids = label ? this.scan(label[0], label[1]).first : null;
		const node = this.nodeItem('directive', this.at(t), this.to(j), data, kids);
		if (attributes) node.attributes = attributes;
		this.add(list, node);
		this.directiveEnd = j;
		return true;
	}

	/** @prose
	 * ## Bare URLs and stray attributes
	 *
	 * GFM links `https://…`, `www.…` and `me@example.com` in running text; markz keeps them as
	 * text and reports each one GFM would link, so a reader never loses a link silently. Each is
	 * found at its `:`, `.` or `@`, looking back at text already scanned, and taken whole as text so
	 * nothing inside it is read as emphasis or punctuation. Which ones count is GFM's rule, held to
	 * micromark-extension-gfm-autolink-literal's suite: the character before (`www.` only after
	 * space, `(`, `*`, `_`, `[`, `]` or `~`; a protocol after anything but a letter), a domain with
	 * no `_` in its last two segments, an email domain ending in a letter, and nothing after a `[`
	 * that hasn't closed. The report's end is approximate: where GFM trims a URL's tail is the part
	 * of its rule the dialect cuts. The reports wait until the leaf is done, and a link that closes
	 * drops the ones inside it.
	 *
	 * A `{…}` that parses as attributes but sits where none are allowed (after a word, code,
	 * emphasis or `[text]`) stays text and is reported. Any other brace is prose.
	 */
	url(list: List, t: number, from: number, to: number): number {
		const { text } = this;
		const c = text[t]!;
		const back = text.slice(Math.max(from, t - 64), t);
		let start = -1;
		let end = t;
		// GFM links nothing after a `[` that hasn't closed yet.
		if (this.brackets.length) start = -1;
		else if (c === ':') {
			const m = /(?:^|[^A-Za-z])(https?)$/i.exec(back);
			if (m && text.startsWith('//', t + 1) && domain(text, t + 3) > t + 3) {
				start = t - m[1]!.length;
			}
		} else if (c === '.') {
			if (/(?:^|[ \t\n(*_[\]~])www$/i.test(back) && t + 1 < to && domain(text, t - 3) > 0) {
				start = t - 3;
			}
		} else {
			const m = /(?:^|[^\w.+/-])([\w.+-]+)$/.exec(back);
			EMAIL_DOMAIN.lastIndex = t + 1;
			if (m && EMAIL_DOMAIN.test(text) && /[A-Za-z]/.test(text[EMAIL_DOMAIN.lastIndex - 1]!)) {
				start = t - m[1]!.length;
				end = EMAIL_DOMAIN.lastIndex;
			}
		}
		if (start < 0) {
			if (c === '.') return this.dashes(list, t, to);
			this.plain(list, t, t + 1);
			return t + 1;
		}
		if (c !== '@') {
			while (end < to && !/[\s<]/.test(text[end]!)) end++;
			// Trailing punctuation belongs to the sentence, and a `)` only when unbalanced.
			for (;;) {
				const last = text[end - 1]!;
				const url = text.slice(start, end);
				if (/[?!.,:*_~'"]/.test(last)) end--;
				else if (last === ')' && url.split(')').length > url.split('(').length) end--;
				else break;
			}
			// GFM links `www.!` as `www`; the report keeps the `.` so the scan moves on.
			end = Math.max(end, t + 1);
		}
		end = Math.min(end, to);
		this.urls.push([this.at(start), this.to(end)]);
		this.plain(list, t, end);
		return end;
	}

	brace(list: List, t: number): number {
		const before = this.text[t - 1];
		const lineEnd = this.lines[this.line(t)]!.end;
		const attributes =
			before !== undefined && !/\s/.test(before)
				? parseAttributes(this.src, this.at(t), lineEnd, false, this.memo('s', lineEnd))
				: null;
		if (!attributes || bareOnly(this.src, attributes)) {
			this.plain(list, t, t + 1);
			return t + 1;
		}
		const e = t + attributes.end - attributes.start;
		this.report('inline-attributes', t, e);
		this.plain(list, t, e);
		return e;
	}

	/** @prose
	 * ## Smart punctuation
	 *
	 * Straight quotes curl by the character before them: at the start, after whitespace, an
	 * opening bracket, a dash, another quote or an emphasis marker they open, and anywhere else
	 * they close. `--` is an en dash and `---` an em dash; a longer run is split into em and en
	 * dashes with the same count of hyphens. `...` is an ellipsis. The text value holds the
	 * typographic character, and the range still covers what was typed.
	 */
	quote(list: List, t: number, from: number): number {
		const c = this.text[t]!;
		const before = t > from ? this.text[t - 1] : undefined;
		const opens = isSpace(before) || /[([{\-–—"'_*~]/.test(before!);
		const value = c === '"' ? (opens ? '“' : '”') : opens ? '‘' : '’';
		this.plain(list, t, t + 1, value);
		return t + 1;
	}

	dashes(list: List, t: number, to: number): number {
		const { text } = this;
		const c = text[t]!;
		let n = 1;
		while (t + n < to && text[t + n] === c) n++;
		let value: string;
		if (c === '.') value = '…'.repeat(Math.floor(n / 3)) + '.'.repeat(n % 3);
		else if (n === 1) value = '-';
		else {
			let em = Math.floor(n / 3);
			while ((n - 3 * em) % 2 !== 0) em--;
			value = '—'.repeat(em) + '–'.repeat((n - 3 * em) / 2);
		}
		this.plain(list, t, t + n, value);
		return t + n;
	}

	/** A `{…}` where attributes attach that doesn't parse as them stays text, and is reported. */
	attributeSyntax(t: number, lineEnd: number): void {
		// A later `{` before the `}` last found, or with none left on the line, has the same answer.
		const at = this.at(t);
		const last = this.lastBrace;
		const close =
			lineEnd === last.lineEnd && at > last.from && (last.close < 0 || at < last.close)
				? last.close
				: braceEnd(this.src, at, lineEnd);
		this.lastBrace = { from: at, lineEnd, close };
		if (close >= 0) this.b.warn('attribute-syntax', this.at(t), close);
	}

	report(code: WarningCode, t: number, e: number, message?: string): void {
		this.b.warn(code, this.at(t), this.to(e), message);
	}

	/** @prose
	 * ## Emitting
	 *
	 * The finished list becomes nodes under the builder's current node. Unmatched openers are
	 * text, and neighbouring text that touches in the source merges into one text node, so a
	 * paragraph without a prefix between its lines is usually one node. An image's description
	 * becomes its `alt` and has no child nodes.
	 */
	emit(list: List): void {
		this.emitFrom(list.first);
	}

	emitFrom(first: Item | null): void {
		let pending: { start: number; end: number; value: string } | null = null;
		const flush = () => {
			if (pending && pending.value)
				this.b.leaf('text', pending.start, pending.end, { value: pending.value });
			pending = null;
		};
		for (let item = first; item; item = item.next) {
			if (!item.node) {
				if (pending && pending.end === item.start) {
					pending.end = item.end;
					pending.value += item.value;
				} else {
					flush();
					pending = { start: item.start, end: item.end, value: item.value };
				}
				continue;
			}
			flush();
			const node = (this.b.open as (type: NodeType, start: number, data?: unknown) => number)(
				item.node,
				item.start,
				item.data
			);
			if (item.attributes) this.b.setAttributes(node, item.attributes);
			if (item.node !== 'image') this.emitFrom(item.first ?? null);
			this.b.close(item.end);
		}
		flush();
	}
}

/** Characters that start a case in `scan`; everything else is plain text. */
const SPECIAL = /[\n\\`$<&[\]!_*~:"'\-.@{]/;
const ENTITY = /^&(?:#(\d{1,7})|#[xX]([\da-fA-F]{1,6})|([A-Za-z][A-Za-z\d]{1,31}));/;
const NAME = /[A-Za-z][\w-]*/y;
/** An email's domain: ASCII segments, a `.` counting only before a letter or digit. */
const EMAIL_DOMAIN = /[\w-]+(?:\.(?=[A-Za-z\d])[\w-]+)+/y;

/**
 * Where a URL's domain ends, as GFM reads it: at whitespace or punctuation other than `-`, `.`
 * and `_`, with trailing `.` and `_` left to the sentence. Any letter counts (`www.點看.com`).
 * Returns -1 when an `_` sits in the last two segments, which GFM doesn't link.
 */
function domain(text: string, from: number): number {
	let end = from;
	while (end < text.length && /[-._]|[^\s\p{P}\p{S}\p{Cc}]/u.test(text[end]!)) end++;
	while (end > from && /[._]/.test(text[end - 1]!)) end--;
	return text.slice(from, end).split('.').slice(-2).join('').includes('_') ? -1 : end;
}
const RELATIVE = /<\.{0,2}\/[^\s<>]*>/y;
const OPENER = /<(?:\/?[A-Za-z][A-Za-z\d-]*(?=[\s/>]|$)|\?|![A-Z]|!\[CDATA\[)/y;
const AUTOLINK = /<([A-Za-z][A-Za-z\d+.-]{1,31}:[^\s<>]*)>/y;
const EMAIL =
	/<([\w.!#$%&'*+/=?^`{|}~-]+@[A-Za-z\d](?:[A-Za-z\d-]{0,61}[A-Za-z\d])?(?:\.[A-Za-z\d](?:[A-Za-z\d-]{0,61}[A-Za-z\d])?)*)>/y;
const HTML =
	/<(?:[A-Za-z][A-Za-z\d-]*(?:\s+[A-Za-z_:][\w.:-]*(?:\s*=\s*(?:[^\s"'=<>`]+|'[^']*'|"[^"]*"))?)*\s*\/?>|\/[A-Za-z][A-Za-z\d-]*\s*>|!--(?:-?>|[\s\S]*?-->)|\?[\s\S]*?\?>|![A-Za-z][^>]*>|!\[CDATA\[[\s\S]*?\]\]>)/y;

/**
 * The character a numeric reference names, or U+FFFD where HTML has none to give: zero,
 * surrogates, past U+10FFFF, controls other than whitespace, and noncharacters. micromark's rule.
 */
function character(code: number): string {
	const invalid =
		code < 9 ||
		code === 11 ||
		(code > 13 && code < 32) ||
		(code > 126 && code < 160) ||
		(code > 0xd7ff && code < 0xe000) ||
		(code > 0xfdcf && code < 0xfdf0) ||
		(code & 0xfffe) === 0xfffe ||
		code > 0x10ffff;
	return String.fromCodePoint(invalid ? 0xfffd : code);
}

/** Escapes and numeric references decoded, for a destination, a title or a fence's info string. */
export function decode(text: string): string {
	return unescape(text).replace(/&#(?:(\d{1,7})|[xX]([\da-fA-F]{1,6}));/g, (_, d, h) => {
		const code = d ? Number(d) : parseInt(h, 16);
		return character(code);
	});
}

/**
 * The plain text of a list of items: an image's `alt`, or a heading's text for its id, which
 * leaves images out.
 */
function plainText(first: Item | null | undefined, images = true): string {
	let out = '';
	for (let item = first; item; item = item.next) {
		if (item.node === 'image') out += images ? (item.data as NodeData['image']).alt : '';
		else if (item.node === 'inlineCode') out += (item.data as NodeData['inlineCode']).value;
		else if (item.node === 'break') out += '\n';
		else if (item.node) out += plainText(item.first, images);
		else out += item.value;
	}
	return out;
}
