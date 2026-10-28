/** @prose
 * # Formatters, checked
 *
 * What `syntax.md` says formatters do, held to what Prettier and oxfmt do (syntax: Formatters).
 * A claim that stops being true fails here, so the page can't drift from the tools it names.
 *
 * Each row of the rewrite table pairs the code spans in its two cells in order, and the last one
 * on the right stands for the rest. Each form on the left goes in a document of its own, between
 * two paragraphs so `***` isn't on the first line. A fence gets a line of code to hold. The
 * formatted document must hold the form on the right and not the one on the left, and read
 * without a warning.
 *
 * Each Not supported code the section links to is a form formatters leave alone. Every one of its
 * examples must still raise it after formatting. The one exception is the one the section names,
 * a tab before a two-space break.
 *
 * What formatting does to every Not supported example is a snapshot. A formatter release that
 * rewrites one differently is then seen in review, and the section is checked against it.
 */
import { describe, expect, it } from "vite-plus/test";
import syntax from "../docs/syntax.md?raw";
import { headings, parse, walk, type NodeId } from "../src/index";
import notSupported from "./examples/markz/not-supported.md?raw";
import { readFences } from "./harness/fences";
import { formatters } from "./harness/formatters";
import { row } from "./harness/syntax";

const doc = parse(syntax);
const outline = headings(doc);
const at = outline.findIndex((h) => h.depth === 2 && h.id === "formatters");
const from = doc.start(outline[at]!.node);
const to = outline.slice(at + 1).find((h) => h.depth <= 2);
const end = to ? doc.start(to.node) : syntax.length;

/** The section's nodes of a type, in source order. */
function within(type: string): NodeId[] {
  const out: NodeId[] = [];
  walk(doc, {
    enter(node) {
      if (doc.type(node) === type && doc.start(node) >= from && doc.end(node) <= end)
        out.push(node);
    },
  });
  return out;
}

const spans = (cell: NodeId) => {
  const out: string[] = [];
  walk(
    doc,
    {
      enter: (n) =>
        void (doc.type(n) === "inlineCode" && out.push(doc.data(n, "inlineCode").value)),
    },
    cell,
  );
  return out;
};

const [table] = within("table");
const rewrites = [...doc.children(table!)].slice(1).flatMap((tr) => {
  const [left, right] = [...doc.children(tr)].map(spans);
  return left!.map((form, i) => ({ form, writes: right![Math.min(i, right!.length - 1)]! }));
});

const alone = within("link").flatMap((link) => {
  const r = row(doc.data(link, "link").destination.slice(1));
  return r ? [r.code] : [];
});

const examples = readFences(notSupported).examples;
// The exception the section names: a tab before the two spaces of a break.
const tabBeforeBreak = (markdown: string) => /\t +\n/.test(markdown);

const isFence = (form: string) => /^(`{3,}|~{3,})$/.test(form);
const document = (form: string) =>
  isFence(form) ? `${form}\nx\n${form}\n` : `a\n\n${form}\n\nb\n`;
const codes = (text: string) => new Set(parse(text).warnings.map((w) => w.code));

it("reads the section's table and links", () => {
  expect(rewrites.length).toBeGreaterThan(0);
  expect(alone.length).toBeGreaterThan(0);
});

const name = (i: number) => `${i}.md`;
// Each formatter runs once on every table form and once on every example.
const runs = await Promise.all(
  Object.entries(formatters).map(async ([formatter, format]) => ({
    formatter,
    rewritten: await format(new Map(rewrites.map((r, i) => [name(i), document(r.form)]))),
    kept: await format(new Map(examples.map((e, i) => [name(i), `${e.markdown}\n`]))),
  })),
);

describe.each(runs)("$formatter", ({ rewritten, kept }) => {
  it.each(rewrites.map((r, i) => ({ ...r, i })))(
    "rewrites $form to $writes",
    ({ form, writes, i }) => {
      const out = rewritten.get(name(i))!;
      expect(out).toContain(writes);
      expect(out).not.toContain(form);
      expect(parse(out).warnings).toEqual([]);
    },
  );

  it.each(alone)("leaves %s alone", (code) => {
    const lost = examples.flatMap((e, i) =>
      e.section === code && !tabBeforeBreak(e.markdown) && !codes(kept.get(name(i))!).has(code)
        ? [e.markdown]
        : [],
    );
    expect(lost).toEqual([]);
  });

  it("changes the Not supported examples as before", () => {
    const changes = examples.flatMap((e, i) => {
      const out = kept.get(name(i))!;
      if (out === `${e.markdown}\n`) return [];
      const still = [...codes(out)].join(", ") || "no warning";
      return [`${e.section}: ${JSON.stringify(e.markdown)} → ${JSON.stringify(out)} (${still})`];
    });
    expect(changes).toMatchSnapshot();
  });
});
