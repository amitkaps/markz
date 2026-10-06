/** @prose
 * # Cases by construct
 *
 * Every construct held to its edges, with the grammar as the judge. A construct's own productions
 * write valid cases, and one-character edits of them write their neighbours: an edit the grammar
 * still accepts is a boundary case, and one it rejects is a near miss. For each, markz must read
 * the construct exactly when the grammar accepts the text. Where they part, a side rule decides,
 * and the case is settled by that rule's name here, so every gap between the productions and the
 * parser is either closed in the grammar or named.
 *
 * The grammar is never the parser: it recognizes a string, with no side rules, and markz is held
 * to it only where the productions can speak. What they can't (which of two readings wins, where
 * an unclosed construct ends) is written by hand, as dialect examples filed with their category.
 */
import fc from "fast-check";
import { parse, textContent, type Document, type NodeId, type NodeType } from "../../src/index";
import { productions, recognizer, type Expr } from "./ebnf";
import { CONSTRUCTS, DOCUMENT, PRODUCTIONS } from "./grammar";
import { row } from "./syntax";
import { grammarDocument } from "./generate";

/** @prose
 * ## Reading a case
 *
 * A block construct is its own document, and markz reads it when that document is the one block,
 * with nothing reported. An inline construct sits between words on a line (`a … a`), and markz
 * reads it when a node of its kind covers exactly its text, again with nothing reported. A
 * construct that makes no node of its own is read by what it leaves: metadata by the document's
 * metadata, attributes by the block after them, and an escape or smart punctuation by the one
 * character it becomes.
 */
interface Reading {
  /** Where the case sits in the document it is read in. */
  wrap: (s: string) => string;
  /** The grammar's view: the production the whole wrapped case must be. */
  grammar: string;
  made: (doc: Document, s: string) => boolean;
}

/** @prose
 * ### What a case makes
 *
 * Each construct's node, and the data its own delimiters decide: a heading's depth is its count
 * of `#`s, `**` makes strong and `~~` delete, `!` an image, a closing `/` a leaf element. These
 * come from the case's text by the construct's literals alone, never from markz's reading.
 */
type Expect = (doc: Document, n: NodeId, s: string) => boolean;
const first = (s: string) => body(s)[0] ?? "";
/** The first line's info string, after the fence and any spaces. */
const info = (s: string) => /^ {0,3}`+[ \t]*(.*?)[ \t]*$/.exec(first(s))?.[1] ?? "";

const BLOCKS: Record<string, Expect> = {
  paragraph: (d, n) => d.type(n) === "paragraph",
  heading: (d, n, s) =>
    d.type(n) === "heading" &&
    d.data(n, "heading").depth === /^ {0,3}(#+)/.exec(first(s))?.[1]?.length,
  blockquote: (d, n) => d.type(n) === "blockquote",
  list: (d, n, s) =>
    d.type(n) === "list" && d.data(n, "list").ordered === /^ {0,3}\d/.test(first(s)),
  "code-block": (d, n, s) => {
    if (d.type(n) !== "code") return false;
    const word = info(s).split(/[ \t]/)[0] || null;
    // Escapes and references in the info string decode, which the case's text can't show.
    return /[\\&]/.test(info(s)) || d.data(n, "code").lang === word;
  },
  "raw-block": (d, n, s) =>
    d.type(n) === "raw" && d.data(n, "raw").format === /^=(\S+)/.exec(info(s))?.[1],
  "math-block": (d, n) => d.type(n) === "math" && d.data(n, "math").block,
  table: (d, n) => d.type(n) === "table",
  "thematic-break": (d, n) => d.type(n) === "thematicBreak",
  element: (d, n, s) => {
    if (d.type(n) !== "element") return false;
    const line = first(s);
    const { kind, name } = d.data(n, "element");
    return kind === (/\/\}[ \t]*$/.test(line) ? "leaf" : "container") && line.includes(`{@${name}`);
  },
  comment: (d, n) => d.type(n) === "comment",
};

/** The node an emphasis case's opening run makes. */
const EMPHASIS: Record<string, NodeType> = {
  "**": "strong",
  "~~": "delete",
  _: "emphasis",
  "*": "emphasis",
};

const INLINES: Record<string, Expect> = {
  emphasis: (d, n, s) => d.type(n) === EMPHASIS[run(s).mark],
  "inline-code": (d, n) => d.type(n) === "inlineCode",
  link: (d, n, s) =>
    d.type(n) === (s.startsWith("!") ? "image" : "link") &&
    (d.type(n) === "image" || d.data(n, "link").autolink === s.startsWith("<")),
  span: (d, n, s) =>
    d.type(n) === "element" &&
    d.data(n, "element").kind === "inline" &&
    d.data(n, "element").name === (/\]\{@([a-z][a-z\d-]*)[^\]]*$/.exec(s)?.[1] ?? "span"),
  "inline-math": (d, n) => d.type(n) === "math" && !d.data(n, "math").block,
  // The code is read as the paragraph reads its lines: joined by `\n`, each trimmed.
  expression: (d, n, s) =>
    d.type(n) === "expression" &&
    d.data(n, "expression").code === s.slice(2, -1).replace(/[ \t]*(?:\r\n?|\n)[ \t]*/g, "\n"),
  "line-break": (d, n) => d.type(n) === "break",
};

const one = (doc: Document) => {
  const kids = [...doc.children(doc.root)];
  return kids.length === 1 ? kids[0]! : null;
};

/** Whether some node covering exactly `start` to `end` is what the case makes. */
function covering(doc: Document, expect: Expect, s: string, start: number, end: number): boolean {
  const visit = (n: NodeId): boolean =>
    (doc.start(n) === start && doc.end(n) === end && expect(doc, n, s)) ||
    [...doc.children(n)].some(visit);
  return visit(doc.root);
}

const between = (s: string) => `a ${s} a\n`;
/**
 * The paragraph's text is `a`, the one character the case became, and `a`. An escape starts with
 * `\\` or `&`, and smart punctuation with the mark it curls or joins.
 */
const becomesOne = (starts: RegExp) => (doc: Document, s: string) => {
  const text = textContent(doc);
  // By code point: an astral character, such as `&#128512;` makes, is one.
  const inner = Array.from(text.slice(2, -2));
  return (
    starts.test(s) &&
    text.startsWith("a ") &&
    text.endsWith(" a") &&
    inner.length === 1 &&
    inner[0] !== s
  );
};

