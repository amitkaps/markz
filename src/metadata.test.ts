/** @prose
 * The metadata rule, held to the `yaml` package: every block markz accepts must give the same
 * object under YAML 1.2 (once dotted keys are expanded), and every YAML look-alike must be a
 * warning rather than a string (syntax.md: Metadata).
 */
import { describe, expect, it } from "vite-plus/test";
import { parse as yaml } from "yaml";
import { parse } from "./index";
import { flatten } from "../test/harness/oracle";

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

  it.each(["null", "[x]", "x"])("skips a `__proto__` key (%s) and keeps the rest", (value) => {
    const doc = parse(block(`__proto__: ${value}\ntitle: Hi`));
    expect(doc.metadata).toEqual({ title: "Hi" });
    expect(Object.getPrototypeOf(doc.metadata)).toBe(Object.prototype);
    expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-line"]);
  });

  describe("dotted keys", () => {
    it("nest into objects at any depth and merge siblings in first-seen order", () => {
      const doc = parse(block("a.b: 1\nx: 2\na.c.d: [p, q]\na.c.e: true"));
      expect(doc.warnings).toEqual([]);
      expect(doc.metadata).toEqual({ a: { b: 1, c: { d: ["p", "q"], e: true } }, x: 2 });
      expect(Object.keys(doc.metadata!)).toEqual(["a", "x"]);
    });

    it("expand back to the flat object YAML gives", () => {
      const body =
        "deploy.provider: cloudflare\ndeploy.name: my-site\ndeploy.production: true\ntags: [a]";
      expect(flatten(parse(block(body)).metadata!)).toEqual(yaml(body));
    });

    it.each([
      ["a value then an object", "a: 1\na.b: 2", { a: 1 }],
      ["an object then a value", "a.b: 2\na: 1", { a: { b: 2 } }],
      ["null then an object", "a:\na.b: 2", { a: null }],
      ["a list then an object", "a: []\na.b: 2", { a: [] }],
      ["a leaf then a deeper path", "a.b: 1\na.b.c: 2", { a: { b: 1 } }],
    ])("keep the first of %s", (_, body, first) => {
      const doc = parse(block(`${body}\nkeep: 1`));
      expect(doc.metadata).toEqual({ ...first, keep: 1 });
      expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-duplicate-key"]);
    });

    it("warn on a repeated path as a plain duplicate", () => {
      const doc = parse(block("a.b: 1\na.b: 2"));
      expect(doc.metadata).toEqual({ a: { b: 1 } });
      expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-duplicate-key"]);
    });

    it.each(["a..b", ".a", "a.", "a.b.", "a.0", "a.1b", "a b.c"])(
      "skip the malformed path %s",
      (key) => {
        const doc = parse(block(`${key}: 1\nkeep: 1`));
        expect(doc.metadata).toEqual({ keep: 1 });
        expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-line"]);
      },
    );

    it.each(["a.__proto__", "__proto__.a", "a.__proto__.b"])("reject %s", (key) => {
      const doc = parse(block(`${key}: 1\nkeep: 1`));
      expect(doc.metadata).toEqual({ keep: 1 });
      expect(Object.getPrototypeOf(doc.metadata)).toBe(Object.prototype);
      expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-line"]);
    });

    it("never walk into inherited properties", () => {
      const before = Object.keys(Object);
      const doc = parse(block("constructor.polluted: 1\ntoString.x: 2\nconstructor.y: 3"));
      expect(doc.metadata).toEqual({ constructor: { polluted: 1, y: 3 }, toString: { x: 2 } });
      expect(Object.keys(Object)).toEqual(before);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("leave nothing behind when a following line skips the key", () => {
      const doc = parse(block("a.b.c:\n  - x\na: 1"));
      expect(doc.metadata).toEqual({ a: 1 });
    });

    it("leave a parent made by an earlier line when a later one is skipped", () => {
      const doc = parse(block("a.b: 1\na.c:\n  - x"));
      expect(doc.metadata).toEqual({ a: { b: 1 } });
    });
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
