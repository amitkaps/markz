/** @prose
 * # Quality data
 *
 * What the Quality page reports, computed when it is generated: every example markz is held to
 * with its status, each construct's generated edges, and markz's size and speed on this commit.
 *
 * Conformance is the test harness's own `check`, so the page files each example under
 * `syntax.md`'s constructs and compares as `pnpm test` does, and can't disagree with the tests
 * because it runs their code. Each construct's edges come from the same search
 * `constructs.test.ts` runs, from the same seed: how many generated cases reached each edge, one
 * case of each, and why a construct has no ambiguous or unclosed example where it can't.
 *
 * Size is the gzip the size gate measures against its budget, and what the tree for the CommonMark
 * spec holds beside its source. Speed is parse + HTML on documents a reader can picture. The
 * numbers come from the build machine, so each speed is a range and the page names the machine.
 * No other parser is here: the page says what markz does, not how it ranks.
 */
import { readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { html, parse } from "../../src/index";
import { BUDGET, size } from "../size.ts";
import { EDGES, edges } from "../harness/cases";
import { documents } from "../harness/corpus";
import { check, examples } from "../harness/examples";
import { search } from "../harness/generate";
import { CONSTRUCTS } from "../harness/grammar";
import { normalize } from "../harness/oracle";
import { retained, time, warm } from "../harness/speed";
import { title } from "../harness/syntax";

export type Status = "match" | "warn" | "differ" | "fail";
export const STATUSES: Status[] = ["match", "warn", "differ", "fail"];
export type Part = "Metadata" | "Block" | "Inline" | "Not supported";
export const PARTS: Part[] = ["Metadata", "Block", "Inline", "Not supported"];

/** A construct's generated edges, from the grammar, and why it has no hand-written one it can't have. */
export interface Edges {
  valid: number;
  boundary: number;
  "near-miss": number;
  /** Cases markz and the grammar read differently that nothing settles; the tests hold it at 0. */
  unsettled: number;
  /** One case of each edge, so a reader sees what the counts are of. */
  sample: { valid: string; boundary: string | null; "near-miss": string | null } | null;
  none: Partial<Record<"ambiguous" | "unclosed", string>>;
}

export interface Row {
  /** The upstream suite (`commonmark`, `gfm`, `gfm-table`, …), or `markz` for its own examples. */
  source: string;
  id: string;
  number: number;
  part: Part;
  /** The construct id or Not supported code the example is filed under. */
  section: string;
  /** What the page shows for it: the construct's `syntax.md` heading, or the code. */
  title: string;
  /** The upstream suite's own section. */
  upstream: string | null;
  /** How it is checked: `oracle`, `differ`, `not supported` or `expected`. */
  kind: string;
  /** For markz's own: the edge it tries, and for an ambiguous one the side rule that settles it. */
  category: string | null;
  rule: string | null;
  markdown: string;
  status: Status;
  /** What it matched, the codes it warned with, or why it fails. */
  detail: string;
  /** Who holds it: `micromark`, `micromark-extension-math`, `yaml` or `github-slugger` for an upstream example, else `markz`. */
  oracle: string;
  /** What markz is held to: the oracle's output, or markz's own expected HTML. */
  expected: string;
  markz: string;
  /** The metadata markz read, as JSON, when a Markdown example has any. */
  metadata: string | null;
  /** Both outputs normalized, for a failing example. */
  normalized: [expected: string, markz: string] | null;
  warnings: string[];
  /** The warning codes, for search. */
  codes: string[];
}

const ORACLE: Record<string, string> = {
  markz: "markz",
  yaml: "yaml",
  slugger: "github-slugger",
  math: "micromark-extension-math",
};

export function conformance(): Row[] {
  return examples.map((e) => {
    const r = check(e);
    const expected = r.oracle ?? e.html;
    const metadata = e.source === "yaml" ? undefined : parse(e.markdown).metadata;
    return {
      source: e.source,
      id: e.id,
      number: e.number,
      part: e.part,
      section: e.section,
      title: title(e.section),
      upstream: e.upstream,
      kind: e.kind,
      category: e.category,
      rule: e.rule,
      markdown: e.markdown,
      status: r.status,
      detail: r.detail,
      oracle: ORACLE[e.source] ?? "micromark",
      expected,
      markz: r.markz,
      metadata: metadata === undefined ? null : JSON.stringify(metadata, null, 1),
      normalized: r.status === "fail" ? [normalize(expected), normalize(r.markz)] : null,
      codes: [...new Set(r.warnings.map((w) => w.code))],
      warnings: r.warnings.map(
        (w) =>
          `${e.markdown.slice(w.start, w.end).replace(/\n/g, "⏎")}: ${w.message}; write ${w.instead}`,
      ),
    };
  });
}

export function constructEdges(): Record<string, Edges> {
  const { runs, seed } = search(8);
  return Object.fromEntries(
    CONSTRUCTS.map(({ id }) => {
      const { unsettled, ...reached } = edges(id, runs, seed);
      return [id, { ...reached, unsettled: unsettled.length, none: EDGES[id] ?? {} }];
    }),
  );
}

const root = join(import.meta.dirname, "../..");
const WARM_MS = 1_000;
const BUDGET_MS = 200;

export interface Run {
  label: string;
  bytes: number;
  /** The middle half of the timed passes, in milliseconds. */
  low: number;
  high: number;
}

export interface Quality {
  size: { gzip: number; budget: number; held: number; source: number };
  speed: Run[];
  machine: string;
}

export async function quality(): Promise<Quality> {
  const docs = [...documents("markz").values(), ...documents("public").values()].sort(
    (a, b) => a.length - b.length,
  );
  const typical = docs[docs.length >> 1]!;
  const pages = readdirSync(join(root, "docs"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => readFileSync(join(root, "docs", f), "utf8"));
  const spec = [...documents("spec").values()][0]!;
  const runs: [string, string[]][] = [
    ["A typical docs page", [typical]],
    ["The docs, all of them", pages],
    ["The CommonMark spec", [spec]],
  ];

  const run = (text: string) => html(parse(text));
  warm(run, [...docs, ...pages, spec], WARM_MS);
  const timings = time(
    run,
    runs.map(([, texts]) => texts),
    BUDGET_MS,
  );
  const speed = runs.map(([label, texts], i) => {
    const { low, high } = timings[i]!;
    return { label, bytes: texts.reduce((n, s) => n + s.length, 0), low, high };
  });
  return {
    size: {
      gzip: (await size()).gzip,
      budget: BUDGET,
      held: retained(parse, spec),
      source: spec.length,
    },
    speed,
    machine: `${os.cpus()[0]?.model.trim() ?? os.arch()}, Node ${process.versions.node}`,
  };
}
