/** @prose
 * # The dialect, checked
 *
 * What every other check stands on, checked before anything is held to it: the statement, the
 * filing and the judges.
 *
 * - **The grammar** is well formed (every name defined, every production reachable from
 *   `document`, every name used once) and it is `syntax.md`'s: the same constructs in the same
 *   order, under the same parts, each from an origin. The element names it lists are the ones
 *   markz writes, from `src/elements.ts`.
 * - **The warnings** are each named in `syntax.md`, and each Not supported row's "Write instead" is
 *   its code's. Every warning that is not a row settles a case by the side rule it enforces, and
 *   every side rule a settlement names is a real one.
 * - **The filing** names real examples, numbers markz's own once each, and still compares most
 *   upstream examples with the oracle, so a rule that swallowed a suite would show. Each vendored
 *   file is exactly what `fences.ts` writes, so an edit by hand shows.
 * - **The oracles** match the upstream suites' own answers: micromark the suite's HTML, `yaml`
 *   the yaml-test-suite's JSON or `fail`, and github-slugger its ids, so a normalization or
 *   configuration bug can't hide behind them.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { BLOCK, INLINE } from "../src/elements";
import { WARNINGS } from "../src/warnings";
import { EVERYWHERE, SETTLED, WARNED, sideRules } from "./harness/cases";
import { references, type Expr } from "./harness/ebnf";
import { examples, headingTexts, listed, oracleDiffers } from "./harness/examples";
import { readFences, writeFences } from "./harness/fences";
import { CONSTRUCTS, DOCUMENT, PRODUCTIONS, reachable } from "./harness/grammar";
import { metadataOracle, normalize, reference, slugOracle } from "./harness/oracle";
import { anchor, anchors, named, row, rows } from "./harness/syntax";

describe("productions", () => {
  it.each([...PRODUCTIONS.values()].map((p) => [p.name, p] as const))(
    "%s names only defined productions",
    (_, p) => {
      expect([...references(p.expr)].filter((name) => !PRODUCTIONS.has(name))).toEqual([]);
    },
  );

  it("are all reachable from document", () => {
    const seen = reachable();
    expect([...PRODUCTIONS.keys()].filter((name) => !seen.has(name))).toEqual([]);
  });

  it.each(CONSTRUCTS.map((c) => c.id))("%s is named by its first production", (id) => {
    const own = [...PRODUCTIONS.values()].filter((p) => p.construct === id);
    expect(own[0]?.name).toBe(id);
  });

  it("name each side rule once", () => {
    const names = [DOCUMENT, ...CONSTRUCTS].flatMap((c) => Object.keys(c.rules));
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });
});

describe("syntax.md", () => {
  it("has the same constructs, in the same order", () => {
    expect(anchors.map((a) => a.id)).toEqual(CONSTRUCTS.map((c) => c.id));
  });

  it.each(CONSTRUCTS)("$id is under $part, from $origin", (c) => {
    expect(anchor(c.id)!.part).toBe(c.part);
    expect(c.origin).toBeTruthy();
  });
});

describe("element names", () => {
  const literals = (e: Expr): string[] =>
    e.kind === "alt" ? e.options.flatMap(literals) : e.kind === "literal" ? [e.text] : [];
  it.each([
    ["block-element", BLOCK],
    ["inline-element", INLINE],
  ] as const)("%s lists what src/elements.ts does", (name, names) => {
    expect(literals(PRODUCTIONS.get(name)!.expr)).toEqual([...names]);
  });
});

describe("warning codes", () => {
  it.each(Object.keys(WARNINGS))("%s is named in syntax.md", (code) => {
    expect(named(code)).toBe(true);
  });

  it.each(rows)("row $code writes instead what the code does", (r) => {
    expect(WARNINGS[r.code]?.[1]).toBe(r.instead);
  });
});

describe("settling", () => {
  it("names only real side rules", () => {
    const names = [
      ...Object.keys(EVERYWHERE),
      ...Object.values(SETTLED).flatMap((rules) => Object.keys(rules)),
      ...Object.values(WARNED),
    ];
    expect(names.filter((n) => !sideRules.has(n))).toEqual([]);
  });

  it("maps every warning that is not a Not supported row to its side rule", () => {
    const construct = Object.keys(WARNINGS).filter((code) => !row(code));
    expect(construct.filter((code) => !WARNED[code])).toEqual([]);
  });

  it("names a real side rule for each ambiguous example", () => {
    const ambiguous = examples.filter((e) => e.category === "ambiguous");
    expect(ambiguous.filter((e) => !e.rule || !sideRules.has(e.rule)).map((e) => e.id)).toEqual([]);
  });
});

describe("filing", () => {
  it.each(Object.keys(listed))("%s is a real example", (id) => {
    expect(examples.some((e) => e.id === id)).toBe(true);
  });

  it("numbers markz's own examples once each", () => {
    const numbers = examples.filter((e) => e.source === "markz").map((e) => e.number);
    expect(numbers.length).toBe(new Set(numbers).size);
  });

  it("compares most upstream examples with the oracle", () => {
    const upstream = examples.filter((e) => e.source !== "markz");
    const compared = upstream.filter((e) => e.kind === "oracle");
    expect(compared.length).toBeGreaterThan(upstream.length * 0.4);
  });
});

describe("upstream files", () => {
  const dir = join(import.meta.dirname, "examples/upstream");
  const files = ["", "stress/"].flatMap((sub) =>
    readdirSync(join(dir, sub))
      .filter((f) => f.endsWith(".md") && f !== "README.md")
      .map((f) => sub + f),
  );
  it.each(files)("%s is as fences.ts writes it", (file) => {
    const text = readFileSync(join(dir, file), "utf8");
    const { title, meta, examples: fences } = readFences(text);
    expect(writeFences(title, meta, fences)).toBe(text);
  });
});

describe("oracle", () => {
  it.each(
    examples.filter(
      (e) =>
        e.kind === "oracle" &&
        e.checks !== "yaml" &&
        e.checks !== "slug" &&
        e.html &&
        !oracleDiffers[e.id],
    ),
  )("$id ($upstream) matches the spec", (e) => {
    expect(normalize(reference(e.markdown))).toBe(normalize(e.html));
  });
});

describe("metadata oracle", () => {
  it.each(examples.filter((e) => e.checks === "yaml" && e.html && !oracleDiffers[e.id]))(
    "$id ($upstream) matches the suite",
    (e) => {
      const oracle = metadataOracle(e.markdown.slice(4, -4));
      if (e.html === "error") expect(oracle).toHaveProperty("error");
      else expect(oracle).toEqual({ value: JSON.parse(e.html) });
    },
  );
});

describe("slug oracle", () => {
  it.each(examples.filter((e) => e.checks === "slug" && !oracleDiffers[e.id]))(
    "$id ($upstream) matches the suite",
    (e) => {
      expect(slugOracle(headingTexts(e.markdown)).at(-1)).toBe(e.html);
    },
  );
});
