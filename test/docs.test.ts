/** @prose
 * # The docs, checked
 *
 * The root `README.md` and the documents in `docs/` are the site's pages, and `prose build` links
 * them by repo path. Two checks keep the site from drifting. Each page is read by this commit's
 * markz without a warning, and each relative link in its text goes to a file that exists.
 *
 * The grammar is let off `duplicate-id`, since it repeats a heading's id by design, for a
 * construct and its side rules. The Reference page names every export, `Document` member and node
 * type the package has, so a new one can't ship undocumented. A CDN link is pinned to this
 * version's major and minor, so the pull request that bumps the version updates them too.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { T } from "../src/ast";
import * as markz from "../src/index";
import { parse, type Document, type NodeId } from "../src/index";

const root = join(import.meta.dirname, "..");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  version: string;
};
const pinned = version.split(".").slice(0, 2).join(".");
const folder = join(root, "docs");
const files = [
  "README.md",
  ...readdirSync(folder)
    .filter((name) => name.endsWith(".md"))
    .map((name) => `docs/${name}`),
];

/** The destinations of every link and image, found in the tree so code samples don't count. */
function destinations(doc: Document, node: NodeId = doc.root): string[] {
  const type = doc.type(node);
  const own = type === "link" || type === "image" ? [doc.data(node, type).destination] : [];
  return [...doc.children(node)].reduce((all, child) => [...all, ...destinations(doc, child)], own);
}

describe.each(files)("%s", (name) => {
  const text = readFileSync(join(root, name), "utf8");

  it("is read without a warning", () => {
    const warnings = parse(text).warnings.filter((w) => w.code !== "duplicate-id");
    expect(warnings).toEqual([]);
  });

  it("links only to files that exist", () => {
    const links = destinations(parse(text)).map((href) => href.split("#")[0]!);
    const relative = links.filter((href) => href && !/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(href));
    const missing = relative.filter((href) => !existsSync(join(dirname(join(root, name)), href)));
    expect(missing).toEqual([]);
  });

  it("pins a CDN link to this version", () => {
    const pins = [...text.matchAll(/@amitkaps\/markz@([^/"'\s]+)/g)].map((m) => m[1]);
    expect(pins.filter((pin) => pin !== pinned)).toEqual([]);
  });
});

describe("docs/reference.md", () => {
  const text = readFileSync(join(folder, "reference.md"), "utf8");
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
