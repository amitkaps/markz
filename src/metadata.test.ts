/** @prose
 * The metadata rule, held to the `yaml` package: every block markz accepts must give the same
 * object under YAML 1.2, and every YAML look-alike must be a warning rather than a string
 * (syntax.md: Metadata).
 */
import { describe, expect, it } from "vite-plus/test";
import { parse as yaml } from "yaml";
import { parse } from "./index";

const block = (body: string) => `---\n${body}\n---\n`;

describe("metadata", () => {
  it.each([
    ["empty", "image:"],
    ["null", "image: null"],
    ["booleans", "draft: false\npublished: true"],
    ["numbers", "order: 2\nscale: -1.5\nzero: 0"],
    ["plain strings", "title: Sales Report\ndate: 2026-09-26\nnote: C# notes"],
    ["double quotes", 'summary: "Make it yours: \\"quoted\\" \\u00e9"'],
    ["single quotes", "summary: 'Make it yours: it''s done'"],
    ["quoted look-alikes", "a: \"true\"\nb: '42'"],
    ["lists", 'tags: [svelte, vite]\nmixed: [a, 2, "b, c", true, null]\nnone: []'],
    ["comments", "# a comment\ntitle: Hi # trailing\nhash: a#b"],
    ["blank lines", "a: 1\n\nb: 2"],
  ])("%s", (_, body) => {
    const doc = parse(block(body));
    expect(doc.warnings).toEqual([]);
    expect(doc.metadata).toEqual(yaml(body));
  });

  it.each(["True", "FALSE", "~", "Null", "+1", ".5", "1e3", "0x1F", ".inf", "01", "1."])(
    "rejects the YAML look-alike %s",
    (value) => {
      const doc = parse(block(`a: ${value}\nb: 1`));
      expect(doc.metadata).toEqual({ b: 1 });
      expect(doc.warnings).toHaveLength(1);
    },
  );

  it.each([
    ["an indented list", "tags:\n  - a\n  - b"],
    ["a nested map", "a:\n  b: 1"],
    ["a block scalar", "a: |"],
    ["a flow map", "a: {b: 1}"],
    ["an anchor", "a: &x 1"],
    ["a colon in a plain value", "a: b: c"],
    ["a nested list", "a: [[1]]"],
    ["an unclosed quote", 'a: "open'],
  ])("rejects %s and skips its key", (_, body) => {
    const doc = parse(block(`${body}\nkeep: 1`));
    expect(doc.metadata).toEqual({ keep: 1 });
    expect(doc.warnings.length).toBeGreaterThan(0);
  });

  it("keeps the first of two duplicate keys", () => {
    const doc = parse(block("a: 1\na: 2"));
    expect(doc.metadata).toEqual({ a: 1 });
    expect(doc.warnings).toHaveLength(1);
  });

  it("records the block and its body ranges", () => {
    const source = block("a: 1");
    const doc = parse(source);
    const node = doc.firstChild(doc.root);
    expect(doc.type(node)).toBe("metadata");
    expect([doc.start(node), doc.end(node)]).toEqual([0, source.length - 1]);
    const { range } = doc.data(node, "metadata");
    expect(source.slice(range.start, range.end)).toBe("a: 1");
  });

  it("is metadata whatever it holds, and reports the lines it cannot read", () => {
    const doc = parse("---\nhello\ntitle: x\n---\n");
    expect(doc.metadata).toEqual({ title: "x" });
    expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-line"]);
  });

  it("skips a key whose value continues on later lines", () => {
    const doc = parse("---\none:\n- 2\nb: {\nc: 1\n}\nd: 4\n---\n");
    expect(doc.metadata).toEqual({ d: 4 });
  });

  it("is only metadata at the very start, and only when closed", () => {
    expect(parse("\n---\na: 1\n---\n").metadata).toBeUndefined();
    const unclosed = parse("---\na: 1\n");
    expect(unclosed.metadata).toBeUndefined();
    expect(unclosed.type(unclosed.firstChild(unclosed.root))).toBe("thematicBreak");
  });
});
