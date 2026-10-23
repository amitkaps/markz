/** @prose
 * # Ids, listed
 *
 * What `ids` and `headings` promise. `ids` lists every id `html()` writes, on its node, with its
 * text and whether `{#id}` wrote it, in source order. `headings` is the subset on headings, with
 * the depth.
 *
 * The list is held to the `id="…"` that `html()` writes, for every document in the corpus and
 * every example in the harness, so an id can't be written that the list leaves out.
 */
import { describe, expect, it } from "vite-plus/test";
import { TIERS, documents } from "../test/harness/corpus";
import { examples } from "../test/harness/examples";
import { headings, html, ids, parse } from "./index";

describe("ids", () => {
  it("lists a heading's, a block's and a span's ids in source order, a block's before its spans'", () => {
    const doc = parse("# One\n\n{#note}\nSee [the term]{#term} here.\n\n{#two}\n## Two\n");
    expect(ids(doc).map(({ id, written, text }) => ({ id, written, text }))).toEqual([
      { id: "one", written: false, text: "One" },
      { id: "note", written: true, text: "See the term here." },
      { id: "term", written: true, text: "the term" },
      { id: "two", written: true, text: "Two" },
    ]);
  });

  it("gives a span's label as its text, which can be a name and not the id", () => {
    const [id] = ids(parse("[Ada Lovelace]{#ada}\n"));
    expect(id).toMatchObject({ id: "ada", text: "Ada Lovelace", written: true });
  });

  it("lists the last id of an item, as html() writes it", () => {
    expect(ids(parse("{#a #b}\ntext\n")).map((i) => i.id)).toEqual(["b"]);
  });

  it("lists a duplicate id twice, as html() writes it twice", () => {
    const doc = parse("[a]{#x} and [b]{#x}\n");
    expect(doc.warnings.map((w) => w.code)).toEqual(["duplicate-id"]);
    expect(ids(doc).map((i) => i.text)).toEqual(["a", "b"]);
  });

  it("leaves out an id html() drops, and an empty one", () => {
    expect(ids(parse("{#javascript:x}\na\n\n{id}\nb\n"))).toEqual([]);
  });

  it("is empty for a document with no ids", () => {
    expect(ids(parse("text\n"))).toEqual([]);
  });
});

describe("headings", () => {
  it("lists every heading in source order, with the depth, id and text html() gives it", () => {
    const source = "# One _a_\n\ntext\n\n## Two\n\n{#custom}\n### Three `b`\n";
    const doc = parse(source);
    const list = headings(doc);
    expect(list.map(({ depth, id, written, text }) => ({ depth, id, written, text }))).toEqual([
      { depth: 1, id: "one-a", written: false, text: "One a" },
      { depth: 2, id: "two", written: false, text: "Two" },
      { depth: 3, id: "custom", written: true, text: "Three b" },
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

/** The ids in `html()`'s output, unescaped, in the order it writes them. */
const written = (markup: string) =>
  [...markup.matchAll(/ id="([^"]+)"/g)].map((m) =>
    m[1]!
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&"),
  );

const sources = [
  ...TIERS.flatMap((tier) => [...documents(tier)].map(([name, text]) => [`${tier}/${name}`, text])),
  ...examples.map((e) => [e.id, e.markdown]),
];

describe("every id html() writes", () => {
  it.each(sources)("%s", (_, source) => {
    const doc = parse(source!);
    expect(ids(doc).map((i) => i.id)).toEqual(written(html(doc)));
  });
});
