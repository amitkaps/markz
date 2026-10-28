/** @prose
 * # Formatters, checked
 *
 * What `syntax.md` says formatters do, held to what Prettier and oxfmt do (syntax: Formatters).
 * A claim that stops being true fails here, so the page can't drift from the tools it names.
 *
 * Each row of the section's table is one claim, and its Rule names a warning code, a construct
 * or a side rule that exists. Its Written cell is formatted as a document of its own, with `⏎`
 * as a line ending. A code span in Formatted is the exact text every formatter must write. _as
 * written_ says they leave it, and _read the same_ only that markz reads their text one way.
 * Formatted text never warns. When the written text doesn't warn either, both must read the
 * same, with the same HTML and the same metadata.
 *
 * Each Not supported code the section links to outside the table is a form formatters leave
 * alone. Every one of its examples must still raise it after formatting. The one exception is the
 * one the section names, a tab before a two-space break.
 *
 * What formatting does to every Not supported example is a snapshot. A formatter release that
 * rewrites one differently is then seen in review, and the section is checked against it.
 */
import { describe, expect, it } from "vite-plus/test";
import syntax from "../docs/syntax.md?raw";
import { WARNINGS, headings, html, parse, textContent, walk, type NodeId } from "../src/index";
import notSupported from "./examples/markz/not-supported.md?raw";
import { readFences } from "./harness/fences";
import { formatters } from "./harness/formatters";
import { CONSTRUCTS, DOCUMENT } from "./harness/grammar";
import { row } from "./harness/syntax";

const doc = parse(syntax);
const outline = headings(doc);
const at = outline.findIndex((h) => h.depth === 2 && h.id === "formatters");
const from = doc.start(outline[at]!.node);
const to = outline.slice(at + 1).find((h) => h.depth <= 2);
const end = to ? doc.start(to.node) : syntax.length;

/** Nodes of a type under `node`, in source order. */
function under(node: NodeId, type: string): NodeId[] {
  const out: NodeId[] = [];
  walk(
    doc,
    {
      enter(n) {
        if (doc.type(n) === type && doc.start(n) >= from && doc.end(n) <= end) out.push(n);
      },
    },
    node,
  );
  return out;
}

const code = (cell: NodeId) => {
  const [span] = under(cell, "inlineCode");
  return span === undefined ? null : doc.data(span, "inlineCode").value;
};
const lines = (text: string) => `${text.replaceAll("⏎", "\n")}\n`;

const [table] = under(doc.root, "table");
const claims = [...doc.children(table!)].slice(1).map((tr) => {
  const [rule, written, formatted] = [...doc.children(tr)];
  return {
    rule: code(rule!)!,
    written: code(written!)!,
    formatted: code(formatted!) ?? textContent(doc, formatted!).trim(),
    exact: code(formatted!) !== null,
  };
});

const rules = new Set([
  ...Object.keys(WARNINGS),
  ...CONSTRUCTS.map((c) => c.id),
  ...[DOCUMENT, ...CONSTRUCTS].flatMap((c) => Object.keys(c.rules)),
]);

const inTable = (n: NodeId) => doc.start(n) >= doc.start(table!) && doc.end(n) <= doc.end(table!);
const alone = under(doc.root, "link").flatMap((link) => {
  const r = inTable(link) ? undefined : row(doc.data(link, "link").destination.slice(1));
  return r ? [r.code] : [];
});

const examples = readFences(notSupported).examples;
// The exception the section names: a tab before the two spaces of a break.
const tabBeforeBreak = (markdown: string) => /\t +\n/.test(markdown);

const codes = (text: string) => new Set(parse(text).warnings.map((w) => w.code));
const meaning = (text: string) => {
  const d = parse(text);
  return { html: html(d), metadata: d.metadata };
};

it("reads the section's claims, each under a rule that exists", () => {
  expect(claims.length).toBeGreaterThan(0);
  expect(alone.length).toBeGreaterThan(0);
  expect(claims.filter((c) => !rules.has(c.rule)).map((c) => c.rule)).toEqual([]);
  const words = claims.filter((c) => !c.exact).map((c) => c.formatted);
  expect(words.filter((w) => w !== "as written" && w !== "read the same")).toEqual([]);
});

const name = (i: number) => `${i}.md`;
// Each formatter runs once on every table form and once on every example.
const runs = await Promise.all(
  Object.entries(formatters).map(async ([formatter, format]) => ({
    formatter,
    formatted: await format(new Map(claims.map((c, i) => [name(i), lines(c.written)]))),
    kept: await format(new Map(examples.map((e, i) => [name(i), `${e.markdown}\n`]))),
  })),
);

describe.each(runs)("$formatter", ({ formatted, kept }) => {
  it.each(claims.map((c, i) => ({ ...c, i })))(
    "$rule: $written is $formatted",
    ({ written, formatted: claim, exact, i }) => {
      const out = formatted.get(name(i))!;
      if (exact) expect(out).toBe(lines(claim));
      if (claim === "as written") expect(out).toBe(lines(written));
      expect(parse(out).warnings).toEqual([]);
      if (parse(lines(written)).warnings.length === 0) {
        expect(meaning(out)).toEqual(meaning(lines(written)));
      }
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
