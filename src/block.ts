/** @prose
 * # Block pass
 *
 * Source lines to containers and leaves, in one pass over the lines (design: Parser foundation). It
 * keeps a stack of open containers (blockquotes, lists, list items, container elements) and at
 * most one open leaf. Each line first walks the stack, letting each container consume its prefix;
 * whatever is left either continues the open leaf or starts new blocks. Every block construct in
 * `syntax.md` is a case here, and so is every rejected one: a setext underline, indented code, a
 * `~~~` fence or a lazy line is recognised where it is met, stays text, and adds a warning.
 *
 * Leaves with inline content (paragraphs, headings, table cells, leaf-element labels) hand
 * their lines to the inline pass as source ranges. A paragraph's lines are held until it closes,
 * because the next line can still turn its last line into a table header; nothing is read twice.
 */
import { type Attributes, type Builder, type NodeId, type Range, type Align } from "./ast";
import { bareOnly, braceEnd, parseAttributes, parseElement } from "./attributes";
import { isSpace, NAMED } from "./chars";
import { element, insteadOf } from "./elements";
import { decode, inline } from "./inline";
import { parseMetadata } from "./metadata";
import { type WarningCode } from "./warnings";

/** The rest of a line, up to its ending: one regex step instead of a test per character. */
const LINE = /[^\n\r]*/y;

export function blocks(b: Builder, source: string, start: number): void {
  new BlockParser(b, source).run(start);
}

interface Container {
  kind: "document" | "blockquote" | "list" | "listItem" | "element";
  node: NodeId;
  /** Where the node ends so far: its last marker or its last child. */
  end: number;
  /** Direct children closed so far. */
  children: number;
  /** When it opened, on the parser's clock, to tell which blank lines it has seen. */
  born: number;
  /** listItem: the content column, relative to the item's container. */
  indent: number;
  /** listItem: false while an item that opened on an empty line has nothing in it. */
  filled: boolean;
  /** element: its name, and its opening line, where an unclosed one is reported. */
  name: string;
  head: Range;
  /** element: where its run of directly nested elements ends in the stack. The run shares one object. */
  run: { end: number };
  /** element: a closing line closed it. */
  closed: boolean;
  /** list */
  ordered: boolean;
  marker: string;
  start: number;
  tight: boolean;
}

