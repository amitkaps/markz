/** @prose
 * # Documents, checked
 *
 * Every real document in `documents/`, in its own `describe`, held to what an example can't
 * show: whole documents as people and agents write them. Each must be sound as written and after
 * oxfmt. The blocks of its common variant, which every parser reads alike, must each read as
 * micromark reads them, unless the oracle can't judge one (`APART`). Formatting must not change
 * what it means: the common variant always, and the whole document when markz cut nothing in it,
 * compared as HTML with the code inside fences and runs of spaces set aside, which oxfmt rewrites
 * and HTML ignores. A document with cut forms is left out of that last check whole, since oxfmt
 * rewrites some of them into what the dialect keeps (`*a*` to `_a_`), which is the point of the
 * cut.
 *
 * What markz warns about in each document as written is a snapshot, so a change in what it
 * reports is seen and accepted, never slipped in.
 */
import { describe, expect, it } from "vite-plus/test";
import { html, parse, position } from "../src/index";
import { TIERS, commonBlocks, documents, format } from "./harness/corpus";
import { apart, normalize, reference } from "./harness/oracle";
import { expectSound } from "./harness/sound";
import { row } from "./harness/syntax";

const all = TIERS.flatMap((tier) =>
  [...documents(tier)].map(([name, text]) => ({ key: `${tier}/${name}`, text })),
);
// One oxfmt run for every document, and one for every common variant: each is a process.
const flat = (key: string) => key.replace("/", "-");
const formatted = format(new Map(all.map((d) => [flat(d.key), d.text])));
const common = new Map(all.map((d) => [d.key, commonBlocks(parse(d.text))]));
const commonFormatted = format(
  new Map(all.map((d) => [flat(d.key), common.get(d.key)!.join("\n\n") + "\n"])),
);

/** What a document means, as HTML, without what oxfmt may rewrite and HTML ignores. */
const meaning = (markdown: string) =>
  html(parse(markdown))
    .replace(/(<pre><code[^>]*>)[\s\S]*?(<\/code><\/pre>)/g, "$1$2")
    .replace(/ {2,}/g, " ");

describe.each(all)("$key", ({ key, text }) => {
  const doc = parse(text);

  it("is sound", () => expectSound(text));

  it("is sound formatted", () => expectSound(formatted.get(flat(key))!));

  it("reads its common blocks as the oracle does", () => {
    const differ = common
      .get(key)!
      .filter((block) => !apart(block) && normalize(html(block)) !== normalize(reference(block)));
    expect(differ.slice(0, 3)).toEqual([]);
  });

  it("means the same formatted", () => {
    const raw = common.get(key)!.join("\n\n") + "\n";
    expect(meaning(commonFormatted.get(flat(key))!)).toBe(meaning(raw));
    if (!doc.warnings.some((w) => row(w.code))) {
      expect(meaning(formatted.get(flat(key))!)).toBe(meaning(text));
    }
  });

  it("warns as before", () => {
    const at = position(text);
    const lines = doc.warnings.map((w) => {
      const { line, column } = at(w.start);
      const covered = text.slice(w.start, Math.min(w.end, w.start + 60)).replace(/\r?\n/g, "⏎");
      return `${line}:${column} ${w.code} ${covered}`;
    });
    expect(lines).toMatchSnapshot();
  });
});
