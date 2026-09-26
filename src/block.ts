/** @prose
 * # Block pass
 *
 * Source lines to containers and leaves, in one pass over the lines (spec: Parser foundation). It
 * keeps a stack of open containers (blockquotes, lists, list items, container directives) and at
 * most one open leaf. Each line first walks the stack, letting each container consume its prefix;
 * whatever is left either continues the open leaf or starts new blocks. Every block construct in
 * `syntax.md` is a case here, and so is every rejected one: a setext underline, indented code, a
 * `~~~` fence or a lazy line is recognised where it is met, stays text, and adds a warning.
 *
 * Leaves with inline content (paragraphs, headings, table cells, leaf-directive labels) hand
 * their lines to the inline pass as source ranges. A paragraph's lines are held until it closes,
 * because the next line can still turn its last line into a table header; nothing is read twice.
 */
import { type Attributes, type Builder, type NodeId, type Range, type Align } from './ast';
import { parseAttributes } from './attributes';
import { isSpace, NAMED, NAMED_INSTEAD, unescape } from './chars';
import { inline } from './inline';
import { parseMetadata } from './metadata';

export function blocks(b: Builder, source: string, start: number): void {
	new BlockParser(b, source).run(start);
}

interface Container {
	kind: 'document' | 'blockquote' | 'list' | 'listItem' | 'directive';
	node: NodeId;
	/** Where the node ends so far: its last marker or its last child. */
	end: number;
	/** Direct children closed so far. */
	children: number;
	/** A blank line was seen since the last line with content. */
	blank: boolean;
	/** listItem: the content column, relative to the item's container. */
	indent: number;
	/** listItem: false while an item that opened on an empty line has nothing in it. */
	filled: boolean;
	/** directive: the number of colons in the opening fence. */
	fence: number;
	/** list */
	ordered: boolean;
	marker: string;
	start: number;
	tight: boolean;
}

type Leaf =
	| { kind: 'paragraph'; lines: Range[]; attributes: Attributes | undefined }
	| {
			kind: 'fence' | 'math';
			start: number;
			end: number;
			indent: number;
			ticks: number;
			info: string;
			body: Range | null;
			value: string;
			attributes: Attributes | undefined;
	  }
	| { kind: 'comment'; start: number; end: number }
	| { kind: 'table'; columns: number; end: number };

/** Block-attribute lines waiting for the block they decorate. */
interface Pending {
	attributes: Attributes;
	lines: Range[];
	depth: number;
}

const BULLET = /[-*+]/;

/** What `listItem` did: nothing, opened an item with content after it, or an empty one. */
const NONE_OPENED = 0;
const OPENED = 1;
const OPENED_EMPTY = 2;

class BlockParser {
	readonly b: Builder;
	readonly src: string;
	readonly stack: Container[] = [];
	leaf: Leaf | null = null;
	pending: Pending | null = null;
	/** Every heading id so far, explicit or generated. */
	readonly ids = new Set<string>();

	// The line being read, and a cursor into it. `tab` is how many columns of the tab at `pos` are
	// still unread, when a container prefix ended in the middle of one.
	lineEnd = 0;
	pos = 0;
	col = 0;
	tab = 0;

	constructor(b: Builder, src: string) {
		this.b = b;
		this.src = src;
	}

	get top(): Container {
		return this.stack[this.stack.length - 1]!;
	}

	run(start: number): void {
		this.stack.push(container('document', this.b.current, start));
		let at = this.metadata(start);
		const { src } = this;
		while (at < src.length) {
			let end = at;
			while (end < src.length && src[end] !== '\n' && src[end] !== '\r') end++;
			this.line(at, end);
			at = end < src.length ? end + (src[end] === '\r' && src[end + 1] === '\n' ? 2 : 1) : end;
		}
		this.closeLeaf();
		while (this.stack.length > 1) this.closeContainer();
		this.flushPending(1);
	}