export function reading(id: string): Reading {
  const block = BLOCKS[id];
  if (block) {
    return {
      wrap: (s) => s,
      grammar: "blank-line* $ blank-line*",
      made: (doc, s) => {
        const n = one(doc);
        return n !== null && block(doc, n, s);
      },
    };
  }
  const inline = INLINES[id];
  if (inline) {
    return {
      wrap: between,
      grammar: "$",
      made: (doc, s) =>
        covering(doc, inline, s, 2, 2 + s.length) ||
        // A soft break is no node: it leaves one paragraph of two lines.
        (id === "line-break" &&
          /^(?:\r\n?|\n)$/.test(s) &&
          doc.type(one(doc) ?? 0) === "paragraph"),
    };
  }
  if (id === "metadata") {
    return { wrap: (s) => s, grammar: "$ (char | line-end)*", made: (doc) => !!doc.metadata };
  }
  if (id === "attributes") {
    return {
      wrap: (s) => `${s}\na\n`,
      grammar: "blank-line* block-attributes blank-line*",
      made: (doc) => {
        const n = one(doc);
        return n !== null && doc.type(n) === "paragraph" && doc.attributes(n) !== undefined;
      },
    };
  }
  const starts = id === "escape" ? /^[\\&]/ : /^["'.-]/;
  return { wrap: between, grammar: "$", made: becomesOne(starts) };
}

/** @prose
 * ## Judging
 *
 * The grammar judges the case, wrapped in what its reading allows around it (blank lines around
 * a block). markz reads it when it makes the construct and reports nothing: a construct made with
 * a warning is markz saying the text was not quite it, as the grammar does by rejecting it.
 *
 * Where the two part, the case is settled, never skipped. A Not supported warning settles it by
 * its row: the text holds a form the dialect cuts, which the productions have no word for, and
 * markz said so. Any other warning settles it by the side rule that warning enforces (`WARNED`).
 * Otherwise one of the side rules must claim it, by name, with a test of its own.
 */
const wrappers = new Map<string, (s: string) => boolean>();

export function grammarAccepts(id: string, s: string): boolean {
  let judge = wrappers.get(id);
  const r = reading(id);
  if (!judge) {
    const [p] = productions(`case ::= ${r.grammar.replace("$", id)}`);
    const m = recognizer(new Map([...PRODUCTIONS, ["case", { ...p!, construct: null }]]));
    judge = (text) => m("case", text);
    wrappers.set(id, judge);
  }
  // The last line may end at the end of the document (the document's `last-line` rule).
  const ended = r.wrap === between || s === "" || /[\r\n]$/.test(s) ? s : `${s}\n`;
  return judge(ended);
}

export type Verdict =
  | { agree: true; accepted: boolean }
  | { agree: false; grammar: boolean; settled: string | null };

export function judge(id: string, s: string): Verdict {
  const r = reading(id);
  const doc = parse(r.wrap(s));
  const read = doc.warnings.length === 0 && r.made(doc, s);
  const grammar = grammarAccepts(id, s);
  if (read === grammar) return { agree: true, accepted: grammar };
  const cut = doc.warnings.find((w) => row(w.code));
  if (cut) return { agree: false, grammar, settled: cut.code };
  const warned = doc.warnings.find((w) => WARNED[w.code]);
  if (warned) return { agree: false, grammar, settled: WARNED[warned.code]! };
  const rules = { ...EVERYWHERE, ...SETTLED[id] };
  const rule = Object.entries(rules).find(([, test]) => test(s, id));
  return { agree: false, grammar, settled: rule?.[0] ?? null };
}

/** @prose
 * ## Settled by a side rule
 *
 * Each test recognizes the one thing its rule decides and nothing wider, so a case it claims is
 * one the rule's text explains. Most are about lines, which the productions read one at a time:
 * a construct whose content runs onto a second line, a fence that closes before the last line, a
 * container whose later lines carry a prefix.
 */
const LINE_END = /\r\n|\r|\n/;
const isBlank = (line: string) => /^[ \t]*$/.test(line);
/** The case's lines, without the blank ones before and after it. */
function body(s: string): string[] {
  const lines = s.split(LINE_END);
  while (lines.length && isBlank(lines[0]!)) lines.shift();
  while (lines.length && isBlank(lines.at(-1)!)) lines.pop();
  return lines;
}
const multiline = (s: string) => body(s).length > 1;

/** A line after the opening one, and before the last, that would close a fence of `mark`. */
const closesEarly = (mark: string) => (s: string) => {
  const lines = body(s);
  const open = new RegExp(`^ {0,3}(\\${mark}+)`).exec(lines[0] ?? "")?.[1]?.length ?? 0;
  const close = new RegExp(`^ {0,3}(\\${mark}+)[ \\t]*$`);
  return lines.slice(1, -1).some((l) => (close.exec(l)?.[1]?.length ?? 0) >= open);
};

/** How many columns a line's leading spaces and tabs reach, a tab stopping at a multiple of four. */
function columns(line: string): number {
  let n = 0;
  for (const c of line) {
    if (c === " ") n++;
    else if (c === "\t") n += 4 - (n % 4);
    else break;
  }
  return n;
}

/** Whether a line on its own opens a block other than a paragraph, by the grammar. */
const opens = (line: string) =>
  OPENERS.some((id) => grammarAccepts(id, `${line}\n`) && !isBlank(line));
const OPENERS = [
  "heading",
  "blockquote",
  "list",
  "code-block",
  "raw-block",
  "math-block",
  "thematic-break",
  "element",
  "comment",
];

/** A table row's cells: split on pipes a backslash doesn't escape, outer pipes dropped. */
function cells(line: string): number {
  const pipes: number[] = [];
  const text = line.trim();
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === "|") pipes.push(i);
  }
  const inner = pipes.filter((p) => p !== 0 && p !== text.length - 1).length;
  const empty = text.replace(/^\|/, "").replace(/\|$/, "") === "";
  return empty ? (pipes.length ? 0 : 1) : inner + 1;
}

