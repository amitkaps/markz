/** @prose
 * # Ids
 *
 * Every id `html()` writes, which is everything a link to `#id` can land on, for a link checker
 * or a contents list. Each comes with its node, its label, and whether it was `written` as
 * `{#id}` or made from a heading's words.
 *
 * The ids are all claimed while parsing (grammar: attributes; `attribute-id`), so this is a walk
 * that reads them back in source order, a block's before the spans inside it. An id is listed
 * once for each node that carries it, so a `duplicate-id` shows twice. The id `html()` writes is
 * an item's last, and an id it drops (`html()`'s Attributes) isn't listed.
 *
 * # Labels
 *
 * A label is what a link to the id could show: a heading's words, the label of a link, a span or
 * a leaf element, or an image's alt. It is the node's text as `textContent` reads it, so it can
 * be a name and not the id. A block other than a heading has no label, only contents, so its
 * label is `null`, and its node gives the contents through `textContent`. That also keeps a
 * section wrapped in an element from being read again for every id inside it.
 *
 * # What isn't listed
 *
 * An id holding `${…}` is written `id="…"`, since `#…` can't hold one. It is listed as written,
 * as `html()` writes it, though it is known only as it renders and so claims nothing. An empty id
 * is no target. markz makes no ids of its own beyond a heading's, since footnotes are
 * cut, and a test holds the list to the `id="…"` that `html()` writes for every document in the
 * harness.
 */
import type { Document, NodeId } from "./ast";
import { unsafe } from "./html";
import { textContent, walk } from "./walk";

/** An id `html()` writes, on its node, with the node's label. */
export interface Id {
  id: string;
  node: NodeId;
  /** Set by `{#id}`, rather than made from a heading's words. */
  written: boolean;
  /** A heading's words, an inline node's text or an image's alt; `null` for any other block. */
  label: string | null;
}

/** Every id `html()` writes, in source order. */
export function ids(doc: Document): Id[] {
  const out: Id[] = [];
  walk(doc, {
    enter(node) {
      const type = doc.type(node);
      // `html()` writes no attributes for these, and nothing inside metadata or a comment.
      if (type === "metadata" || type === "comment" || type === "raw") return false;
      let id: string | undefined;
      let written = true;
      if (type === "heading") ({ id, written } = doc.data(node, "heading"));
      else {
        const item = doc.attributes(node)?.items.findLast((a) => a.key === "id");
        if (item && !unsafe(item.value)) id = item.value;
      }
      if (id) out.push({ id, node, written, label: label(doc, node) });
      return true;
    },
  });
  return out;
}

function label(doc: Document, node: NodeId): string | null {
  switch (doc.type(node)) {
    case "image":
      return doc.data(node, "image").alt;
    case "element":
      // An inline or leaf element's label is its children, and a container holds blocks.
      return doc.data(node, "element").kind === "container" ? null : textContent(doc, node);
    case "heading":
    case "link":
      return textContent(doc, node);
    default:
      return null;
  }
}

/** One heading in a document's outline, with the id `html()` gives it. */
export interface Heading extends Id {
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
}

/** @prose
 * # Headings
 *
 * The outline of a document, for a table of contents or a "jump to" list: the ids on headings,
 * each with its depth.
 *
 * A heading counts wherever it sits, in a blockquote, list item or element too. It is a flat
 * list, not a tree. Depth is data, and how to nest, number or filter by it is the consumer's
 * choice, which is why it isn't part of `html()`. `node` gives the source range through
 * `doc.start` and `doc.end`.
 */
export function headings(doc: Document): Heading[] {
  const out: Heading[] = [];
  for (const id of ids(doc)) {
    if (doc.type(id.node) === "heading")
      out.push({ ...id, label: id.label!, depth: doc.data(id.node, "heading").depth });
  }
  return out;
}
