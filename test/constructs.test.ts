/** @prose
 * # Constructs, checked
 *
 * Each construct in its own `describe`, by its id, held to everything that tries it: its upstream
 * examples against their oracle, its own examples to their expected output, labelled with the
 * edge each tries, and the cases generated at its edges from the grammar. A Not supported row is
 * held the same way to its examples. A red run names the construct first, whatever caught it.
 *
 * At its edges, a construct's generated cases and their one-character neighbours must each be
 * read as the grammar reads them, or be settled by a named side rule or a Not supported row, and
 * between them they must reach all three generated edges: a valid case markz reads, a boundary
 * neighbour it still reads, and a near miss it doesn't. The two edges the grammar can't write,
 * ambiguous and unclosed, are its own hand-written examples, and it has one of each or says why
 * it can't (`EDGES`).
 */
import { describe, expect, it } from "vite-plus/test";
import { parse } from "../src/index";
import { EDGES, edges } from "./harness/cases";
import { check, examples, type Example } from "./harness/examples";
import { search } from "./harness/generate";
import { CONSTRUCTS } from "./harness/grammar";
import { rows } from "./harness/syntax";
import { expectTree } from "./harness/tree";

const { runs, seed } = search(8);
// A longer search needs longer than a minute: link and element cases are the slowest to judge.
const timeout = Math.max(60_000, runs * 1000);

const label = (e: Example) =>
  e.source === "markz"
    ? [e.id, e.category, e.rule].filter(Boolean).join(" ")
    : `${e.id} ${e.upstream} (${e.kind})`;

function examplesOf(section: string) {
  const mine = examples.filter((e) => e.section === section);

  it("has examples", () => {
    expect(mine.length).toBeGreaterThan(0);
  });

  it.each(mine.map((e) => [label(e), e] as const))("%s", (_, e) => {
    expectTree(parse(e.markdown));
    const result = check(e);
    expect(
      result.problem,
      result.problem ? `${result.markz}\n${result.oracle ?? e.html}` : "",
    ).toBe(null);
  });
}

describe.each(CONSTRUCTS.map((c) => c.id))("%s", (id) => {
  examplesOf(id);

  it(
    "is read as the grammar reads it at its edges, or a side rule says why not",
    () => {
      const reached = edges(id, runs, seed);
      expect(reached.unsettled.slice(0, 10)).toEqual([]);
      expect(reached.valid, "valid cases markz reads").toBeGreaterThan(0);
      expect(reached.boundary, "boundary cases markz still reads").toBeGreaterThan(0);
      expect(reached["near-miss"], "near misses markz doesn't read").toBeGreaterThan(0);
    },
    timeout,
  );

  it.each(["ambiguous", "unclosed"] as const)(
    "has %s examples, or says why it has none",
    (category) => {
      const own = examples.filter((e) => e.section === id && e.category === category);
      if (EDGES[id]?.[category]) expect(own, "gives a reason and has examples").toEqual([]);
      else expect(own.length).toBeGreaterThan(0);
    },
  );
});

describe.each(rows.map((r) => r.code))("not supported: %s", (code) => {
  examplesOf(code);
});
