/** @prose
 * The metadata rule, held to the `yaml` package: every block markz accepts without a warning gives
 * the object YAML 1.2 gives. The checks catch what writers get wrong (`no`, `1.10`, `Issue #42`),
 * and rare YAML forms (`1e3`, `0x1F`) are strings as written (syntax.md: Metadata).
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
    ["numbers", "order: 2\nscale: -1.5\nzero: 0\nversion: 1.25"],
    ["plain strings", "title: Sales Report\ndate: 2026-09-26\nnote: C# notes\nhash: a#b"],
    ["double quotes", 'summary: "Make it yours: \\"quoted\\" \\u00e9"\ntitle: "Issue #42"'],
    ["single quotes", "summary: 'Make it yours: it''s done'"],
    ["quoted look-alikes", 'a: "true"\nb: \'42\'\nc: "no"\nd: "1.10"'],
    ["lists", 'tags: [svelte, vite]\nmixed: [a, 2, "b, c", true, null]\nnone: []'],
    ["comment lines", "# a comment\ntitle: Hi"],
    ["blank lines", "a: 1\n\nb: 2"],
    ["dots in keys", "deploy.name: my-site\na..b: 1\nx.y.z: true"],
  ])("%s", (_, body) => {
    const doc = parse(block(body));
    expect(doc.warnings).toEqual([]);
    expect(doc.metadata).toEqual(yaml(body));
  });

  it.each([
    "True",
    "FALSE",
    "~",
    "Null",
    "yes",
    "No",
    "off",
    "ON",
    "+1",
    ".5",
    "01",
    "1.",
    "1.10",
    "1.0",
  ])("rejects the look-alike %s", (value) => {
    const doc = parse(block(`a: ${value}\nb: 1`));
    expect(doc.metadata).toEqual({ b: 1 });
    expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-value"]);
  });

  it.each(["1e3", "0x1F", "0o7", ".inf", ".nan", "-.Inf"])(
    "reads the rare YAML form %s as the string it is written as",
    (value) => {
      const doc = parse(block(`a: ${value}`));
      expect(doc.warnings).toEqual([]);
      expect(doc.metadata).toEqual({ a: value });
    },
  );

  it.each([
    ["an indented list", "tags:\n  - a\n  - b"],
    ["a nested map", "a:\n  b: 1"],
    ["a block scalar", "a: |"],
    ["a flow map", "a: {b: 1}"],
    ["an anchor", "a: &x 1"],
    ["a colon in a plain value", "a: b: c"],
    ["a comment after a value", "a: Issue #42"],
    ["a comment after a quoted value", 'a: "x" # note'],
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
    expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-duplicate-key"]);
  });

  it.each(["null", "[x]", "x"])("skips a `__proto__` key (%s) and keeps the rest", (value) => {
    const doc = parse(block(`__proto__: ${value}\ntitle: Hi`));
    expect(doc.metadata).toEqual({ title: "Hi" });
    expect(Object.getPrototypeOf(doc.metadata)).toBe(Object.prototype);
    expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-line"]);
  });

  it("sets inherited names as keys of its own", () => {
    const doc = parse(block("constructor: 1\ntoString: x"));
    expect(doc.warnings).toEqual([]);
    expect(doc.metadata).toEqual({ constructor: 1, toString: "x" });
  });

  it.each([".a", "1a", "a b"])("reads %s as no key", (key) => {
    const doc = parse(block(`${key}: 1\nkeep: 1`));
    expect(doc.metadata).toEqual({ keep: 1 });
    expect(doc.warnings.map((w) => w.code)).toEqual(["metadata-line"]);
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
