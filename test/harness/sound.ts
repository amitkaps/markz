/** @prose
 * # Sound
 *
 * What every document must satisfy, whatever the input. These are the properties the fuzzer
 * holds each generated document to.
 *
 * markz never throws, and it builds a valid tree whose every warning lies inside the source
 * under a known code. `html()` gives the same string for the same input, and the same page
 * whichever line endings the source uses. `walk` reaches every node, and `textContent` and
 * `position` answer for any node and offset. `ids` lists exactly the ids `html()` writes, in
 * order, and a heading's label is never `null`.
 *
 * The HTML is safe. It has no element that runs script, no event-handler attribute and no
 * `javascript:` URL. The exception is a ` ```=html ` raw block, which is the author's to write.
 */
import { expect } from "vite-plus/test";
import { headings, html, ids, parse, position, textContent, walk } from "../../src/index";
import { WARNINGS } from "../../src/warnings";
import { expectTree } from "./tree";

export function expectSound(markdown: string): void {
  const doc = parse(markdown);
  expectTree(doc);
  for (const w of doc.warnings) {
    expect(w.code in WARNINGS, w.code).toBe(true);
    expect(0 <= w.start && w.start <= w.end && w.end <= markdown.length).toBe(true);
  }

  const out = html(doc);
  expect(html(markdown)).toBe(out);
  // CRLF, LF and a lone CR each end a line, so which the source uses changes nothing but them.
  const lf = (text: string) => text.replace(/\r\n?/g, "\n");
  expect(lf(html(lf(markdown)))).toBe(lf(out));
  if (!markdown.includes("=html")) {
    expectSafe(out);
    // A raw block can write an id of its own, which is no id of markz's.
    expect(ids(doc).map((i) => i.id)).toEqual(writtenIds(out));
  }
  for (const h of headings(doc)) expect(typeof h.label).toBe("string");

  let nodes = 0;
  walk(doc, { enter: () => void nodes++ });
  expect(nodes).toBe(doc.size);
  expect(typeof textContent(doc)).toBe("string");

  const at = position(markdown);
  const lines = markdown.split(/\r\n|\r|\n/);
  for (const w of doc.warnings) {
    const { line, column } = at(w.start);
    expect(line).toBeGreaterThanOrEqual(1);
    expect(line).toBeLessThanOrEqual(lines.length);
    expect(column).toBeLessThanOrEqual(lines[line - 1]!.length);
  }
}

/** The ids in `html()`'s output, unescaped, in the order it writes them. */
export const writtenIds = (out: string) =>
  [...out.matchAll(/ id="([^"]+)"/g)].map((m) =>
    m[1]!
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&"),
  );

const UNSAFE_TAG = /^(?:script|iframe|object|embed|style|frame|frameset|base|meta|link|form)$/i;

function expectSafe(out: string): void {
  for (const [tag, name, attributes] of out.matchAll(/<([a-zA-Z][\w-]*)([^>]*)>/g)) {
    expect(UNSAFE_TAG.test(name!), tag).toBe(false);
    expect(/\son[a-z]*\s*=/i.test(attributes!), tag).toBe(false);
    expect(/\s(?:href|src)="\s*(?:javascript|vbscript):/i.test(attributes!), tag).toBe(false);
  }
}
