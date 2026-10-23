/** @prose
 * # Ids, listed
 *
 * What `ids` and `headings` promise. `ids` lists every id `html()` writes, on its node, with its
 * label and whether `{#id}` wrote it, in source order. `headings` is the subset on headings, with
 * the depth. Each decision the corpus can't reach is held here by name.
 *
 * The list is held to the `id="…"` that `html()` writes, for every document in the corpus and
 * every example in the harness, so an id can't be written that the list leaves out.
 */
import { describe, expect, it } from "vite-plus/test";
import { TIERS, documents } from "../test/harness/corpus";
import { examples } from "../test/harness/examples";
import { writtenIds } from "../test/harness/sound";
import { headings, html, ids, parse } from "./index";

describe("ids", () => {
  it("lists a heading's, a block's and a span's ids in source order, a block's before its spans'", () => {
    const doc = parse("# One\n\n{#note}\nSee [the term]{#term} here.\n\n{#two}\n## Two\n");
    expect(ids(doc).map(({ id, written, label }) => ({ id, written, label }))).toEqual([
      { id: "one", written: false, label: "One" },
      { id: "note", written: true, label: null },
      { id: "term", written: true, label: "the term" },
      { id: "two", written: true, label: "Two" },
    ]);
  });

  it("gives a span's label as its text, which can be a name and not the id", () => {
    const [id] = ids(parse("[Ada Lovelace]{#ada}\n"));
    expect(id).toMatchObject({ id: "ada", label: "Ada Lovelace", written: true });
  });

  it("labels a link, a leaf element and an image by what they show", () => {
    const source = "[docs](/d){#to-docs} and ![a chart](c.png){#chart}\n\n[Ada]{@x-name #ada /}\n";
    expect(ids(parse(source)).map((i) => i.label)).toEqual(["docs", "a chart", "Ada"]);
  });

  it("gives a block no label, so a section's headings keep theirs and its contents aren't read", () => {
    const doc = parse(
      "{#big}\n> # Inside\n>\n> a long quote\n\n{@section #s}\n## Also\n{/section}\n",
    );
    expect(ids(doc).map(({ id, label }) => ({ id, label }))).toEqual([
      { id: "big", label: null },
      { id: "inside", label: "Inside" },
      { id: "s", label: null },
      { id: "also", label: "Also" },
    ]);
  });

  it("lists an id holding `${…}` as html() writes it, on a heading as on a span", () => {
    const doc = parse('{id="a-${x}"}\n# Head\n\n[b]{id="b-${y}"}\n');
    expect(ids(doc).map(({ id, label }) => ({ id, label }))).toEqual([
      { id: "a-${x}", label: "Head" },
      { id: "b-${y}", label: "b" },
    ]);
    expect(headings(doc).map((h) => h.id)).toEqual(["a-${x}"]);
  });

  it("lists the last id of an item, as html() writes it", () => {
    expect(ids(parse("{#a #b}\ntext\n")).map((i) => i.id)).toEqual(["b"]);
  });

  it("lists a duplicate id twice, as html() writes it twice", () => {
    const doc = parse("[a]{#x} and [b]{#x}\n");
    expect(doc.warnings.map((w) => w.code)).toEqual(["duplicate-id"]);
    expect(ids(doc).map((i) => i.label)).toEqual(["a", "b"]);
  });

  it("leaves out an empty id, which is no target", () => {
    expect(ids(parse("{id}\na\n"))).toEqual([]);
  });

  it("lists an id that reads like a URL, on a span as on a heading, since it is never followed", () => {
    const doc = parse("{#javascript:a}\n# Head\n\n[b]{#javascript:b}\n");
    expect(ids(doc).map((i) => i.id)).toEqual(["javascript:a", "javascript:b"]);
    expect(html(doc)).toContain('<span id="javascript:b">b</span>');
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
    expect(list.map(({ depth, id, written, label }) => ({ depth, id, written, label }))).toEqual([
      { depth: 1, id: "one-a", written: false, label: "One a" },
      { depth: 2, id: "two", written: false, label: "Two" },
      { depth: 3, id: "custom", written: true, label: "Three b" },
    ]);
    for (const { id } of list) expect(html(doc)).toContain(`id="${id}"`);
  });

  it("finds a heading inside a blockquote, a list item or an element", () => {
    const doc = parse("> # Quoted\n\n- ## Listed\n\n{@section}\n### Inside\n{/section}\n");
    expect(headings(doc).map((h) => h.label)).toEqual(["Quoted", "Listed", "Inside"]);
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

const sources = [
  ...TIERS.flatMap((tier) => [...documents(tier)].map(([name, text]) => [`${tier}/${name}`, text])),
  ...examples.map((e) => [e.id, e.markdown]),
];

describe("every id html() writes", () => {
  it.each(sources)("%s", (_, source) => {
    const doc = parse(source!);
    expect(ids(doc).map((i) => i.id)).toEqual(writtenIds(html(doc)));
  });
});
