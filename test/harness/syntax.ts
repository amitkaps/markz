/** @prose
 * # The dialect's outline
 *
 * `syntax.md` read as data, so the tests can hold it and the grammar together. It's read with
 * `ids`, so a sample inside a fence is never mistaken for the page.
 *
 * Each construct is found by the id on the `{#id}` line above its heading. Each warning code is a
 * span with its own id, like `` [`raw-html`]{#raw-html} ``, which opens its Not supported row or
 * sits where its construct names it.
 *
 * The grammar says which constructs exist and where they belong, and this reads what the page
 * says about them. Nothing here depends on wording. Headings and cells can be reworded as long as
 * the ids and the codes stay.
 */
import syntax from "../../docs/syntax.md?raw";
import { headings, ids, parse, type NodeId, type WarningCode } from "../../src/index";

export type Part = "Metadata" | "Block" | "Inline" | "Not supported";

/** A construct as `syntax.md` presents it. */
export interface Anchor {
  id: string;
  title: string;
  /** The `##` section it sits under. */
  part: string;
}

export interface Row {
  code: WarningCode;
  /** The Syntax cell. */
  syntax: string;
  instead: string;
  /** Metadata, block or inline forms. */
  group: string;
}

const doc = parse(syntax);
const outline = headings(doc);
// The nearest heading of a depth above a node.
const above = (node: NodeId, depth: number) =>
  outline.findLast((h) => h.depth === depth && doc.start(h.node) <= doc.start(node))?.label ?? "";

/** Each construct, from the `{#id}` written above its heading, with the part it sits under. */
export const anchors: Anchor[] = outline
  .filter((h) => h.written && h.depth <= 3)
  .map((h) => ({ id: h.id, title: h.label, part: above(h.node, 2) }));

export const anchor = (id: string): Anchor | undefined => anchors.find((a) => a.id === id);

const spans = ids(doc).filter((i) => i.written && doc.type(i.node) === "element");
const cell = (node: NodeId) => syntax.slice(doc.start(node), doc.end(node));

/** Each Not supported row, from the code's span that opens it, with the Syntax and Write
 *  instead cells as written. */
export const rows: Row[] = spans.flatMap(({ id, node }) => {
  const opens = doc.parent(node);
  if (doc.type(opens) !== "tableCell" || above(node, 2) !== "Not supported") return [];
  const [, syntax, instead] = [...doc.children(doc.parent(opens))].map(cell);
  return [{ code: id as WarningCode, syntax: syntax!, instead: instead!, group: above(node, 3) }];
});

export const row = (code: string): Row | undefined => rows.find((r) => r.code === code);

/** Every code `syntax.md` gives an id, as a span whose text is the id, in source order. */
export const stated: string[] = spans.map(({ id, label }) =>
  label === id ? id : `${label} ≠ ${id}`,
);

/** Where a section belongs: a construct's part, or Not supported for a row's code. */
export function part(section: string): Part | undefined {
  const a = anchor(section);
  if (a) return a.part as Part;
  return row(section) ? "Not supported" : undefined;
}

/** What the site shows for a section: the construct's heading, or the row's code. */
export const title = (section: string): string => anchor(section)?.title ?? section;
