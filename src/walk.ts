/** @prose
 * # Walking
 *
 * The one traversal consumers need, since every transformation of a markz document is a fold
 * (design: Read-only, and transformations are folds). `walk` visits a subtree depth-first, calling
 * `enter` before a node's children and `exit` after them. It follows the parent and sibling
 * columns rather than recursing, so a deeply nested document can't overflow the stack, and it
 * allocates nothing. `enter` returning `false` skips that node's children; its `exit` still runs.
 */
import { NONE, type Document, type NodeId } from "./ast";

export interface Visitor {
  enter?(node: NodeId): boolean | void;
  exit?(node: NodeId): void;
}

export function walk(doc: Document, visitor: Visitor, from: NodeId = doc.root): void {
  let node = from;
  for (;;) {
    const child = visitor.enter?.(node) === false ? NONE : doc.firstChild(node);
    if (child !== NONE) {
      node = child;
      continue;
    }
    for (;;) {
      visitor.exit?.(node);
      if (node === from) return;
      const next = doc.nextSibling(node);
      if (next !== NONE) {
        node = next;
        break;
      }
      node = doc.parent(node);
    }
  }
}

/** @prose
 * ## Text content
 *
 * The text `html()` writes for a node, as a browser's `textContent` would read it back: escapes
 * decoded, punctuation curled, code, math and expressions as written, a hard break as a line
 * ending. Images, comments, metadata and raw
 * blocks add nothing. Blocks are joined with nothing between them, as in the DOM.
 */
export function textContent(doc: Document, node: NodeId = doc.root): string {
  let out = "";
  walk(
    doc,
    {
      enter(n) {
        switch (doc.type(n)) {
          case "text":
            out += doc.data(n, "text").value;
            break;
          case "inlineCode":
            out += doc.data(n, "inlineCode").value;
            break;
          case "code":
            out += doc.data(n, "code").value;
            break;
          case "math":
            out += doc.data(n, "math").value;
            break;
          case "expression":
            out += doc.source.slice(doc.start(n), doc.end(n));
            break;
          case "break":
            out += "\n";
            break;
          case "image":
            return false;
        }
        return true;
      },
    },
    node,
  );
  return out;
}

/** @prose
 * ## Headings
 *
 * The outline of a document, for a table of contents or a "jump to" list: every heading in source
 * order, wherever it sits (a heading in a blockquote, list item or element counts), with the id
 * `html()` writes for it, so a link to `#id` lands on it. It is a flat list, not a tree: depth is
 * data, and how to nest, number or filter by it is the consumer's choice, which is why it isn't
 * part of `html()`. `node` gives the source range through `doc.start` and `doc.end`.
 */
export interface Heading {
  node: NodeId;
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  id: string;
  text: string;
}

export function headings(doc: Document): Heading[] {
  const out: Heading[] = [];
  walk(doc, {
    enter(node) {
      const type = doc.type(node);
      if (type === "heading") {
        const { depth, id } = doc.data(node, "heading");
        out.push({ node, depth, id, text: textContent(doc, node) });
        return false;
      }
      // Headings are blocks, so nothing inside a paragraph, a table or code holds one.
      return type !== "paragraph" && type !== "table" && type !== "code";
    },
  });
  return out;
}
