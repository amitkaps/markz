/** @prose
 * # Sound
 *
 * What every document must satisfy, whatever the input: the properties the fuzzer holds each
 * generated document to. markz never throws, and it builds a valid tree whose every warning lies
 * inside the source under a known code. `html()` gives the same string for the same input, and
 * the same page whichever line endings the source uses. `walk`
 * reaches every node, `textContent` and `position` answer for any node and offset, and the HTML
 * is safe: no element that runs script, no event-handler attribute, and no `javascript:` URL,
 * unless the author wrote a ` ```=html ` raw block, which is theirs to write.
 */
import { expect } from "vite-plus/test";
import { html, parse, position, textContent, walk } from "../../src/index";
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
  if (!markdown.includes("=html")) expectSafe(out);

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

const UNSAFE_TAG = /^(?:script|iframe|object|embed|style|frame|frameset|base|meta|link|form)$/i;

function expectSafe(out: string): void {
  for (const [tag, name, attributes] of out.matchAll(/<([a-zA-Z][\w-]*)([^>]*)>/g)) {
    expect(UNSAFE_TAG.test(name!), tag).toBe(false);
    expect(/\son[a-z]*\s*=/i.test(attributes!), tag).toBe(false);
    expect(/\s(?:href|src)="\s*(?:javascript|vbscript):/i.test(attributes!), tag).toBe(false);
  }
}
