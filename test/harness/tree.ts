/** @prose
 * # Tree invariants
 *
 * What every `Document` must satisfy, whatever produced it: one tree rooted at 0 that reaches every
 * node exactly once, parent links that agree with child links, and ranges that nest inside their
 * parent and follow each other in sibling order. The AST tests check hand-built trees with it, and
 * the parser tests check every parsed document with it from step 4 on.
 */
import { expect } from "vite-plus/test";
import { NONE, type Document, type NodeId } from "../../src/index";

export function expectTree(doc: Document): void {
  expect(doc.type(doc.root)).toBe("document");
  expect(doc.parent(doc.root)).toBe(NONE);
  expect(doc.nextSibling(doc.root)).toBe(NONE);
  expect(doc.end(doc.root)).toBe(doc.source.length);

  const seen = new Set<NodeId>([doc.root]);
  const visit = (node: NodeId): void => {
    expect(doc.start(node)).toBeLessThanOrEqual(doc.end(node));
    let previousEnd = doc.start(node);
    for (const child of doc.children(node)) {
      expect(seen.has(child), `node ${child} reached twice`).toBe(false);
      seen.add(child);
      expect(doc.parent(child)).toBe(node);
      expect(doc.start(child)).toBeGreaterThanOrEqual(previousEnd);
      expect(doc.end(child)).toBeLessThanOrEqual(doc.end(node));
      previousEnd = doc.end(child);
      visit(child);
    }
  };
  visit(doc.root);
  expect(seen.size).toBe(doc.size);
}
