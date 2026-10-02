/** @prose
 * Hand-built trees, since the parser doesn't exist yet: the builder's links and ranges, the
 * document's accessors, and the type check on `data`.
 */
import { describe, expect, it } from "vite-plus/test";
import { Builder, NONE, T } from "./ast";
import { expectTree } from "../test/harness/tree";

// `# Hi\n\n> a _b_\n`, built the way the parser will build it.
const source = "# Hi\n\n> a _b_\n";

function build() {
  const b = new Builder(source);
  const heading = b.open("heading", 0, { depth: 1, id: "hi", idExplicit: false });
  b.leaf("text", 2, 4, { value: "Hi" });
  b.close(4);
  const quote = b.open("blockquote", 6);
  const paragraph = b.open("paragraph", 8);
  b.leaf("text", 8, 10, { value: "a " });
  b.open("emphasis", 10);
  b.leaf("text", 11, 12, { value: "b" });
  b.close(13);
  b.close(13);
  b.close(13);
  b.warn("bare-url", 8, 9);
  return { doc: b.finish(), heading, quote, paragraph };
}

describe("Builder and Document", () => {
  it("builds a tree that satisfies the invariants", () => {
    const { doc } = build();
    expectTree(doc);
    expect(doc.size).toBe(8);
  });

  it("links children in order", () => {
    const { doc, heading, quote, paragraph } = build();
    expect([...doc.children(doc.root)]).toEqual([heading, quote]);
    expect([...doc.children(quote)]).toEqual([paragraph]);
    expect([...doc.children(paragraph)].map((n) => doc.type(n))).toEqual(["text", "emphasis"]);
    expect(doc.firstChild(doc.firstChild(paragraph))).toBe(NONE);
    expect(doc.parent(paragraph)).toBe(quote);
  });

  it("keeps ranges, markers included", () => {
    const { doc, heading, quote } = build();
    expect(source.slice(doc.start(heading), doc.end(heading))).toBe("# Hi");
    expect(source.slice(doc.start(quote), doc.end(quote))).toBe("> a _b_");
  });

  it("reads side-table data only as the node’s own type", () => {
    const { doc, heading, quote } = build();
    expect(doc.data(heading, "heading")).toEqual({ depth: 1, id: "hi", idExplicit: false });
    expect(() => doc.data(quote, "heading")).toThrow(TypeError);
    expect(doc.attributes(heading)).toBeUndefined();
  });

  it("keeps warnings, with the code’s message and instead", () => {
    expect(build().doc.warnings).toEqual([
      {
        code: "bare-url",
        start: 8,
        end: 9,
        message: "bare URL",
        instead: "`<https://…>` or `[text](url)`",
      },
    ]);
  });

  it("refuses to finish with open nodes, or to close the root", () => {
    const b = new Builder("x");
    expect(() => b.close(1)).toThrow();
    b.open("paragraph", 0);
    expect(() => b.finish()).toThrow("1 nodes left open");
  });

  it("grows past its initial capacity", () => {
    const b = new Builder("");
    for (let i = 0; i < 1000; i++) b.leaf("thematicBreak", 0, 0);
    const doc = b.finish();
    expect(doc.size).toBe(1001);
    expectTree(doc);
  });

  it("exposes metadata from the root’s first child", () => {
    const b = new Builder("---\na: 1\n---\n");
    b.leaf("metadata", 0, 13, { value: { a: 1 }, range: { start: 4, end: 9 } });
    b.setAttributes(1, { start: 0, end: 0, items: [] });
    const doc = b.finish();
    expect(doc.metadata).toEqual({ a: 1 });
    expect(new Builder("").finish().metadata).toBeUndefined();
  });

  it("names every type in code order", () => {
    const b = new Builder("");
    for (const name of Object.keys(T) as (keyof typeof T)[]) {
      if (name !== "document") b.leaf(name as "break", 0, 0);
    }
    const doc = b.finish();
    for (let node = 0; node < doc.size; node++) expect(T[doc.type(node)]).toBe(node);
  });
});
