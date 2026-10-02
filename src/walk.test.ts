/** @prose
 * `walk`, `textContent`, `headings` and `position`: the order `walk` visits in and what skipping
 * does, that it survives nesting too deep to recurse, what text a node reads as, which headings
 * the outline lists and with what ids, and how offsets become lines and columns across every line
 * ending.
 */
import { describe, expect, it } from "vite-plus/test";
import { headings, html, parse, position, textContent, walk, type NodeId } from "./index";

describe("walk", () => {
  it("enters before the children and exits after them", () => {
    const doc = parse("# A _b_\n\nc\n");
    const events: string[] = [];
    walk(doc, {
      enter: (n) => void events.push(`+${doc.type(n)}`),
      exit: (n) => void events.push(`-${doc.type(n)}`),
    });
    expect(events.join(" ")).toBe(
      "+document +heading +text -text +emphasis +text -text -emphasis -heading +paragraph +text -text -paragraph -document",
    );
  });

  it("skips the children when enter returns false, and still exits", () => {
    const doc = parse("> a\n\nb\n");
    const events: string[] = [];
    walk(doc, {
      enter: (n) => (
        events.push(`+${doc.type(n)}`),
        doc.type(n) === "blockquote" ? false : undefined
      ),
      exit: (n) => void events.push(`-${doc.type(n)}`),
    });
    expect(events.join(" ")).toBe(
      "+document +blockquote -blockquote +paragraph +text -text -paragraph -document",
    );
  });

  it("walks only the subtree it starts from", () => {
    const doc = parse("a _b_\n\nc\n");
    const paragraph = doc.firstChild(doc.root);
    const seen: string[] = [];
    walk(doc, { enter: (n) => void seen.push(doc.type(n)) }, paragraph);
    expect(seen).toEqual(["paragraph", "text", "emphasis", "text"]);
  });

  it("handles nesting too deep to recurse", () => {
    const doc = parse(`${">".repeat(20000)} x\n`);
    let depth = 0;
    let deepest = 0;
    walk(doc, {
      enter: () => void (deepest = Math.max(deepest, ++depth)),
      exit: () => void depth--,
    });
    expect(deepest).toBeGreaterThan(20000);
    expect(depth).toBe(0);
  });
});

describe("textContent", () => {
  const first = (source: string): [ReturnType<typeof parse>, NodeId] => {
    const doc = parse(source);
    return [doc, doc.firstChild(doc.root)];
  };

  it("reads text as the rendered page does", () => {
    const [doc, heading] = first('# "Hi" \\*there\\* `a<b` $x^2$ ![img](i.png)\n');
    expect(textContent(doc, heading)).toBe("“Hi” *there* a<b x^2 ");
  });

  it("keeps line breaks and expressions", () => {
    const [doc, paragraph] = first("a\\\nb ${n}\n");
    expect(textContent(doc, paragraph)).toBe("a\nb ${n}");
  });

  it("includes an element's content, a leaf's label among it", () => {
    const details = parse("{@details}\n[More]{@summary /}\n\nx\n{/details}\n");
    expect(textContent(details)).toBe("Morex");
  });

  it("matches the text of the HTML", () => {
    const source = "# T\n\n- a **b**\n- [c](d)\n\n```js\nx\n```\n";
    const text = html(source)
      .replace(/<[^>]*>/g, "")
      .replace(/\n/g, "");
    expect(textContent(parse(source)).replace(/\n/g, "")).toBe(text);
  });
});

describe("headings", () => {
  it("lists every heading in source order, with the depth, id and text html() gives it", () => {
    const source = "# One _a_\n\ntext\n\n## Two\n\n{#custom}\n### Three `b`\n";
    const doc = parse(source);
    const list = headings(doc);
    expect(list.map(({ depth, id, text }) => ({ depth, id, text }))).toEqual([
      { depth: 1, id: "one-a", text: "One a" },
      { depth: 2, id: "two", text: "Two" },
      { depth: 3, id: "custom", text: "Three b" },
    ]);
    for (const { id } of list) expect(html(doc)).toContain(`id="${id}"`);
  });

  it("finds a heading inside a blockquote, a list item or an element", () => {
    const doc = parse("> # Quoted\n\n- ## Listed\n\n{@section}\n### Inside\n{/section}\n");
    expect(headings(doc).map((h) => h.text)).toEqual(["Quoted", "Listed", "Inside"]);
  });

  it("gives each heading's node, so its range is in the source", () => {
    const source = "intro\n\n## Here\n";
    const doc = parse(source);
    const [h] = headings(doc);
    expect(source.slice(doc.start(h!.node), doc.end(h!.node))).toBe("## Here");
  });

  it("is empty for a document with no headings, and a `#` in code is not one", () => {
    expect(headings(parse("a\n\n```\n# no\n```\n"))).toEqual([]);
  });
});

describe("position", () => {
  it("gives 1-based lines and 0-based columns", () => {
    const at = position("ab\ncd\n");
    expect([0, 1, 2, 3, 5, 6].map(at)).toEqual([
      { line: 1, column: 0 },
      { line: 1, column: 1 },
      { line: 1, column: 2 },
      { line: 2, column: 0 },
      { line: 2, column: 2 },
      { line: 3, column: 0 },
    ]);
  });

  it("ends a line at CRLF, LF or a lone CR", () => {
    const at = position("a\r\nb\rc\nd");
    expect([3, 5, 7].map(at)).toEqual([
      { line: 2, column: 0 },
      { line: 3, column: 0 },
      { line: 4, column: 0 },
    ]);
    expect(at(2)).toEqual({ line: 1, column: 2 });
  });

  it("counts UTF-16 code units and clamps past the end", () => {
    const at = position("😀x");
    expect(at(2)).toEqual({ line: 1, column: 2 });
    expect(at(99)).toEqual({ line: 1, column: 3 });
    expect(at(-1)).toEqual({ line: 1, column: 0 });
  });

  it("maps a warning to where it is", () => {
    const source = "ok\n\n*a*\n";
    const [w] = parse(source).warnings;
    expect(position(source)(w!.start)).toEqual({ line: 3, column: 0 });
  });
});
