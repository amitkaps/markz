/** @prose
 * # The docs, checked
 *
 * The documents in `docs/` are the site's pages, and `prose build` links them by repo path, so
 * two things keep the site from drifting: each is read by this commit's markz without a warning
 * (`duplicate-id` excepted in the grammar, which repeats a heading's id by design: a construct
 * and its side rules), and each relative link in its text goes to a file that exists.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { parse, type Document, type NodeId } from "../src/index";

const root = join(import.meta.dirname, "..");
const folder = join(root, "docs");
const files = readdirSync(folder).filter((name) => name.endsWith(".md"));

/** The destinations of every link and image, found in the tree so code samples don't count. */
function destinations(doc: Document, node: NodeId = doc.root): string[] {
  const type = doc.type(node);
  const own = type === "link" || type === "image" ? [doc.data(node, type).destination] : [];
  return [...doc.children(node)].reduce((all, child) => [...all, ...destinations(doc, child)], own);
}

describe.each(files)("docs/%s", (name) => {
  const text = readFileSync(join(folder, name), "utf8");

  it("is read without a warning", () => {
    const warnings = parse(text).warnings.filter((w) => w.code !== "duplicate-id");
    expect(warnings).toEqual([]);
  });

  it("links only to files that exist", () => {
    const links = destinations(parse(text)).map((href) => href.split("#")[0]!);
    const relative = links.filter((href) => href && !/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(href));
    const missing = relative.filter((href) => !existsSync(join(dirname(join(folder, name)), href)));
    expect(missing).toEqual([]);
  });
});