type Leaf =
  | {
      kind: "paragraph";
      lines: Range[];
      attributes: Attributes | undefined;
      /** The last line was indented four or more columns, so it can't be a table header. */
      indented: boolean;
    }
  | {
      kind: "fence" | "math";
      start: number;
      end: number;
      /** The end of the opening line, where an unclosed block is reported. */
      head: number;
      closed: boolean;
      indent: number;
      ticks: number;
      info: string;
      body: Range | null;
      lines: string[];
      /** Whether the content lines are the source as it is, one after another. */
      verbatim: boolean;
      attributes: Attributes | undefined;
    }
  | { kind: "comment"; start: number; end: number; head: number; closed: boolean }
  | { kind: "table"; columns: number; end: number };

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
  /**
   * A clock that ticks at each blank line and each line with content. A container has seen a
   * blank line since the last content when the last blank line is later than both.
   */
  clock = 0;
  blankAt = -1;
  contentAt = -1;
  /**
   * Every heading id so far, explicit or generated, with the last number given to it as a
   * generated id's base, so numbering resumes rather than restarts. One table, so a new id is
   * hashed and stored once.
   */
  readonly ids = new Map<string, number>();
  /** The ids of `{#id}` lines so far, for a `{/name}` that meant `{@name}`. */
  idLines: Set<string> | null = null;
  /** The whitespace `blank` last found: on which line, and from where to where. */
  space = { lineEnd: -1, from: -1, to: -1 };
  /**
   * Where in the stack a blank line stops: each blockquote, which needs its `>`, and each item
   * still empty. Ascending, and changed only at the top.
   */
  readonly blockers: number[] = [];
  /** The current line's trailing run of one rule marker: where it starts, and its third-last. */
  ruleTail: { lineEnd: number; marker: string; from: number; third: number } | null = null;
  /** The last `braceAfter` scan: from where, how far it got, and the `}` it found. */
  braceScan: { from: number; to: number; close: number } | null = null;

  // The line being read, and a cursor into it. `tab` is how many columns of the tab at `pos` are
  // still unread, when a container prefix ended in the middle of one.
  lineEnd = 0;
  /** This line left a quoted or listed paragraph, so an element here is reported (`lazyBefore`). */
  lazy = false;
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
    this.push(container("document", this.b.current, start));
    let at = this.metadata(start);
    const { src } = this;
    while (at < src.length) {
      LINE.lastIndex = at;
      LINE.test(src);
      const end = LINE.lastIndex;
      this.line(at, end);
      at = end < src.length ? end + (src[end] === "\r" && src[end + 1] === "\n" ? 2 : 1) : end;
    }
    this.closeLeaf();
    while (this.stack.length > 1) this.closeContainer();
    this.flushPending(1);
  }

  /** @prose
   * ## Metadata
   *
   * The metadata block (grammar: metadata). The closing line is found by
   * one forward scan before any line inside is read, so a line the rule can't read is a warning,
   * never a reason to read the block as Markdown (`metadata-start`). Unclosed, the first line is a
   * thematic break, reported when the next line is a `key:` line, since that is a block missing
   * its end. A closed `+++` block (TOML) stays text and is reported.
   */
  metadata(start: number): number {
    const { src } = this;
    const toml = /\+\+\+[ \t]*(?:\r\n|\r|\n)[^]*?^\+\+\+[ \t]*$/my;
    toml.lastIndex = start;
    if (toml.test(src)) {
      this.report("toml-metadata", start, toml.lastIndex);
    }
    const first = /---[ \t]*(?:\r\n|\r|\n)/y;
    first.lastIndex = start;
    if (!first.test(src)) return start;
    const bodyStart = first.lastIndex;
    const close = /^---[ \t]*$/gm;
    close.lastIndex = bodyStart;
    const match = close.exec(src);
    if (!match) {
      if (KEY.test(src.slice(bodyStart, bodyStart + 64))) {
        this.report("metadata-unclosed", start, bodyStart - (src[bodyStart - 2] === "\r" ? 2 : 1));
      }
      return start;
    }
    const end = match.index + match[0].length;
    let bodyEnd = match.index;
    if (bodyEnd > bodyStart)
      bodyEnd -= src[bodyEnd - 2] === "\r" && src[bodyEnd - 1] === "\n" ? 2 : 1;
    const value = parseMetadata(src, bodyStart, bodyEnd, this.b);
    this.b.leaf("metadata", start, end, { value, range: { start: bodyStart, end: bodyEnd } });
    this.top.children++;
    this.top.end = end;
    let next = end;
    if (src[next] === "\r") next++;
    if (src[next] === "\n") next++;
    return next;
  }

  /** @prose
   * ## A line
   *
   * Containers match first, each consuming its prefix: `>` for a blockquote, the content
   * indentation for a list item. A list always matches, and ends when a line inside it isn't an
   * item. A container element matches every line but a closing line, which is read at its own
   * level before the containers inside it take their prefixes: `{/name}` closes the innermost
   * element of the run it meets when the names match (`element-close`), and is otherwise left to
   * be reported.
   *
   * A fence, math block or comment that is still open takes the rest of the line. Otherwise,
   * when a container didn't match, it closes (grammar: `container-prefix`). There are no lazy
   * lines (`paragraph-lines`): a paragraph line there starts a new paragraph and is reported.
   */
  line(start: number, end: number): void {
    this.pos = start;
    this.col = 0;
    this.tab = 0;
    this.lineEnd = end;
    this.lazy = false;
    const { stack, src } = this;

    let matched = 1;
    for (; matched < stack.length; matched++) {
      const c = stack[matched]!;
      if (c.kind === "blockquote") {
        const { cols, next } = this.indent();
        if (cols > 3 || src[next] !== ">") break;
        this.skipTo(next);
        this.pos++;
        this.col++;
        c.end = this.pos;
        if (isSpace(src.charCodeAt(this.pos))) this.advance(1);
      } else if (c.kind === "listItem") {
        if (this.blank()) {
          // Nothing on the rest of the line: every container passes it up to the first that
          // can't take a blank line.
          matched = this.blocker(matched);
          break;
        } else {
          if (this.indent(c.indent).cols < c.indent) break;
          this.advance(c.indent);
        }
      } else if (c.kind === "element") {
        matched = c.run.end;
        if (this.closingLine() !== stack[matched]!.name) continue;
        if (this.lazyBefore()) {
          this.report("element-lazy-line", this.indent().next, this.trimmedEnd());
        }
        const closed = stack[matched]!;
        closed.closed = true;
        this.closeLeaf();
        while (stack.length > matched + 1) this.closeContainer();
        closed.end = this.trimmedEnd();
        this.closeContainer();
        this.settle();
        return;
      }
    }

    const leaf = this.leaf;
    if (matched === stack.length && leaf && leaf.kind !== "paragraph" && leaf.kind !== "table") {
      this.continueLeaf(leaf);
      return;
    }
    const blank = this.blank();
    if (matched < stack.length) {
      if (!blank && ELEMENT_LINE.test(this.src.slice(this.indent().next, this.lineEnd))) {
        this.lazy = this.lazyBefore();
      } else if (leaf?.kind === "paragraph" && !blank && !this.startsBlock()) {
        this.report("lazy-line", this.indent().next, this.trimmedEnd());
      }
      this.closeLeaf();
      while (stack.length > matched) this.closeContainer();
    }
    if (blank) {
      if (this.leaf?.kind === "paragraph" || this.leaf?.kind === "table") this.closeLeaf();
      // A `>` line with nothing after it is blank only inside its blockquote.
      if (this.top.kind !== "blockquote") this.blankAt = ++this.clock;
      return;
    }
    for (let more = true; more;) more = this.start();
    this.settle();
  }

  /** A line with content resets every open container's blank-line flag. */
  settle(): void {
    this.contentAt = ++this.clock;
  }

  /** Whether a blank line came after the container opened and after the last content. */
  blankIn(c: Container): boolean {
    return this.blankAt > this.contentAt && this.blankAt > c.born;
  }

  /** @prose
   * ## Opening containers
   *
   * Every container is pushed here, stamped with the clock. Directly nested elements form a run
   * that consumes no prefix, and only the innermost can take a closing line, so a line tests the
   * run once, not once per element: checking them one by one would cost the nesting depth on
   * every line.
   */
  push(c: Container): void {
    const { stack } = this;
    c.born = this.clock;
    if (c.kind === "blockquote" || (c.kind === "listItem" && !c.filled)) {
      this.blockers.push(stack.length);
    }
    if (c.kind === "element") {
      c.run = this.top.kind === "element" ? this.top.run : { end: 0 };
      c.run.end = stack.length;
    }
    stack.push(c);
  }

  /** @prose
   * ## Block starts
   *
   * What the rest of a line opens, tried in the grammar's order (`block-order`). Returns true after a
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
    const paragraph = this.leaf?.kind === "paragraph";
    const end = this.trimmedEnd();

    if (cols >= 4) {
      // Never a table row: it ends the table, and it can't be a delimiter row under a paragraph.
      if (this.leaf?.kind === "table") this.closeLeaf();
      if (this.leaf?.kind === "paragraph") {
        this.leaf.lines.push({ start: next, end });
        this.leaf.indented = true;
      } else {
        this.report("indented-code", next, end);
        this.text(next, end);
      }
      return false;
    }
    if (c === ">") {
      const attributes = this.enter(false);
      this.skipTo(next);
      this.open("blockquote", next, attributes);
      this.pos++;
      this.col++;
      this.top.end = this.pos;
      if (isSpace(src.charCodeAt(this.pos))) this.advance(1);
      return true;
    }
    if (
      paragraph &&
      (c === "=" || c === "-") &&
      /^(?:=+|-+)[ \t]*$/.test(src.slice(next, this.lineEnd))
    ) {
      this.report("setext-heading", next, end);
      this.text(next, end);
      return false;
    }
    // Each form is tried only on its own first character, so an ordinary line pays for none.
    if (c === "#") {
      const heading = /^(#{1,6})(?:[ \t]|$)/.exec(
        src.slice(next, Math.min(next + 8, this.lineEnd)),
      );
      if (heading) {
        this.heading(next, heading[1]!.length, end);
        return false;
      }
    }
    if (c === "`" || c === "~") {
      const fence = /^(`{3,}|~{3,})(.*)$/.exec(src.slice(next, this.lineEnd));
      if (fence && (fence[1]![0] === "~" || !fence[2]!.includes("`"))) {
        if (fence[1]![0] === "~") {
          this.report("tilde-fence", next, end);
          this.text(next, end);
        } else {
          this.namedReferences(next + fence[1]!.length, end);
          this.openFence("fence", next, cols, fence[1]!.length, fence[2]!.trim());
        }
        return false;
      }
    }
    if (c === "$" && src[next + 1] === "$") {
      if (/^\$\$[ \t]*$/.test(src.slice(next, this.lineEnd))) {
        this.openFence("math", next, cols, 2, "");
        return false;
      }
      // `$$E=mc^2$$` alone on a line is a block too, as on GitHub.
      const display = /^\$\$((?:[^$]|\$(?!\$))*[^$\s](?:[^$]|\$(?!\$))*)\$\$[ \t]*$/.exec(
        src.slice(next, this.lineEnd),
      );
      if (display) {
        const attributes = this.enter(false);
        const value = display[1]!;
        const range = { start: next + 2, end: next + 2 + value.length };
        const node = this.b.leaf("math", next, end, { block: true, value: `${value}\n`, range });
        this.leafNode(node, end, attributes);
        return false;
      }
    }
    if (c === "<" && src.startsWith("<!--", next) && this.comment(next)) return false;
    const rule = this.rule(next);
    if (rule) {
      // `***` is read because a formatter writes it on a first line, where `---` opens metadata.
      if (rule === "-" || (rule === "*" && /^\*+[ \t]*$/.test(src.slice(next, this.lineEnd)))) {
        const attributes = this.enter(false);
        this.leafNode(this.b.leaf("thematicBreak", next, end), end, attributes);
      } else {
        this.report("rule-marker", next, end, `\`${rule.repeat(3)}\` rule`);
        this.text(next, end);
      }
      return false;
    }
    const item = this.listItem(cols, next);
    if (item !== NONE_OPENED) return item === OPENED;
    if (c === ":" && COLON_LINE.test(src.slice(next, end))) this.report("directive", next, end);
    // Reported only once the line is an element: see `lazyBefore`.
    const table = this.leaf?.kind === "table";
    const lazy = this.lazy || table;
    this.lazy = false;
    if (c === "{" && (src[next + 1] === "@" || src[next + 1] === "/")) {
      if (this.element(next, end, paragraph || table)) {
        if (lazy) this.report("element-lazy-line", next, end);
        return false;
      }
    } else if (c === "[" && src[end - 1] === "}" && src[end - 2] === "/") {
      if (this.leafElement(next, end)) {
        if (lazy) this.report("element-lazy-line", next, end);
        return false;
      }
    }
    if (c === "{" && !paragraph && this.leaf?.kind !== "table") {
      if (this.attributeLine(next, end)) return false;
      this.multilineAttributes(next, end);
    }
    this.text(next, end);
    return false;
  }

  /**
   * The marker when the rest of the line from `at` is a thematic break (three or more of one of
   * `-`, `*` or `_`, with spaces between), or null. Nested list markers can put many starts on
   * one line (`- - - - a`), so the line's trailing run of one marker is found once, from the
   * end, and each start is checked against it.
   */
  rule(at: number): string | null {
    const { src, lineEnd } = this;
    let tail = this.ruleTail;
    if (tail?.lineEnd !== lineEnd) {
      let i = lineEnd;
      while (i > 0 && isSpace(src.charCodeAt(i - 1))) i--;
      const marker = src[i - 1] ?? "";
      const third: number[] = [];
      if (marker && "-*_".includes(marker)) {
        while (i > 0 && (src[i - 1] === marker || isSpace(src.charCodeAt(i - 1)))) {
          if (src[--i] === marker && third.length < 3) third.push(i);
        }
      }
      tail = { lineEnd, marker, from: i, third: third.length === 3 ? third[2]! : -1 };
      this.ruleTail = tail;
    }
    return src[at] === tail.marker && at >= tail.from && at <= tail.third ? tail.marker : null;
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
      // A backtick fence's info string holds no backtick, or the line isn't a fence.
      /^(?:>|#{1,6}(?:[ \t]|$)|`{3,}[^`]*$|~~~|\$\$[ \t]*$|<!--|\{\/|(?:\[.*\])?\{@.*\/\}[ \t]*$)/.test(
        rest,
      ) ||
      this.rule(next) !== null ||
      // Only a non-empty `-` or `1.` item can interrupt a paragraph, but inside a list any
      // marker, empty or numbered, starts the next item.
      (this.stack.some((c) => c.kind === "list")
        ? /^(?:[-*+]|\d{1,9}[.)])(?:[ \t]|$)/
        : /^(?:[-*+]|1[.)])[ \t]+\S/
      ).test(rest)
    );
  }

  /** Before any block opens: the open leaf closes, a list closes unless an item is opening, the
   * loose-list rules apply, and the block takes any pending attributes. */
  enter(item: boolean): Attributes | undefined {
    this.closeLeaf();
    if (!item && this.top.kind === "list") this.closeContainer();
    const top = this.top;
    top.filled = true;
    if (top.kind === "listItem" && this.blockers.at(-1) === this.stack.length - 1) {
      this.blockers.pop();
    }
    if (this.blankIn(top) && top.children > 0) {
      if (top.kind === "listItem") this.stack[this.stack.length - 2]!.tight = false;
      else if (top.kind === "list" && item) top.tight = false;
    }
    const pending = this.pending;
    if (!pending || pending.depth !== this.stack.length) return undefined;
    this.pending = null;
    return pending.attributes;
  }

  open(kind: "blockquote", at: number, attributes: Attributes | undefined): void {
    const node = this.b.open(kind, at);
    if (attributes) this.b.setAttributes(node, attributes);
    this.push(container(kind, node, at));
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
   * One line of content, with its closing hashes stripped (grammar: heading, `closing-hashes`).
   * The id is settled as the heading closes, against the ids used so far (`heading-id`): a
   * `{#id}` line above gives it exactly, reported if an earlier heading has it. No id depends on
   * a later heading, so none changes once written. A trailing `{#id}` stays part of the text and
   * is reported.
   */
  heading(at: number, depth: number, end: number): void {
    const attributes = this.enter(false);
    let from = at + depth;
    while (from < end && isSpace(this.src.charCodeAt(from))) from++;
    let to = end;
    // Each check first looks at the last character, so a plain heading copies nothing.
    const closing =
      this.src[end - 1] === "#" ? /(?:^|[ \t])#+$/.exec(this.src.slice(from, end)) : null;
    if (closing) to = from + closing.index;
    while (to > from && isSpace(this.src.charCodeAt(to - 1))) to--;
    // Search only the heading's own text, not back to the start of the source.
    const brace =
      this.src[to - 1] === "}" ? from + this.src.slice(from, to).lastIndexOf(" {") + 1 : from;
    if (brace > from && trailing(this.src, brace, to)) {
      this.report("trailing-heading-attributes", brace, to);
    }
    const explicit = attributes?.items.findLast((a) => a.key === "id");
    const data = { depth: depth as 1 | 2 | 3 | 4 | 5 | 6, id: "", idExplicit: !!explicit };
    const node = this.b.open("heading", at, data);
    const text = inline(this.b, this.src, [{ start: from, end: to }], false, true);
    this.b.close(end);
    if (explicit) {
      data.id = explicit.value;
      if (this.ids.has(data.id)) {
        this.report(
          "duplicate-id",
          explicit.start,
          explicit.end,
          `id \`${data.id}\` is already used by an earlier heading`,
        );
      } else this.ids.set(data.id, 0);
    } else {
      const base = slug(text);
      data.id = base;
      let n = this.ids.get(base);
      if (n === undefined) this.ids.set(base, 0);
      else {
        while (this.ids.has(data.id)) data.id = `${base}-${++n}`;
        this.ids.set(base, n);
        this.ids.set(data.id, 0);
      }
    }
    this.leafNode(node, end, attributes);
  }

  /** @prose
   * ## Fences
   *
   * Code, raw and math blocks share one leaf: an opening line, content lines and a closing line
   * (grammar: code-block, raw-block, math-block; `fence-length`, `fence-indent`, `math-close`).
   * The body range points at the source. The value is one slice of the source when the content
   * lines are the source as it is, one after another and split by `\n`. Otherwise a container
   * prefix, an indent, a tab or another line ending sits inside, and the lines are joined once.
   * Either way the value is a flat string, not a rope of a piece per line
   * ([Lessons](../docs/lessons.md#size)).
   */
  openFence(kind: "fence" | "math", at: number, indent: number, ticks: number, info: string): void {
    const attributes = this.enter(false);
    const end = this.trimmedEnd();
    this.leaf = {
      kind,
      start: at,
      end,
      head: end,
      closed: false,
      indent,
      ticks,
      info,
      body: null,
      lines: [],
      verbatim: true,
      attributes,
    };
  }

  continueLeaf(leaf: Exclude<Leaf, { kind: "paragraph" | "table" }>): void {
    const { src } = this;
    if (leaf.kind === "comment") {
      const close = this.lineIndex("-->", this.pos);
      if (close >= 0) {
        this.closeComment(close + 3);
      } else leaf.end = this.lineEnd;
      return;
    }
    const lineStart = this.pos;
    const closing =
      leaf.kind === "math"
        ? /^[ \t]*\$\$[ \t]*$/.test(src.slice(this.pos, this.lineEnd)) && this.indent().cols <= 3
        : this.closingFence("`") >= leaf.ticks;
    if (closing) {
      leaf.end = this.trimmedEnd();
      leaf.closed = true;
      if (!leaf.body) leaf.body = { start: lineStart, end: lineStart };
      this.closeLeaf();
      return;
    }
    const { cols } = this.indent();
    this.advance(Math.min(cols, leaf.indent));
    const text = " ".repeat(this.tab) + src.slice(this.tab ? this.pos + 1 : this.pos, this.lineEnd);
    leaf.verbatim &&=
      this.pos === lineStart &&
      !this.tab &&
      (!leaf.body || (leaf.body.end + 1 === lineStart && src[leaf.body.end] === "\n"));
    leaf.lines.push(text);
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
   * A block comment (grammar: comment, `comment-close`). One that shares its first line with
   * other text is left to the inline pass. It takes no attributes: an attribute line above it is
   * reported as having no block.
   */
  comment(at: number): boolean {
    const close = this.lineIndex("-->", at + 2);
    const oneLine = close >= 0;
    if (oneLine && this.src.slice(close + 3, this.lineEnd).trim() !== "") return false;
    this.closeLeaf();
    if (this.top.kind === "list") this.closeContainer();
    // A comment takes no attributes, so attribute lines above it have no block.
    this.flushPending(this.stack.length);
    const head = this.trimmedEnd();
    this.leaf = { kind: "comment", start: at, end: this.lineEnd, head, closed: false };
    if (oneLine) this.closeComment(close + 3);
    return true;
  }

  /** Where `token` is on the rest of the line from `from`, or -1: never a search past the line. */
  lineIndex(token: string, from: number): number {
    const at = this.src.slice(from, this.lineEnd).indexOf(token);
    return at < 0 ? -1 : from + at;
  }

  closeComment(end: number): void {
    const rest = this.src.slice(end, this.lineEnd);
    if (rest.trim() !== "") {
      this.report("comment-trailing-text", end, this.trimmedEnd());
      end = this.trimmedEnd();
    }
    const leaf = this.leaf as { end: number; closed: boolean };
    leaf.end = end;
    leaf.closed = true;
    this.closeLeaf();
  }

  /** @prose
   * ## List items
   *
   * An item is settled from its marker line alone (grammar: list): its content column
   * (`item-content`), whether it continues the list (`same-marker`, `ordinal`), and whether it
   * may interrupt a paragraph (`item-interrupts`).
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
      if (markerEnd === next || markerEnd - next > 9 || !/[.)]/.test(src[markerEnd] ?? "")) {
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
    if (this.leaf?.kind === "paragraph" && (empty || start !== 1)) return NONE_OPENED;

    const top = this.top;
    const same = top.kind === "list" && top.ordered === ordered && top.marker === marker;
    if (top.kind === "list" && !same) this.closeContainer();
    const attributes = this.enter(same);
    if (!same) {
      const node = this.b.open("list", next, { ordered, start, tight: true });
      if (attributes) this.b.setAttributes(node, attributes);
      const list = container("list", node, next);
      Object.assign(list, { ordered, marker, start });
      this.push(list);
    }

    this.skipTo(next);
    this.pos = markerEnd;
    this.col += markerEnd - next;
    const width = markerEnd - next;
    const after = this.indent(5).cols;
    let indent: number;
    if (empty || after >= 5) {
      indent = cols + width + 1;
      if (!empty) this.advance(1);
    } else {
      indent = cols + width + after;
      this.advance(after);
    }
    const node = this.b.open("listItem", next, { checked: null });
    if (same && attributes) this.b.setAttributes(node, attributes);
    const item = container("listItem", node, markerEnd);
    item.indent = indent;
    item.filled = !empty;
    this.push(item);
    return empty ? OPENED_EMPTY : OPENED;
  }

  /** @prose
   * ## Elements
   *
   * A `{@name …}` line opens a container, and `{@name … /}` or `[label]{@name … /}` is a leaf
   * (grammar: element; `element-name`, `leaf-label`, `leaf-slash`). An opening line can't
   * interrupt a paragraph or a table, but a leaf can, since a line ending in `/}` can't be prose
   * (`element-interrupts`). Attribute lines above an element merge into its own.
   *
   * A `{/name}` line that reaches here closed nothing at an element's own level (`line`), so it
   * stays text and is reported. A container left open when its own container closes, or at the
   * end, is reported at its opening line (`unclosed-element`): a leaf that lost its `/` is the
   * usual cause. A `{/name}` after a `{#name}` line says to write `{@name}`, the likeliest slip.
   */
  element(at: number, end: number, interrupting: boolean): boolean {
    const { src } = this;
    if (src[at + 1] === "/") {
      const name = CLOSE.exec(src.slice(at, end))?.[1];
      if (name) {
        if (!element(name, false))
          this.report(
            "element-name",
            at,
            end,
            `\`${name}\` is not an element name`,
            insteadOf(name, false),
          );
        else if (this.idLines?.has(name))
          this.report(
            "element-close",
            at,
            end,
            `\`{#${name}}\` sets an id: open the element with \`{@${name}}\``,
          );
        else this.report("element-close", at, end, `no open \`${name}\` element to close here`);
      } else {
        const close = braceEnd(src, at, end);
        if (close >= 0) this.report("attribute-syntax", at, close);
      }
      return false;
    }
    const head = parseElement(src, at, end);
    if (!head) {
      const close = braceEnd(src, at, end);
      if (close >= 0) this.report("attribute-syntax", at, close);
      return false;
    }
    if (head.attributes.end !== end) return false;
    if (!element(head.name, false)) {
      this.report(
        "element-name",
        at,
        end,
        `\`${head.name}\` is not an element name`,
        insteadOf(head.name, false),
      );
      return false;
    }
    if (!head.slash && interrupting) return false;
    const attributes = merge(this.enter(false), own(head.attributes));
    const kind = head.slash ? ("leaf" as const) : ("container" as const);
    const node = this.b.open("element", at, { kind, name: head.name });
    if (attributes) this.b.setAttributes(node, attributes);
    if (head.slash) {
      this.b.close(end);
      this.leafNode(node, end, undefined);
    } else {
      const c = container("element", node, end);
      c.name = head.name;
      c.head = { start: at, end };
      this.push(c);
    }
    return true;
  }

  /** `[label]{@name … /}`: a leaf with inline content. Any other `[…]{…}` line is a paragraph. */
  leafElement(at: number, end: number): boolean {
    const { src } = this;
    const close = labelEnd(src, at, end);
    if (close < 0 || src[close + 1] !== "{" || src[close + 2] !== "@") return false;
    const head = parseElement(src, close + 1, end);
    if (!head?.slash || head.attributes.end !== end) return false;
    if (!element(head.name, false)) {
      this.report(
        "element-name",
        at,
        end,
        `\`${head.name}\` is not an element name`,
        insteadOf(head.name, false),
      );
      return false;
    }
    const attributes = merge(this.enter(false), own(head.attributes));
    const node = this.b.open("element", at, { kind: "leaf", name: head.name });
    if (attributes) this.b.setAttributes(node, attributes);
    inline(this.b, src, [{ start: at + 1, end: close }]);
    this.b.close(end);
    this.leafNode(node, end, undefined);
    return true;
  }

  /** The name in a `{/name}` line at the cursor, indented at most three columns, or null. */
  closingLine(): string | null {
    const { cols, next } = this.indent();
    if (cols > 3 || this.src[next] !== "{" || this.src[next + 1] !== "/") return null;
    return CLOSE.exec(this.src.slice(next, this.lineEnd))?.[1] ?? null;
  }

  /** @prose
   * An element line straight after a table row, or after a paragraph in a blockquote or list
   * item, is read here as it is written. A formatter doesn't know elements, so it reads the line
   * as a lazy continuation and moves it into the row, quote or item. markz warns before that
   * happens, so the writer adds the blank line that keeps it out (grammar: `element-lazy-line`).
   * This asks before the line closes the open leaf, which is what tells the case, and the line is
   * reported once it proves to be an element. A line indented into the item stays there when
   * formatted, so it isn't one of these.
   */
  lazyBefore(): boolean {
    const { leaf, top } = this;
    if (leaf?.kind === "table") return true;
    if (leaf?.kind !== "paragraph") return false;
    if (top.kind === "blockquote") return true;
    return top.kind === "listItem" && this.indent(top.indent).cols < top.indent;
  }

  /** @prose
   * ## Block attributes
   *
   * A line holding only `{…}` decorates the next block (grammar: attributes, `attribute-line`).
   * If no block follows before the container ends, the lines are kept as a paragraph and
   * reported.
   */
  attributeLine(at: number, end: number): boolean {
    const attributes = parseAttributes(this.src, at, end);
    if (!attributes || attributes.end !== end || bareOnly(this.src, attributes)) return false;
    this.closeLeaf();
    if (this.top.kind === "list") this.closeContainer();
    const [only] = attributes.items;
    if (attributes.items.length === 1 && only!.key === "id")
      (this.idLines ??= new Set()).add(only!.value);
    const pending = this.pending;
    if (pending && pending.depth === this.stack.length) {
      // In place: copying the list on every line would be quadratic in the run's length.
      pending.attributes.items.push(...attributes.items);
      pending.attributes.end = attributes.end;
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
    if (src.slice(at, end).includes("}")) return;
    const close = this.braceAfter(end);
    if (close < 0) return;
    const attributes = parseAttributes(src, at, close + 1, true);
    if (attributes?.end === close + 1 && !bareOnly(src, attributes)) {
      this.report("multiline-attributes", at, close + 1);
    }
  }

  /**
   * The first `}` after `from`, or -1 when a blank line or the end comes first. The last scan is
   * kept: a later start inside the stretch it crossed has the same answer, so a run of unclosed
   * `{` lines is scanned once, not once per line.
   */
  braceAfter(from: number): number {
    const last = this.braceScan;
    if (last && from >= last.from && from <= last.to) return last.close;
    const { src } = this;
    let i = from;
    let close = -1;
    for (; i < src.length; i++) {
      const c = src.charCodeAt(i);
      if (c === 125) {
        close = i;
        break;
      }
      if (c === 10) {
        let j = i + 1;
        while (isSpace(src.charCodeAt(j))) j++;
        const d = src.charCodeAt(j);
        if (d === 10 || d === 13) break;
      }
    }
    this.braceScan = { from, to: i, close };
    return close;
  }

  /** Pending attributes whose container is closing become text. */
  flushPending(depth: number): void {
    const pending = this.pending;
    if (!pending || pending.depth !== depth) return;
    this.pending = null;
    const { lines } = pending;
    this.report("orphan-attributes", lines[0]!.start, lines.at(-1)!.end);
    const node = this.b.open("paragraph", lines[0]!.start);
    inline(this.b, this.src, lines);
    this.b.close(lines.at(-1)!.end);
    this.leafNode(node, lines.at(-1)!.end, undefined);
  }

  /** @prose
   * ## Paragraphs and tables
   *
   * Text that opens no block continues the open paragraph or table, or starts a paragraph
   * (grammar: paragraph, table). A delimiter row turns the paragraph's last line into a table
   * header (`table-header`, `table-columns`), which is why a paragraph's lines are held until it
   * closes; the lines before it stay a paragraph. Rows then run to `table-end`.
   */
  text(start: number, end: number): void {
    const leaf = this.leaf;
    if (leaf?.kind === "table") {
      this.row(start, end, leaf.columns);
      leaf.end = end;
      return;
    }
    if (leaf?.kind === "paragraph") {
      const header = leaf.lines.at(-1)!;
      const align = delimiterRow(this.src, start, end);
      if (
        align &&
        !leaf.indented &&
        cells(this.src, header.start, header.end).length === align.length
      ) {
        this.table(leaf, align, end);
        return;
      }
      leaf.lines.push({ start, end });
      leaf.indented = false;
      return;
    }
    const attributes = this.enter(false);
    this.leaf = { kind: "paragraph", lines: [{ start, end }], attributes, indented: false };
  }

  table(paragraph: Extract<Leaf, { kind: "paragraph" }>, align: Align[], end: number): void {
    const header = paragraph.lines.pop()!;
    // Attributes above the paragraph stay with it, unless the header was its only line.
    let attributes = paragraph.attributes;
    if (paragraph.lines.length > 0) {
      attributes = undefined;
      this.closeLeaf();
    } else this.leaf = null;
    const node = this.b.open("table", header.start, { align });
    if (attributes) this.b.setAttributes(node, attributes);
    this.row(header.start, header.end, align.length);
    this.leaf = { kind: "table", columns: align.length, end };
  }

  row(start: number, end: number, columns: number): void {
    this.b.open("tableRow", start);
    for (const cell of cells(this.src, start, end).slice(0, columns)) {
      this.b.open("tableCell", cell.start);
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
    if ((leaf.kind === "fence" || leaf.kind === "math" || leaf.kind === "comment") && !leaf.closed)
      this.unclosed(leaf);
    switch (leaf.kind) {
      case "paragraph": {
        const { lines } = leaf;
        for (let i = 0; i < lines.length - 1; i++) this.trailingSpaces(lines[i]!.end);
        const top = this.top;
        if (top.kind === "listItem" && top.children === 0) {
          const task = /^\[([ xX])\][ \t]+(?=\S)/.exec(src.slice(lines[0]!.start, lines[0]!.end));
          if (task) {
            b.setData(top.node, "listItem", { checked: task[1] !== " " });
            lines[0] = { start: lines[0]!.start + task[0].length, end: lines[0]!.end };
          }
        }
        const end = lines.at(-1)!.end;
        const node = b.open("paragraph", lines[0]!.start);
        inline(b, src, lines);
        b.close(end);
        this.leafNode(node, end, leaf.attributes);
        return;
      }
      case "fence":
      case "math": {
        const body = leaf.body ?? { start: leaf.end, end: leaf.end };
        const value =
          leaf.lines.length === 0
            ? ""
            : leaf.verbatim && src[body.end] === "\n"
              ? src.slice(body.start, body.end + 1)
              : [...leaf.lines, ""].join("\n");
        let node: NodeId;
        if (leaf.kind === "math") {
          node = b.leaf("math", leaf.start, leaf.end, {
            block: true,
            value,
            range: body,
          });
        } else if (/^=\S/.test(leaf.info)) {
          const format = leaf.info.slice(1).split(/[ \t]/)[0]!;
          node = b.leaf("raw", leaf.start, leaf.end, { format, value, range: body });
        } else {
          // Split before decoding, so a `&#9;` or `&#32;` stays inside its word.
          const space = leaf.info.search(/[ \t]/);
          const lang = decode(space < 0 ? leaf.info : leaf.info.slice(0, space));
          const meta = space < 0 ? "" : decode(leaf.info.slice(space).trim());
          node = b.leaf("code", leaf.start, leaf.end, {
            lang: lang || null,
            meta: meta || null,
            value,
            body,
          });
        }
        this.leafNode(node, leaf.end, leaf.attributes);
        return;
      }
      case "comment":
        this.leafNode(b.leaf("comment", leaf.start, leaf.end), leaf.end, undefined);
        return;
      case "table":
        b.close(leaf.end);
        this.top.end = Math.max(this.top.end, leaf.end);
        this.top.children++;
    }
  }

  /** @prose
   * A code, raw or math block, or a comment, that ends with its container or the document instead
   * of a closing line is reported at its opening line (grammar: `unclosed-block`). The block is
   * still read to the end, as CommonMark reads an unclosed fence. What follows the opening line
   * reads as code, math or nothing, which is rarely what the author meant.
   */
  unclosed(leaf: Exclude<Leaf, { kind: "paragraph" | "table" }>): void {
    const what =
      leaf.kind === "comment"
        ? "comment"
        : leaf.kind === "math"
          ? "`$$` block"
          : /^=\S/.test(leaf.info)
            ? "raw block"
            : "code fence";
    this.report("unclosed-block", leaf.start, leaf.head, `${what} is never closed`);
  }

  closeContainer(): void {
    this.flushPending(this.stack.length);
    const c = this.stack.pop()!;
    if (c.kind === "element") {
      c.run.end--;
      if (!c.closed) {
        this.report("unclosed-element", c.head.start, c.head.end, `\`${c.name}\` is never closed`);
      }
    }
    if (this.blockers.at(-1) === this.stack.length) this.blockers.pop();
    if (c.kind === "list") {
      this.b.setData(c.node, "list", { ordered: c.ordered, start: c.start, tight: c.tight });
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
      this.report("named-reference", at, at + m[0].length, `named character reference \`${m[0]}\``);
    }
  }

  /**
   * Two or more spaces ending a paragraph line are GFM's invisible hard break. They are counted
   * back from the line ending, so a tab before them doesn't hide them.
   */
  trailingSpaces(end: number): void {
    const { src } = this;
    let e = end;
    while (src[e] === " " || src[e] === "\t") e++;
    let i = e;
    while (i > end && src[i - 1] === " ") i--;
    if (e - i >= 2) this.report("trailing-spaces", i, e);
  }

  /** @prose
   * ## Cursor
   *
   * Columns follow tab stops of 4 (grammar: `indentation`). A prefix can end inside a tab (`>\tcode`); the
   * cursor then stays on the tab and `tab` counts its unread columns, which content reads as
   * spaces.
   */
  /** The columns of whitespace at the cursor, counting no further than `limit`, and where it ends. */
  indent(limit = Infinity): { cols: number; next: number } {
    const { src, lineEnd } = this;
    let i = this.pos;
    let col = this.col;
    let cols = 0;
    if (this.tab) {
      cols = this.tab;
      col += this.tab;
      i++;
    }
    for (; i < lineEnd && cols < limit; i++) {
      const c = src[i];
      if (c === " ") {
        cols++;
        col++;
      } else if (c === "\t") {
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
      } else if (src[this.pos] === " ") {
        this.pos++;
        this.col++;
        n--;
      } else if (src[this.pos] === "\t") {
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

  /**
   * Whether the rest of the line is whitespace. Many nested items can ask on one line, so where
   * the whitespace ends is kept: the cursor only moves forward, and from anywhere inside that
   * whitespace the answer is the same.
   */
  blank(): boolean {
    const { src, pos, lineEnd } = this;
    const last = this.space;
    if (last.lineEnd === lineEnd && pos >= last.from && pos <= last.to) return last.to === lineEnd;
    let i = pos;
    while (i < lineEnd && isSpace(src.charCodeAt(i))) i++;
    this.space = { lineEnd, from: pos, to: i };
    return i === lineEnd;
  }

  /** The first container from `from` that a blank line closes, or the stack's length. */
  blocker(from: number): number {
    const { blockers } = this;
    let lo = 0;
    let hi = blockers.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (blockers[mid]! < from) lo = mid + 1;
      else hi = mid;
    }
    return lo < blockers.length ? blockers[lo]! : this.stack.length;
  }

  trimmedEnd(): number {
    let end = this.lineEnd;
    while (end > this.pos && isSpace(this.src.charCodeAt(end - 1))) end--;
    return end;
  }

  report(code: WarningCode, start: number, end: number, message?: string, instead?: string): void {
    this.b.warn(code, start, end, message, instead);
  }
}

function container(kind: Container["kind"], node: NodeId, end: number): Container {
  return {
    kind,
    node,
    end,
    children: 0,
    born: 0,
    indent: 0,
    filled: true,
    name: "",
    head: { start: 0, end: 0 },
    run: { end: 0 },
    closed: false,
    ordered: false,
    marker: "",
    start: 1,
    tight: true,
  };
}

function merge(
  a: Attributes | undefined | null,
  b: Attributes | undefined | null,
): Attributes | undefined {
  if (!a) return b ?? undefined;
  if (!b) return a;
  return { start: a.start, end: b.end, items: [...a.items, ...b.items] };
}

/** An element's attributes, if it has any beyond its name. */
const own = (a: Attributes) => (a.items.length > 0 ? a : undefined);

/** A `{/name}` line, trailing whitespace allowed. */
const CLOSE = /^\{\/([A-Za-z][\w-]*)\}[ \t]*$/;
/** An element's opening, closing or leaf line, as far as a formatter could move it. */
const ELEMENT_LINE = /^(?:\{[@/]|\[.*\]\{@.*\/\}[ \t]*$)/;

/**
 * A colon container's own line (`:::name`, VitePress's `::: tip Title`, a closing `:::`) or a
 * bare leaf (`::name`). One with a label or attributes is the inline pass's to report.
 */
const COLON_LINE = /^(?::{3,}(?:[ \t]*[A-Za-z][^[{]*)?|:{2,}[A-Za-z][\w-]*)[ \t]*$/;

/** The `]` closing a label that opens at `at`, with nested brackets balanced; -1 if none. */
function labelEnd(src: string, at: number, end: number): number {
  let depth = 0;
  for (let i = at; i < end; i++) {
    const c = src[i];
    if (c === "\\") i++;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return i;
  }
  return -1;
}

/** A `{…}` that ends a heading and would be attributes, bare keys aside (`## Sets {a}`). */
function trailing(src: string, at: number, end: number): boolean {
  const attributes = parseAttributes(src, at, end);
  return attributes?.end === end && !bareOnly(src, attributes);
}

/** A metadata key line, as `parseMetadata` reads one. */
const KEY = /^[A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)*:(?:[ \t\r\n]|$)/;

/** @prose
 * ## Table rows
 *
 * A row's cells are split on `|`s that aren't escaped, after an optional leading and trailing
 * pipe, and each is trimmed (grammar: table, `table-columns`). The delimiter row's pipe or
 * colon is what keeps `Title` over `---` a setext case while `a` over `:-:` is a table.
 */
function cells(src: string, start: number, end: number): Range[] {
  let s = start;
  let e = end;
  if (src[s] === "|") s++;
  // A lone pipe, as GFM reads it, is a row with no cells; `||` has one.
  if (s > start && src.slice(s, e).trim() === "") return [];
  if (e > s && src[e - 1] === "|" && !escaped(src, e - 1, s)) e--;
  const out: Range[] = [];
  let from = s;
  for (let i = s; i <= e; i++) {
    if (i === e || (src[i] === "|" && !escaped(src, i, s))) {
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
  while (i - n - 1 >= from && src[i - n - 1] === "\\") n++;
  return n % 2 === 1;
}

function delimiterRow(src: string, start: number, end: number): Align[] | null {
  const line = src.slice(start, end);
  if (!line.includes("|") && !line.includes(":")) return null;
  const align: Align[] = [];
  for (const cell of cells(src, start, end)) {
    const text = src.slice(cell.start, cell.end);
    const m = /^(:?)-+(:?)$/.exec(text);
    if (!m) return null;
    align.push(m[1] && m[2] ? "center" : m[1] ? "left" : m[2] ? "right" : null);
  }
  return align.length ? align : null;
}

/** @prose
 * ## Heading ids
 *
 * The slug of `heading-id`, held to the vendored github-slugger fixtures, on the heading's plain
 * text: lowercased, with every character removed that
 * isn't alphabetic (any script's letters, and symbols such as `Ⓐ`), a mark, a decimal digit, a
 * connector such as `_`, `-` or a space, and then each space turned into `-`, one for one. That is
 * github-slugger's 8 KB character class, in four Unicode properties. A heading with nothing left
 * is `section`.
 */
function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\p{Alphabetic}\p{M}\p{Nd}\p{Pc} -]/gu, "")
      .replace(/ /g, "-") || "section"
  );
}