	/** @prose
	 * ## Metadata
	 *
	 * A `---` line at the very start opens a metadata block, and the next `---` line closes it. The
	 * closing line is found by one forward scan, and every line between must look like metadata
	 * (`key:`, a comment, an indented line or a blank one), with at least one key. Otherwise the first line is an ordinary
	 * thematic break and the document is read from there, so a page that opens with a rule never
	 * loses its content to a metadata block. A closed `+++` block is TOML, which stays text and is
	 * reported.
	 */
	metadata(start: number): number {
		const { src } = this;
		const toml = /\+\+\+[ \t]*(?:\r\n|\r|\n)[^]*?^\+\+\+[ \t]*$/my;
		toml.lastIndex = start;
		if (toml.test(src)) {
			this.report(start, toml.lastIndex, 'TOML metadata', 'a `---` metadata block');
		}
		const first = /---[ \t]*(?:\r\n|\r|\n)/y;
		first.lastIndex = start;
		if (!first.test(src)) return start;
		const bodyStart = first.lastIndex;
		const close = /^---[ \t]*$/gm;
		close.lastIndex = bodyStart;
		const match = close.exec(src);
		if (!match) return start;
		const end = match.index + match[0].length;
		let bodyEnd = match.index;
		if (bodyEnd > bodyStart)
			bodyEnd -= src[bodyEnd - 2] === '\r' && src[bodyEnd - 1] === '\n' ? 2 : 1;
		// Every line must look like metadata, and one must be a key: `# Title` alone is a heading.
		const lines = src.slice(bodyStart, bodyEnd).split(/\r\n|\r|\n/);
		const key = (l: string) => /^[A-Za-z_][\w-]*:(?:[ \t]|$)/.test(l);
		if (!lines.some(key) || !lines.every((l) => key(l) || /^(?:$|#|[ \t])/.test(l))) return start;
		const value = parseMetadata(src, bodyStart, bodyEnd, (d) => this.b.warn(d));
		this.b.leaf('metadata', start, end, { value, range: { start: bodyStart, end: bodyEnd } });
		this.top.children++;
		this.top.end = end;
		let next = end;
		if (src[next] === '\r') next++;
		if (src[next] === '\n') next++;
		return next;
	}

	/** @prose
	 * ## A line
	 *
	 * Containers match first, each consuming its prefix: `>` for a blockquote, the content
	 * indentation for a list item. A list always matches, and ends when a line inside it isn't an
	 * item. A container directive matches every line but its closing fence, and the outermost one
	 * that fence can close takes it, which is micromark's rule too: an inner directive nests with a
	 * shorter fence.
	 *
	 * A fence, math block or comment that is still open takes the rest of the line. Otherwise,
	 * when a container didn't match, it closes. In CommonMark a paragraph line there would
	 * continue lazily; markz starts a new paragraph and reports the lazy line.
	 */
	line(start: number, end: number): void {
		this.pos = start;
		this.col = 0;
		this.tab = 0;
		this.lineEnd = end;
		const { stack, src } = this;

		let matched = 1;
		for (; matched < stack.length; matched++) {
			const c = stack[matched]!;
			if (c.kind === 'blockquote') {
				const { cols, next } = this.indent();
				if (cols > 3 || src[next] !== '>') break;
				this.skipTo(next);
				this.pos++;
				this.col++;
				c.end = this.pos;
				if (isSpace(src.charCodeAt(this.pos))) this.advance(1);
			} else if (c.kind === 'listItem') {
				if (this.blank()) {
					if (!c.filled) break;
				} else {
					if (this.indent().cols < c.indent) break;
					this.advance(c.indent);
				}
			} else if (c.kind === 'directive') {
				const fence = this.closingFence(':');
				if (fence >= c.fence) {
					this.closeLeaf();
					while (stack.length > matched + 1) this.closeContainer();
					c.end = this.trimmedEnd();
					this.closeContainer();
					this.settle();
					return;
				}
			}
		}

		const leaf = this.leaf;
		if (matched === stack.length && leaf && leaf.kind !== 'paragraph' && leaf.kind !== 'table') {
			this.continueLeaf(leaf);
			return;
		}
		const blank = this.blank();
		if (matched < stack.length) {
			if (leaf?.kind === 'paragraph' && !blank && !this.startsBlock()) {
				this.report(
					this.indent().next,
					this.trimmedEnd(),
					'lazy continuation line',
					"`>` on every line, or indent to the item's content column"
				);
			}
			this.closeLeaf();
			while (stack.length > matched) this.closeContainer();
		}
		if (blank) {
			if (this.leaf?.kind === 'paragraph' || this.leaf?.kind === 'table') this.closeLeaf();
			// A `>` line with nothing after it is blank only inside its blockquote.
			if (this.top.kind !== 'blockquote') for (const c of stack) c.blank = true;
			return;
		}
		for (let more = true; more;) more = this.start();
		this.settle();
	}

	/** A line with content resets every open container's blank-line flag. */
	settle(): void {
		for (const c of this.stack) c.blank = false;
	}

	/** @prose
	 * ## Block starts
	 *
	 * What the rest of a line opens, tried in a fixed order at the cursor. Returns true after a
	 * container, because the same line can open more (`- > # a`). Rejected forms are tried in the
	 * same order as the forms they imitate, so `* * *` is a rejected rule and never a list inside a
	 * list, and `Title` over `---` is a rejected setext heading and never a paragraph followed by a
	 * rule.
	 */
	start(): boolean {
		const { src } = this;
		const { cols, next } = this.indent();
		const c = src[next];
		if (next === this.lineEnd) return false;
		const paragraph = this.leaf?.kind === 'paragraph';
		const end = this.trimmedEnd();

		if (cols >= 4) {
			if (!paragraph && this.leaf?.kind !== 'table') {
				this.report(next, end, 'indented code block', 'fenced code');
			}
			this.text(next, end);
			return false;
		}
		if (c === '>') {
			const attributes = this.enter(false);
			this.skipTo(next);
			this.open('blockquote', next, attributes);
			this.pos++;
			this.col++;
			this.top.end = this.pos;
			if (isSpace(src.charCodeAt(this.pos))) this.advance(1);
			return true;
		}
		if (paragraph && /^(?:=+|-+)[ \t]*$/.test(src.slice(next, this.lineEnd))) {
			this.report(next, end, 'setext heading underline', '`# Title`');
			this.text(next, end);
			return false;
		}
		const heading = /^(#{1,6})(?:[ \t]|$)/.exec(src.slice(next, Math.min(next + 8, this.lineEnd)));
		if (heading) {
			this.heading(next, heading[1]!.length, end);
			return false;
		}
		const fence = /^(`{3,}|~{3,})(.*)$/.exec(src.slice(next, this.lineEnd));
		if (fence && (fence[1]![0] === '~' || !fence[2]!.includes('`'))) {
			if (fence[1]![0] === '~') {
				this.report(next, end, '`~~~` fence', 'a longer backtick fence');
				this.text(next, end);
			} else {
				this.namedReferences(next + fence[1]!.length, end);
				this.openFence('fence', next, cols, fence[1]!.length, fence[2]!.trim());
			}
			return false;
		}
		if (/^\$\$[ \t]*$/.test(src.slice(next, this.lineEnd))) {
			this.openFence('math', next, cols, 2, '');
			return false;
		}
		if (src.startsWith('<!--', next) && this.comment(next)) return false;
		const rule = /^([-*_])(?:[ \t]*\1){2,}[ \t]*$/.exec(src.slice(next, this.lineEnd));
		if (rule) {
			if (rule[1] === '-') {
				const attributes = this.enter(false);
				this.leafNode(this.b.leaf('thematicBreak', next, end), end, attributes);
			} else {
				this.report(next, end, `\`${rule[1]!.repeat(3)}\` rule`, '`---`');
				this.text(next, end);
			}
			return false;
		}
		const item = this.listItem(cols, next);
		if (item !== NONE_OPENED) return item === OPENED;
		if (c === ':' && this.directive(next, end)) return false;
		if (c === '{' && !paragraph && this.leaf?.kind !== 'table') {
			if (this.attributeLine(next, end)) return false;
			this.multilineAttributes(next, end);
		}
		this.text(next, end);
		return false;
	}

	/**
	 * Whether the rest of the line would open a block, for the lazy-line check. It follows the
	 * paragraph-interruption rules, counts rejected block forms, and changes nothing.
	 */
	startsBlock(): boolean {
		const { cols, next } = this.indent();
		if (cols >= 4) return false;
		const rest = this.src.slice(next, this.lineEnd);
		return (
			/^(?:>|#{1,6}(?:[ \t]|$)|```|~~~|\$\$[ \t]*$|<!--|::)/.test(rest) ||
			/^([-*_])(?:[ \t]*\1){2,}[ \t]*$/.test(rest) ||
			// Only a non-empty `-` or `1.` item can interrupt a paragraph, but inside a list any
			// marker, empty or numbered, starts the next item.
			(this.stack.some((c) => c.kind === 'list')
				? /^(?:[-*+]|\d{1,9}[.)])(?:[ \t]|$)/
				: /^(?:[-*+]|1[.)])[ \t]+\S/
			).test(rest)
		);
	}

	/** Before any block opens: the open leaf closes, a list closes unless an item is opening, the
	 * loose-list rules apply, and the block takes any pending attributes. */
	enter(item: boolean): Attributes | undefined {
		this.closeLeaf();
		if (!item && this.top.kind === 'list') this.closeContainer();
		const top = this.top;
		top.filled = true;
		if (top.blank && top.children > 0) {
			if (top.kind === 'listItem') this.stack[this.stack.length - 2]!.tight = false;
			else if (top.kind === 'list' && item) top.tight = false;
		}
		const pending = this.pending;
		if (!pending || pending.depth !== this.stack.length) return undefined;
		this.pending = null;
		return pending.attributes;
	}

	open(kind: 'blockquote', at: number, attributes: Attributes | undefined): void {
		const node = this.b.open(kind, at);
		if (attributes) this.b.setAttributes(node, attributes);
		this.stack.push(container(kind, node, at));
	}

	/** A finished leaf node: its container's end and child count move past it. */
	leafNode(node: NodeId, end: number, attributes: Attributes | undefined): void {
		if (attributes) this.b.setAttributes(node, attributes);
		this.top.end = Math.max(this.top.end, end);
		this.top.children++;
	}

	/** @prose
	 * ## Headings
	 *
	 * `#` to `######`, a space, and one line of content. A closing run of `#`s after a space is
	 * stripped. The id is settled as the heading closes, against the ids used so far: a `{#id}`
	 * line above gives it exactly (reported if an earlier heading has it), and otherwise it is
	 * slugged from the heading's text and numbered past any id already taken. No id depends on
	 * a later heading, so none changes once written. A trailing `{#id}` is kramdown's and Pandoc's
	 * form, not ours: it stays part of the text and is reported.
	 */
	heading(at: number, depth: number, end: number): void {
		const attributes = this.enter(false);
		let from = at + depth;
		while (from < end && isSpace(this.src.charCodeAt(from))) from++;
		let to = end;
		const closing = /(?:^|[ \t])#+$/.exec(this.src.slice(from, end));
		if (closing) to = from + closing.index;
		while (to > from && isSpace(this.src.charCodeAt(to - 1))) to--;
		const brace = this.src.lastIndexOf(' {', to) + 1;
		if (
			brace > from &&
			this.src[to - 1] === '}' &&
			parseAttributes(this.src, brace, to)?.end === to
		) {
			this.report(brace, to, 'trailing heading attributes', '`{#id}` on the line above');
		}
		const explicit = attributes?.items.findLast((a) => a.key === 'id');
		const data = { depth: depth as 1 | 2 | 3 | 4 | 5 | 6, id: '', idExplicit: !!explicit };
		const node = this.b.open('heading', at, data);
		const text = inline(this.b, this.src, [{ start: from, end: to }]);
		this.b.close(end);
		if (explicit) {
			data.id = explicit.value;
			if (this.ids.has(data.id)) {
				this.report(
					explicit.start,
					explicit.end,
					`id \`${data.id}\` is already used by an earlier heading`,
					'a different id'
				);
			}
		} else {
			const base = slug(text);
			data.id = base;
			for (let n = 1; this.ids.has(data.id); n++) data.id = `${base}-${n}`;
		}
		this.ids.add(data.id);
		this.leafNode(node, end, attributes);
	}

	/** @prose
	 * ## Fences
	 *
	 * Fenced code, ` ```=format ` raw blocks and `$$` math share one leaf: an opening line, content
	 * lines with up to the opening fence's indentation removed, and a closing fence at least as
	 * long. An unclosed fence runs to the end of its container. The value is built as a string,
	 * since a container prefix can sit inside it; the body range still points at the source.
	 */
	openFence(kind: 'fence' | 'math', at: number, indent: number, ticks: number, info: string): void {
		const attributes = this.enter(false);
		const end = this.trimmedEnd();
		this.leaf = { kind, start: at, end, indent, ticks, info, body: null, value: '', attributes };
	}

	continueLeaf(leaf: Exclude<Leaf, { kind: 'paragraph' | 'table' }>): void {
		const { src } = this;
		if (leaf.kind === 'comment') {
			const close = src.indexOf('-->', this.pos);
			if (close >= 0 && close < this.lineEnd) {
				this.closeComment(close + 3);
			} else leaf.end = this.lineEnd;
			return;
		}
		const lineStart = this.pos;
		const closing =
			leaf.kind === 'math'
				? /^[ \t]*\$\$[ \t]*$/.test(src.slice(this.pos, this.lineEnd)) && this.indent().cols <= 3
				: this.closingFence('`') >= leaf.ticks;
		if (closing) {
			leaf.end = this.trimmedEnd();
			if (!leaf.body) leaf.body = { start: lineStart, end: lineStart };
			this.closeLeaf();
			return;
		}
		const { cols } = this.indent();
		this.advance(Math.min(cols, leaf.indent));
		const text = ' '.repeat(this.tab) + src.slice(this.tab ? this.pos + 1 : this.pos, this.lineEnd);
		leaf.value += text + '\n';
		if (leaf.body) leaf.body.end = this.lineEnd;
		else leaf.body = { start: lineStart, end: this.lineEnd };
		leaf.end = this.lineEnd;
	}

	/** Returns the length of a closing fence of `char`s at the cursor, or 0. */
	closingFence(char: string): number {
		const { cols, next } = this.indent();
		if (cols > 3) return 0;
		let i = next;
		while (this.src[i] === char) i++;
		const n = i - next;
		if (n < 3) return 0;
		while (i < this.lineEnd && isSpace(this.src.charCodeAt(i))) i++;
		return i === this.lineEnd ? n : 0;
	}

	/** @prose
	 * ## Comments
	 *
	 * `<!--` at the start of a line opens a comment, which ends on the line with `-->`. A comment
	 * that shares its first line with other text isn't a block, and is left to the inline pass.
	 */
	comment(at: number): boolean {
		const close = this.src.indexOf('-->', at + 2);
		const oneLine = close >= 0 && close < this.lineEnd;
		if (oneLine && this.src.slice(close + 3, this.lineEnd).trim() !== '') return false;
		this.closeLeaf();
		if (this.top.kind === 'list') this.closeContainer();
		this.leaf = { kind: 'comment', start: at, end: this.lineEnd };
		if (oneLine) this.closeComment(close + 3);
		return true;
	}

	closeComment(end: number): void {
		const rest = this.src.slice(end, this.lineEnd);
		if (rest.trim() !== '') {
			this.report(
				end,
				this.trimmedEnd(),
				'text after `-->` is part of the comment',
				'end the comment on a line of its own'
			);
			end = this.trimmedEnd();
		}
		(this.leaf as { end: number }).end = end;
		this.closeLeaf();
	}

	/** @prose
	 * ## List items
	 *
	 * A bullet (`-`, `*`, `+`) or an ordered marker (`1.`, `1)`), then whitespace or the end of the
	 * line. The item's content column is the marker's width plus the spaces after it, unless there
	 * are five or more, or none: then it is one past the marker. A different bullet or delimiter
	 * starts a new list. An item can interrupt a paragraph only if it has content and, when
	 * ordered, starts at 1.
	 */
	listItem(cols: number, next: number): number {
		const { src } = this;
		let markerEnd = next;
		let ordered = false;
		let start = 1;
		let marker = src[next]!;
		if (BULLET.test(marker)) markerEnd = next + 1;
		else {
			while (markerEnd < this.lineEnd && markerEnd - next < 10 && /\d/.test(src[markerEnd]!))
				markerEnd++;
			if (markerEnd === next || markerEnd - next > 9 || !/[.)]/.test(src[markerEnd] ?? '')) {
				return NONE_OPENED;
			}
			ordered = true;
			start = Number(src.slice(next, markerEnd));
			marker = src[markerEnd]!;
			markerEnd++;
		}
		if (markerEnd < this.lineEnd && !isSpace(src.charCodeAt(markerEnd))) return NONE_OPENED;
		let rest = markerEnd;
		while (rest < this.lineEnd && isSpace(src.charCodeAt(rest))) rest++;
		const empty = rest === this.lineEnd;
		if (this.leaf?.kind === 'paragraph' && (empty || start !== 1)) return NONE_OPENED;

		const top = this.top;
		const same = top.kind === 'list' && top.ordered === ordered && top.marker === marker;
		if (top.kind === 'list' && !same) this.closeContainer();
		const attributes = this.enter(same);
		if (!same) {
			const node = this.b.open('list', next, { ordered, start, tight: true });
			if (attributes) this.b.setAttributes(node, attributes);
			const list = container('list', node, next);
			Object.assign(list, { ordered, marker, start });
			this.stack.push(list);
		}

		this.skipTo(next);
		this.pos = markerEnd;
		this.col += markerEnd - next;
		const width = markerEnd - next;
		const after = this.indent().cols;
		let indent: number;
		if (empty || after >= 5) {
			indent = cols + width + 1;
			if (!empty) this.advance(1);
		} else {
			indent = cols + width + after;
			this.advance(after);
		}
		const node = this.b.open('listItem', next, { checked: null });
		if (same && attributes) this.b.setAttributes(node, attributes);
		const item = container('listItem', node, markerEnd);
		item.indent = indent;
		item.filled = !empty;
		this.stack.push(item);
		return empty ? OPENED_EMPTY : OPENED;
	}

	/** @prose
	 * ## Directives
	 *
	 * `::name[label]{…}` is a leaf and `:::name[label]{…}` opens a container, each on a line of its
	 * own. The name starts with a letter. A leaf's label is inline content; a container's is plain
	 * text with escapes decoded. A line that doesn't fit is paragraph text, with no warning,
	 * since `::` in prose isn't a construct.
	 */
	directive(at: number, end: number): boolean {
		const { src } = this;
		let i = at;
		while (src[i] === ':') i++;
		const colons = i - at;
		if (colons < 2) return false;
		const name = /^[A-Za-z][\w-]*/.exec(src.slice(i, end))?.[0];
		if (!name) return false;
		i += name.length;
		let label: Range | null = null;
		if (src[i] === '[') {
			const close = labelEnd(src, i, end);
			if (close < 0) return false;
			label = { start: i + 1, end: close };
			i = close + 1;
		}
		let own: Attributes | null = null;
		if (src[i] === '{') {
			own = parseAttributes(src, i, end);
			if (!own) return false;
			i = own.end;
		}
		if (i !== end) return false;

		const pending = this.enter(false);
		const attributes = merge(pending, own);
		const data = {
			kind: colons === 2 ? ('leaf' as const) : ('container' as const),
			name,
			label: label && { ...label, value: unescape(src.slice(label.start, label.end)) }
		};
		const node = this.b.open('directive', at, data);
		if (attributes) this.b.setAttributes(node, attributes);
		if (colons === 2) {
			if (label) inline(this.b, src, [label]);
			this.b.close(end);
			this.leafNode(node, end, undefined);
		} else {
			const c = container('directive', node, end);
			c.fence = colons;
			this.stack.push(c);
		}
		return true;
	}

	/** @prose
	 * ## Block attributes
	 *
	 * A line holding only `{…}` decorates the next block in the same container, across blank
	 * lines. Consecutive lines merge. They can't interrupt a paragraph or a table, where the line
	 * is text, and if no block follows before the container ends, the lines are kept as a
	 * paragraph and reported.
	 */
	attributeLine(at: number, end: number): boolean {
		const attributes = parseAttributes(this.src, at, end);
		if (!attributes || attributes.end !== end) return false;
		this.closeLeaf();
		if (this.top.kind === 'list') this.closeContainer();
		const pending = this.pending;
		if (pending && pending.depth === this.stack.length) {
			pending.attributes = merge(pending.attributes, attributes)!;
			pending.lines.push({ start: at, end });
		} else {
			this.pending = { attributes, lines: [{ start: at, end }], depth: this.stack.length };
		}
		return true;
	}

	/**
	 * A `{` line that doesn't parse but would if the following lines up to a `}` were joined onto
	 * it. The lines stay a paragraph; this only reports them.
	 */
	multilineAttributes(at: number, end: number): void {
		const { src } = this;
		if (src.lastIndexOf('}', end) >= at) return;
		const close = src.indexOf('}', end);
		if (close < 0) return;
		const joined = src.slice(at, close + 1);
		if (/\n[ \t]*\r?\n/.test(joined)) return;
		const flat = joined.replace(/[\r\n]/g, ' ');
		if (parseAttributes(flat, 0, flat.length)?.end === flat.length) {
			this.report(at, close + 1, 'multi-line attributes', 'one line');
		}
	}

	/** Pending attributes whose container is closing become text. */
	flushPending(depth: number): void {
		const pending = this.pending;
		if (!pending || pending.depth !== depth) return;
		this.pending = null;
		const { lines } = pending;
		this.report(
			lines[0]!.start,
			lines.at(-1)!.end,
			'block attributes with no block after them',
			'put the `{…}` line directly above a block'
		);
		const node = this.b.open('paragraph', lines[0]!.start);
		inline(this.b, this.src, lines);
		this.b.close(lines.at(-1)!.end);
		this.leafNode(node, lines.at(-1)!.end, undefined);
	}

	/** @prose
	 * ## Paragraphs and tables
	 *
	 * Text that opens no block continues the open paragraph or table, or starts a paragraph. A
	 * delimiter row (`| --- | :-: |`) under a paragraph turns the paragraph's last line into a
	 * table header when the cell counts agree; the lines before it stay a paragraph. Rows then
	 * continue until a blank line or another block.
	 */
	text(start: number, end: number): void {
		const leaf = this.leaf;
		if (leaf?.kind === 'table') {
			this.row(start, end, leaf.columns);
			leaf.end = end;
			return;
		}
		if (leaf?.kind === 'paragraph') {
			const header = leaf.lines.at(-1)!;
			const align = delimiterRow(this.src, start, end);
			if (align && cells(this.src, header.start, header.end).length === align.length) {
				this.table(leaf, align, end);
				return;
			}
			leaf.lines.push({ start, end });
			return;
		}
		const attributes = this.enter(false);
		this.leaf = { kind: 'paragraph', lines: [{ start, end }], attributes };
	}

	table(paragraph: Extract<Leaf, { kind: 'paragraph' }>, align: Align[], end: number): void {
		const header = paragraph.lines.pop()!;
		// Attributes above the paragraph stay with it, unless the header was its only line.
		let attributes = paragraph.attributes;
		if (paragraph.lines.length > 0) {
			attributes = undefined;
			this.closeLeaf();
		} else this.leaf = null;
		const node = this.b.open('table', header.start, { align });
		if (attributes) this.b.setAttributes(node, attributes);
		this.row(header.start, header.end, align.length);
		this.leaf = { kind: 'table', columns: align.length, end };
	}

	row(start: number, end: number, columns: number): void {
		this.b.open('tableRow', start);
		for (const cell of cells(this.src, start, end).slice(0, columns)) {
			this.b.open('tableCell', cell.start);
			inline(this.b, this.src, [cell], true);
			this.b.close(cell.end);
		}
		this.b.close(end);
	}

	/** @prose
	 * ## Closing
	 *
	 * A leaf becomes nodes when it closes: a paragraph (with a task item's `[ ]` taken off its
	 * first line), a code, raw or math node, a comment, or the end of a table. A closing container
	 * records a list's tightness and moves its parent's end.
	 */
	closeLeaf(): void {
		const leaf = this.leaf;
		if (!leaf) return;
		this.leaf = null;
		const { b, src } = this;
		switch (leaf.kind) {
			case 'paragraph': {
				const { lines } = leaf;
				for (let i = 0; i < lines.length - 1; i++) this.trailingSpaces(lines[i]!.end);
				const top = this.top;
				if (top.kind === 'listItem' && top.children === 0) {
					const task = /^\[([ xX])\][ \t]+(?=\S)/.exec(src.slice(lines[0]!.start, lines[0]!.end));
					if (task) {
						b.setData(top.node, 'listItem', { checked: task[1] !== ' ' });
						lines[0] = { start: lines[0]!.start + task[0].length, end: lines[0]!.end };
					}
				}
				const end = lines.at(-1)!.end;
				const node = b.open('paragraph', lines[0]!.start);
				inline(b, src, lines);
				b.close(end);
				this.leafNode(node, end, leaf.attributes);
				return;
			}
			case 'fence':
			case 'math': {
				const body = leaf.body ?? { start: leaf.end, end: leaf.end };
				let node: NodeId;
				if (leaf.kind === 'math') {
					node = b.leaf('math', leaf.start, leaf.end, {
						block: true,
						value: leaf.value,
						range: body
					});
				} else if (/^=\S/.test(leaf.info)) {
					const format = leaf.info.slice(1).split(/[ \t]/)[0]!;
					node = b.leaf('raw', leaf.start, leaf.end, { format, value: leaf.value, range: body });
				} else {
					const info = unescape(leaf.info);
					const space = info.search(/[ \t]/);
					const lang = space < 0 ? info : info.slice(0, space);
					const meta = space < 0 ? '' : info.slice(space).trim();
					node = b.leaf('code', leaf.start, leaf.end, {
						lang: lang || null,
						meta: meta || null,
						value: leaf.value,
						body
					});
				}
				this.leafNode(node, leaf.end, leaf.attributes);
				return;
			}
			case 'comment':
				this.leafNode(b.leaf('comment', leaf.start, leaf.end), leaf.end, undefined);
				return;
			case 'table':
				b.close(leaf.end);
				this.top.end = Math.max(this.top.end, leaf.end);
				this.top.children++;
		}
	}

	closeContainer(): void {
		this.flushPending(this.stack.length);
		const c = this.stack.pop()!;
		if (c.kind === 'list') {
			this.b.setData(c.node, 'list', { ordered: c.ordered, start: c.start, tight: c.tight });
		}
		this.b.close(c.end);
		const parent = this.top;
		parent.end = Math.max(parent.end, c.end);
		parent.children++;
	}

	/** Named character references in a fence's info string stay as written, and are reported. */
	namedReferences(from: number, to: number): void {
		for (const m of this.src.slice(from, to).matchAll(NAMED)) {
			const at = from + m.index;
			this.report(at, at + m[0].length, `named character reference \`${m[0]}\``, NAMED_INSTEAD);
		}
	}

	/** Two or more spaces ending a paragraph line are GFM's invisible hard break. */
	trailingSpaces(end: number): void {
		let i = end;
		while (this.src[i] === ' ') i++;
		if (i - end >= 2)
			this.report(
				end,
				i,
				'two trailing spaces as a line break',
				'`\\` at end of line, or `{.verse}` on a poem'
			);
	}

	/** @prose
	 * ## Cursor
	 *
	 * Columns follow CommonMark's tab stops of 4. A prefix can end inside a tab (`>\tcode`); the
	 * cursor then stays on the tab and `tab` counts its unread columns, which content reads as
	 * spaces.
	 */
	indent(): { cols: number; next: number } {
		const { src, lineEnd } = this;
		let i = this.pos;
		let col = this.col;
		let cols = 0;
		if (this.tab) {
			cols = this.tab;
			col += this.tab;
			i++;
		}
		for (; i < lineEnd; i++) {
			const c = src[i];
			if (c === ' ') {
				cols++;
				col++;
			} else if (c === '\t') {
				const w = 4 - (col % 4);
				cols += w;
				col += w;
			} else break;
		}
		return { cols, next: i };
	}

	advance(n: number): void {
		const { src } = this;
		while (n > 0 && this.pos < this.lineEnd) {
			if (this.tab) {
				const take = Math.min(this.tab, n);
				this.tab -= take;
				this.col += take;
				n -= take;
				if (this.tab === 0) this.pos++;
			} else if (src[this.pos] === ' ') {
				this.pos++;
				this.col++;
				n--;
			} else if (src[this.pos] === '\t') {
				const w = 4 - (this.col % 4);
				if (w <= n) {
					this.pos++;
					this.col += w;
					n -= w;
				} else {
					this.tab = w - n;
					this.col += n;
					n = 0;
				}
			} else break;
		}
	}

	/** Moves the cursor over whitespace to `next`, which `indent()` returned. */
	skipTo(next: number): void {
		this.advance(this.indent().cols);
		this.pos = next;
	}

	blank(): boolean {
		return this.indent().next === this.lineEnd;
	}

	trimmedEnd(): number {
		let end = this.lineEnd;
		while (end > this.pos && isSpace(this.src.charCodeAt(end - 1))) end--;
		return end;
	}

	report(start: number, end: number, message: string, instead: string): void {
		this.b.warn({ start, end, message, instead });
	}
}

function container(kind: Container['kind'], node: NodeId, end: number): Container {
	return {
		kind,
		node,
		end,
		children: 0,
		blank: false,
		indent: 0,
		filled: true,
		fence: 0,
		ordered: false,
		marker: '',
		start: 1,
		tight: true
	};
}

function merge(
	a: Attributes | undefined | null,
	b: Attributes | undefined | null
): Attributes | undefined {
	if (!a) return b ?? undefined;
	if (!b) return a;
	return { start: a.start, end: b.end, items: [...a.items, ...b.items] };
}

/** The `]` closing a label that opens at `at`, with nested brackets balanced; -1 if none. */
function labelEnd(src: string, at: number, end: number): number {
	let depth = 0;
	for (let i = at; i < end; i++) {
		const c = src[i];
		if (c === '\\') i++;
		else if (c === '[') depth++;
		else if (c === ']' && --depth === 0) return i;
	}
	return -1;
}

/** @prose
 * ## Table rows
 *
 * A row's cells are split on `|`s that aren't escaped, after an optional leading and trailing
 * pipe. Each cell is trimmed. A delimiter row needs at least one pipe, so `Title` over `---`
 * stays a setext case.
 */
function cells(src: string, start: number, end: number): Range[] {
	let s = start;
	let e = end;
	if (src[s] === '|') s++;
	if (e > s && src[e - 1] === '|' && !escaped(src, e - 1, s)) e--;
	const out: Range[] = [];
	let from = s;
	for (let i = s; i <= e; i++) {
		if (i === e || (src[i] === '|' && !escaped(src, i, s))) {
			let a = from;
			let z = i;
			while (a < z && isSpace(src.charCodeAt(a))) a++;
			while (z > a && isSpace(src.charCodeAt(z - 1))) z--;
			out.push({ start: a, end: z });
			from = i + 1;
		}
	}
	return out;
}

function escaped(src: string, i: number, from: number): boolean {
	let n = 0;
	while (i - n - 1 >= from && src[i - n - 1] === '\\') n++;
	return n % 2 === 1;
}

function delimiterRow(src: string, start: number, end: number): Align[] | null {
	const line = src.slice(start, end);
	if (!line.includes('|')) return null;
	const align: Align[] = [];
	for (const cell of cells(src, start, end)) {
		const text = src.slice(cell.start, cell.end);
		const m = /^(:?)-+(:?)$/.exec(text);
		if (!m) return null;
		align.push(m[1] && m[2] ? 'center' : m[1] ? 'left' : m[2] ? 'right' : null);
	}
	return align;
}

/** @prose
 * ## Heading ids
 *
 * GitHub's algorithm, on the heading's plain text: lowercased, with every character that isn't a
 * letter, mark, number, space, `_` or `-` removed, trimmed, and each run of whitespace turned into
 * `-`. Letters in any script stay. A heading with nothing left is `section`.
 */
function slug(text: string): string {
	return (
		text
			.toLowerCase()
			.replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
			.trim()
			.replace(/\s+/g, '-') || 'section'
	);
}
