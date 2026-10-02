/** @prose
 * # The docs, checked
 *
 * The documents in `docs/` are the site's pages, and `prose build` links them by repo path, so
 * two things keep the site from drifting: each is read by this commit's markz without a warning
 * (`duplicate-id` excepted in the grammar, which repeats a heading's id by design: a construct
 * and its side rules), and each relative link in its text goes to a file that exists. The API
 * page names every export, `Document` member and node type the package has, so a new one can't
 * ship undocumented.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { T } from "../src/ast";
import * as markz from "../src/index";
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

describe("docs/api.md", () => {
  const text = readFileSync(join(folder, "api.md"), "utf8");
  const missing = (names: string[], prefix = "") =>
    names.filter((name) => !text.includes(`\`${prefix}${name}`));

  it("names every export of the package", () => {
    expect(missing(Object.keys(markz))).toEqual([]);
  });

  it("names every member of a Document", () => {
    const members = Object.getOwnPropertyNames(markz.Document.prototype).filter(
      (name) => name !== "constructor",
    );
    expect(missing([...members, "source", "root", "warnings"], "doc.")).toEqual([]);
  });

  it("names every node type", () => {
    expect(missing(Object.keys(T))).toEqual([]);
  });
});