/** The delimiter run a case of emphasis opens and closes with, and what lies between. */
function run(s: string): { mark: string; inner: string } {
  const mark = ["**", "~~", "_", "*"].find((m) => s.startsWith(m) && s.endsWith(m)) ?? "";
  return { mark, inner: s.slice(mark.length, s.length - mark.length) };
}

/** A bracket in `text` that no partner balances, skipping escaped ones. */
function unbalanced(text: string): boolean {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\\") i++;
    else if (text[i] === "[") depth++;
    else if (text[i] === "]" && --depth < 0) return true;
  }
  return depth !== 0;
}

/** The text between a link or label's first `[` and the `]` that closes the case's brackets. */
const label = (s: string) => s.slice(s.indexOf("[") + 1, s.lastIndexOf("]"));

type Test = (s: string, id: string) => boolean;

/** @prose
 * The document's rules can decide a case of any construct: a blank line inside it ends it, a
 * line that opens another block ends the paragraph an inline construct sits in, and deep
 * indentation opens nothing.
 */
export const EVERYWHERE: Record<string, Test> = {
  "blank-lines": (s, id) => {
    const lines = BLOCKS[id] || id === "metadata" ? body(s) : between(s).split(LINE_END);
    return lines.length === 0 || lines.slice(0, -1).some(isBlank);
  },
  "paragraph-lines": (s, id) =>
    (id === "paragraph" ? body(s) : BLOCKS[id] ? [] : s.split(LINE_END)).slice(1).some(opens),
  "block-order": (s, id) => id === "paragraph" && opens(body(s)[0] ?? ""),
  indentation: (s) => body(s).some((l) => columns(l) >= 4),
};

