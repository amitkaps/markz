/** @prose
 * # Corpus
 *
 * Real documents, and the variants built from them, which `documents.test.ts` holds markz to and
 * `pnpm bench` times. The documents are vendored in `test/documents/`, never edited; the variants
 * are built on each run and never committed. Each tier of documents answers its own question:
 *
 * - **agent**: markz's docs and those of the repos that consume it (base, prose, visdown). All of
 *   it is written by coding agents in real repos, so it is one voice: long paragraphs, backticked
 *   names, tables. It is what markz reads day to day.
 * - **public**: documentation written by people, in other styles: Node.js's API reference (dense
 *   links and code), the Rust book (narrative with listings) and Vite's guide (VitePress, with
 *   `:::` containers), so neither voice speaks for Markdown in general.
 * - **spec**: the CommonMark spec's own text, which other parsers benchmark on. It is dense with
 *   edge cases, not a typical document.
 *
 * A document comes in three variants. _dialect_ is the document as written. _common_ keeps only
 * the top-level blocks every parser reads alike. _formatted_ is the document after oxfmt, which is
 * how the consumers store it. The scaling tier repeats the agent and public documents to a size.
 *
 * Nothing here parses at run time: a variant that needs markz's reading is given the parsed
 * document, so the tests pass `src/` and the site its built package.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Document, NodeId } from "../../src/index";

export type Tier = "agent" | "public" | "spec";
export const TIERS: Tier[] = ["agent", "public", "spec"];

const root = join(import.meta.dirname, "../..");
const DOCUMENTS = join(root, "test/documents");

/**
 * A tier's documents, named `<source>-<file>`, in a stable order. A caller bundled away from this
 * file (the site) passes the documents' folder.
 */
export function documents(tier: Tier, from = DOCUMENTS): Map<string, string> {
  const dir = join(from, tier);
  const out = new Map<string, string>();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      out.set(entry.name, readFileSync(join(dir, entry.name), "utf8"));
    } else if (entry.isDirectory()) {
      for (const file of readdirSync(join(dir, entry.name))) {
        if (file.endsWith(".md")) {
          out.set(`${entry.name}-${file}`, readFileSync(join(dir, entry.name, file), "utf8"));
        }
      }
    }
  }
  return new Map([...out].sort(([a], [b]) => a.localeCompare(b)));
}

/** @prose
 * ## The common variant
 *
 * A top-level block is kept when nothing in it is markz's alone (metadata, comments, elements,
 * math, raw blocks, expressions, attributes, an explicit heading id, a task item) and no warning
 * touches it, since a warning marks a form markz cuts and the others read. The kept blocks are
 * joined by blank lines, so each is still read as the block it was.
 */
const OWN = new Set(["metadata", "comment", "element", "math", "raw", "expression"]);

export function common(doc: Document): string {
  return commonBlocks(doc).join("\n\n") + "\n";
}

/** The blocks the common variant keeps, each on its own. */
export function commonBlocks(doc: Document): string[] {
  const kept: string[] = [];
  for (const block of doc.children(doc.root)) {
    const start = doc.start(block);
    const end = doc.end(block);
    const warned = doc.warnings.some((w) => w.start < end && w.end > start);
    if (!warned && shared(doc, block)) kept.push(doc.source.slice(start, end));
  }
  return kept;
}

function shared(doc: Document, node: NodeId): boolean {
  const type = doc.type(node);
  if (
    OWN.has(type) ||
    doc.attributes(node) ||
    (type === "heading" && doc.data(node, "heading").idExplicit) ||
    (type === "listItem" && doc.data(node, "listItem").checked !== null)
  ) {
    return false;
  }
  return [...doc.children(node)].every((child) => shared(doc, child));
}

/** The documents after oxfmt with the repo's settings, formatted in a scratch copy. */
export function format(docs: Map<string, string>): Map<string, string> {
  const dir = mkdtempSync(join(tmpdir(), "markz-corpus-"));
  try {
    for (const [name, text] of docs) writeFileSync(join(dir, name), text);
    execFileSync(join(root, "node_modules/.bin/vp"), ["fmt", dir], { cwd: root, stdio: "ignore" });
    return new Map([...docs.keys()].map((name) => [name, readFileSync(join(dir, name), "utf8")]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** @prose
 * ## Repeating without repeating titles
 *
 * A document repeated to a size is a benchmark's workload, and a real document doesn't hold the
 * same heading hundreds of times. Every copy after the first puts its number at the start of each
 * heading's text (`## Setup` becomes `## 2 Setup`), so ids don't pile up as `setup-1` to
 * `setup-300` and time id numbering no author would ask for. The number goes straight after the
 * `#`s, so each heading keeps its level, its closing `#`s and its reading.
 */
const ATX = /^( {0,3}#{1,6})(?=[ \t]|$)/gm;

/** `text` with `label()` put at the start of each ATX heading's text. */
export function titled(text: string, label: () => string): string {
  return text.replace(ATX, (marker) => `${marker} ${label()}`);
}

/** `text` repeated to `bytes` characters, cut at the end of a line, each copy's titles its own. */
export function repeat(text: string, bytes: number): string {
  let out = "";
  for (let copy = 1; out.length < bytes; copy++) {
    out += (copy === 1 ? text : titled(text, () => String(copy))) + "\n\n";
  }
  const cut = out.lastIndexOf("\n", bytes);
  return out.slice(0, cut > 0 ? cut + 1 : bytes);
}

/** The scaling tier's text: the agent and public documents, one after another. */
export function mix(): string {
  return [...documents("agent").values(), ...documents("public").values()].join("\n\n");
}