/** @prose
 * A warning that isn't a Not supported row reports a construct markz read but not as written,
 * and each is named after, or by, the side rule it enforces.
 */
export const WARNED: Record<string, string> = {
  "element-close": "element-close",
  "unclosed-element": "unclosed-element",
  "unclosed-block": "unclosed-block",
  "attribute-syntax": "attribute-syntax",
  "orphan-attributes": "attribute-line",
  "comment-trailing-text": "comment-close",
  "duplicate-id": "heading-id",
  "metadata-unclosed": "metadata-start",
  "metadata-indented": "metadata-continuation",
  "metadata-line": "metadata-start",
  "metadata-duplicate-key": "metadata-keys",
  "metadata-value": "plain-value",
};

export const SETTLED: Record<string, Record<string, Test>> = {
  heading: { "heading-line": multiline },
  blockquote: { "container-prefix": multiline },
  list: { "container-prefix": multiline },
  "code-block": { "fence-length": closesEarly("`") },
  "raw-block": { "fence-length": closesEarly("`") },
  "math-block": {
    "math-close": closesEarly("$"),
    "math-one-line": (s) => /^ {0,3}\$\$[$ \t]*\$\$[ \t]*$/.test(body(s)[0] ?? ""),
  },
  table: {
    "table-columns": (s) => {
      const [header = "", delimiter = ""] = body(s);
      return cells(header) !== cells(delimiter) || cells(header) === 0 || !/[|:]/.test(delimiter);
    },
    "table-header": (s) => body(s).slice(0, 2).some(opens),
    "table-end": (s) => body(s).slice(2).some(opens),
    // The productions can read a blank line as a row of one empty cell.
    "blank-lines": (s) => EVERYWHERE["blank-lines"]!(s, "table") || isBlank(s.split(LINE_END)[0]!),
  },
  comment: {
    "comment-close": (s) => {
      const closed = /^ {0,3}<!--(?:-?>|[\s\S]*?-->)[^\r\n]*/.exec(s);
      return !!closed && body(s.slice(closed[0].length)).length > 0;
    },
  },
  element: {
    brackets: (s) => /^\s*\[/.test(s) && unbalanced(label(first(s))),
    "leaf-label": (s) => /^\s*\[/.test(s) && /[\r\n]/.test(label(s)),
    "element-close": (s) => {
      const name = /\{@([A-Za-z][\w-]*)/.exec(first(s))?.[1];
      const close = new RegExp(`^ {0,3}\\{/${name}\\}[ \\t]*$`);
      return (
        !!name &&
        body(s)
          .slice(1, -1)
          .some((l) => close.test(l))
      );
    },
  },
  attributes: {
    "attribute-boolean": (s) => /^\s*\{\s*(?:[A-Za-z][\w:-]*\s*)*\}\s*$/.test(s),
  },
  emphasis: {
    flanking: (s) => {
      const { inner } = run(s);
      return inner === "" || /^\s/.test(inner) || /\s$/.test(inner);
    },
    "nearest-opener": (s) => {
      const { mark, inner } = run(s);
      return mark !== "" && inner.includes(mark[0]!);
    },
    "escape-binds": (s) => /(?:^|[^\\])(?:\\\\)*\\$/.test(run(s).inner),
  },
  "inline-code": {
    "code-run": (s) => {
      if (/^`+$/.test(s)) return true;
      const open = /^`+/.exec(s)![0].length;
      const close = /`+$/.exec(s)![0].length;
      const inner = s.slice(open, s.length - close);
      return open !== close || (inner.match(/`+/g) ?? []).some((r) => r.length === open);
    },
  },
  expression: {
    "brace-depth": (s) => {
      let depth = 0;
      for (let i = 1; i < s.length; i++) {
        depth += s[i] === "{" ? 1 : s[i] === "}" ? -1 : 0;
        if (depth === 0) return i !== s.length - 1;
      }
      return true;
    },
  },
  link: { brackets: (s) => unbalanced(label(s)) },
  span: { brackets: (s) => unbalanced(label(s)) },
};

/** @prose
 * ## Edges
 *
 * A valid case and its neighbours: every one-character deletion, and every insertion of a
 * character the construct's own productions use (its literals, and one of each range of its
 * character classes), a letter, a space or a line ending. Most neighbours cross a boundary the
 * grammar draws (a seventh `#`, a missing space, a fence one backtick short), which is what makes
 * them worth reading. The valid cases are kept plain (letters, one repeat, shallow nesting), so
 * an edit, not the generator's noise, decides each neighbour.
 */
export function neighbours(id: string, s: string): string[] {
  const chars = [...new Set([...literals(id), "a", " ", "\n"])];
  const out = new Set<string>();
  for (let i = 0; i <= s.length; i++) {
    if (i < s.length) out.add(s.slice(0, i) + s.slice(i + 1));
    for (const c of chars) out.add(s.slice(0, i) + c + s.slice(i));
  }
  out.delete(s);
  return [...out];
}

/** The characters of a construct's own literals, and the first of each range its classes admit. */
function literals(id: string): string[] {
  const out = new Set<string>();
  const visit = (e: Expr) => {
    if (e.kind === "literal") for (const c of e.text) out.add(c);
    else if (e.kind === "class" && !e.negated) {
      for (const [a] of e.ranges) out.add(String.fromCodePoint(a));
    } else if (e.kind === "seq") e.items.forEach(visit);
    else if (e.kind === "alt") e.options.forEach(visit);
    else if (e.kind === "repeat") visit(e.item);
  };
  for (const p of PRODUCTIONS.values()) if (p.construct === id) visit(p.expr);
  return [...out];
}

export function valid(id: string, count: number, seed: number): string[] {
  return fc.sample(grammarDocument({ alphabet: "ab", depth: 1, repeats: 1 }, id), {
    numRuns: count,
    seed,
  });
}

/** @prose
 * A construct's search: its valid cases and their neighbours, counted by the edge each reached,
 * with every case markz and the grammar read differently that nothing settles. The test holds
 * the counts above zero and the unsettled list empty, and the Conformance page shows the counts.
 */
export interface Reached {
  valid: number;
  boundary: number;
  "near-miss": number;
  unsettled: string[];
}

export function edges(id: string, runs: number, seed: number): Reached {
  const reached: Reached = { valid: 0, boundary: 0, "near-miss": 0, unsettled: [] };
  for (const s of valid(id, runs, seed)) {
    const v = judge(id, s);
    if (v.agree && v.accepted) reached.valid++;
    else if (!v.agree && !v.settled) reached.unsettled.push(`valid ${JSON.stringify(s)}`);
    for (const n of neighbours(id, s)) {
      const w = judge(id, n);
      if (w.agree) reached[w.accepted ? "boundary" : "near-miss"]++;
      else if (!w.settled) {
        const side = w.grammar ? "grammar accepts" : "markz reads";
        reached.unsettled.push(`only ${side} ${JSON.stringify(n)}`);
      }
    }
  }
  return reached;
}

export const constructIds = CONSTRUCTS.map((c) => c.id);

/** Every side rule's name, the document's and each construct's. */
export const sideRules = new Set([DOCUMENT, ...CONSTRUCTS].flatMap((c) => Object.keys(c.rules)));

/** @prose
 * ## Edges a construct can't have
 *
 * A construct with no closing mark can't be left unclosed, and one the productions alone tell
 * from every other reading has no ambiguous case. Each says so here instead of having an example.
 */
export const EDGES: Record<string, Partial<Record<"ambiguous" | "unclosed", string>>> = {
  paragraph: {
    unclosed: "A paragraph has no closing mark: a blank line or another block ends it.",
  },
  heading: { unclosed: "A heading is one line, and its closing `#`s are optional." },
  blockquote: { unclosed: "A blockquote has no closing mark: a line without `>` ends it." },
  list: { unclosed: "A list has no closing mark: it ends where a line fits no item." },
  "raw-block": {
    ambiguous:
      "The productions alone tell it from a code block: an info string never starts with `=`.",
  },
  table: { unclosed: "A table has no closing mark: it ends at a line that is not a row." },
  "thematic-break": { unclosed: "A thematic break is one line, with nothing to close." },
  "line-break": { unclosed: "A line break is one mark, with nothing to close." },
  "smart-punctuation": {
    unclosed: "A quote curls by the side it sits on, not by pairing, so nothing is left open.",
  },
};
