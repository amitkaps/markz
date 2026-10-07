/** @prose
 * # Generated documents
 *
 * Documents built from the dialect's own grammar, so the fuzzer writes what an author could, not
 * only noise. Each production in `grammar.ts` becomes a fast-check arbitrary: a literal is itself,
 * a sequence joins its parts, an alternative picks one, and a repeat takes up to three (or
 * `repeats`). fast-check shrinks a failing document along the same structure, so a failure comes
 * back as the smallest document the grammar can write that still fails.
 *
 * The productions describe what markz accepts and leave the choices to side rules, so a generated
 * document is often read as something other than what built it. That is the point: whatever it
 * becomes, it must be sound, and where it is CommonMark or GFM, it must match the oracle.
 */
import fc from "fast-check";
import { references, type Expr } from "./ebnf";
import { construct, PRODUCTIONS, reachable, type Origin } from "./grammar";

export interface Options {
  /**
   * The origins whose constructs may be written. A construct of another origin is left out
   * wherever it is a choice or optional: an alternative, or a `?` or `*` (a link's `{…}`
   * attributes are djot's). Leave it out for every construct.
   */
  origins?: readonly Origin[];
  /**
   * What a negated class, such as `char`, draws from. A character the class excludes is never
   * drawn.
   */
  alphabet: string;
  /** How deep each recursion may nest before its alternatives take their first option. */
  depth?: number;
  /** How many times a `*` or `+` may repeat. */
  repeats?: number;
}

/** A generated document, with the choices that built it. */
export interface Built {
  text: string;
  took: string[];
}

export function grammarDocument(options: Options, start = "document"): fc.Arbitrary<string> {
  return grammarBuilt(options, start).map((b) => b.text);
}

/** @prose
 * ## Recursion
 *
 * Recursion stops at a fixed depth by taking an alternative's first option, which the grammar
 * lists first because it is the plainest (`paragraph` for a block, `text` for an inline). Each
 * cycle of productions counts its own depth, and only an alternative that leads back into its
 * cycle counts at all. With one count for every alternative, a choice nested under another was
 * always its first option. The edge cases then wrote only `{@div`, and every link's destination
 * had angle brackets.
 */
const CYCLE = new Map<string, string>();
for (const name of PRODUCTIONS.keys()) {
  const cycle = [...reachable(name)].filter((m) => m !== name && reachable(m).has(name));
  if (cycle.length) CYCLE.set(name, [name, ...cycle].sort()[0]!);
}

/** Whether `expr`, inside the production `at`, can lead back into `at`'s cycle. */
const recurses = (expr: Expr, at: string) =>
  CYCLE.has(at) && [...references(expr)].some((n) => CYCLE.get(n) === CYCLE.get(at));

/** How a choice reads in a list of the choices a search missed. */
const choice = (at: string, expr: Expr, taken?: boolean) =>
  `${at}: ${show(expr)}${taken === undefined ? "" : taken ? " taken" : " skipped"}`;

export function grammarBuilt(options: Options, start = "document"): fc.Arbitrary<Built> {
  const { origins, alphabet, depth = 5, repeats = 3 } = options;
  const allowed = (name: string) => {
    const p = PRODUCTIONS.get(name);
    const c = p?.construct ? construct(p.construct) : undefined;
    return !origins || !c || origins.includes(c.origin);
  };
  const plain = (text: string): Built => ({ text, took: [] });
  const join = (parts: Built[], took: string[] = []): Built => ({
    text: parts.map((p) => p.text).join(""),
    took: took.concat(...parts.map((p) => p.took)),
  });
  const arbitraries = fc.letrec<Record<string, Built>>((tie) => {
    const build = (expr: Expr, at: string): fc.Arbitrary<Built> => {
      switch (expr.kind) {
        case "name":
          return tie(expr.name);
        case "literal":
          return fc.constant(plain(expr.text));
        case "class":
          return fc.constantFrom(...members(expr, alphabet)).map(plain);
        case "seq":
          return fc.tuple(...expr.items.map((e) => build(e, at))).map((p) => join(p));
        case "alt": {
          const kept = expr.options.filter((o) => o.kind !== "name" || allowed(o.name));
          // Inside a construct left out, never reached; it keeps its options.
          const options = kept.length ? kept : expr.options;
          if (options.length === 1) return build(options[0]!, at);
          const limit = recurses(expr, at)
            ? { maxDepth: depth, depthIdentifier: CYCLE.get(at) }
            : {};
          return fc.oneof(
            limit,
            ...options.map((o) => build(o, at).map((b) => join([b], [choice(at, o)]))),
          );
        }
        case "repeat": {
          if (expr.item.kind === "name" && !allowed(expr.item.name) && expr.op !== "+") {
            return fc.constant(plain(""));
          }
          const item = build(expr.item, at);
          const parts =
            expr.op === "?"
              ? fc.option(item, { nil: null }).map((b) => (b ? [b] : []))
              : fc.array(item, {
                  minLength: expr.op === "+" ? 1 : 0,
                  maxLength: repeats,
                  ...(recurses(expr.item, at) && { depthIdentifier: CYCLE.get(at) }),
                });
          return parts.map((p) => join(p, [choice(at, expr, p.length > 0)]));
        }
      }
    };
    const out: Record<string, fc.Arbitrary<Built>> = {};
    for (const [name, p] of PRODUCTIONS) out[name] = build(p.expr, name);
    return out;
  });
  return arbitraries[start]!;
}

/** @prose
 * ## Choices a construct's cases must reach
 *
 * Every option of each alternative in the construct's own productions, and both sides of each
 * `?` and `*`, so a search can say what it never wrote. Two kinds are left out. A list of
 * literals, such as the element names, is one choice, since each name is read the same way. A
 * recursive alternative promises only its first option, which is all it takes once it is deep.
 */
export function choices(id: string): string[] {
  const out = new Set<string>();
  const reach = reachable(id);
  const visit = (expr: Expr, at: string) => {
    if (expr.kind === "seq") for (const e of expr.items) visit(e, at);
    else if (expr.kind === "alt") {
      const listed = expr.options.every((o) => o.kind === "literal");
      expr.options.forEach((o, i) => {
        if (!listed && !(i > 0 && recurses(expr, at))) out.add(choice(at, o));
        visit(o, at);
      });
    } else if (expr.kind === "repeat") {
      if (expr.op !== "+") out.add(choice(at, expr, true)).add(choice(at, expr, false));
      visit(expr.item, at);
    }
  };
  for (const [name, p] of PRODUCTIONS)
    if (p.construct === id && reach.has(name)) visit(p.expr, name);
  return [...out];
}

/** An expression as the grammar writes it. */
function show(expr: Expr): string {
  const inner = (e: Expr) => (e.kind === "seq" || e.kind === "alt" ? `(${show(e)})` : show(e));
  switch (expr.kind) {
    case "name":
      return expr.name;
    case "literal":
      return expr.text.includes("'") ? `"${expr.text}"` : `'${expr.text}'`;
    case "class":
      return `[${expr.negated ? "^" : ""}${expr.ranges.map(([a, b]) => (a === b ? hex(a) : `${hex(a)}-${hex(b)}`)).join("")}]`;
    case "seq":
      return expr.items.map(inner).join(" ");
    case "alt":
      return expr.options.map((o) => (o.kind === "alt" ? `(${show(o)})` : show(o))).join(" | ");
    case "repeat":
      return `${inner(expr.item)}${expr.op}`;
  }
}

const hex = (c: number) =>
  c > 0x20 && c < 0x7f ? String.fromCharCode(c) : `#x${c.toString(16).toUpperCase()}`;

/** The characters a class admits: its ranges, capped, or for a negated class the alphabet's rest. */
function members(expr: Extract<Expr, { kind: "class" }>, alphabet: string): string[] {
  const inside = (c: number) => expr.ranges.some(([a, b]) => c >= a && c <= b);
  if (expr.negated) {
    const out = alphabet.split("").filter((c) => !inside(c.charCodeAt(0)));
    return out.length ? out : ["a"];
  }
  const out: string[] = [];
  for (const [a, b] of expr.ranges) {
    for (let c = a; c <= b && c - a < 26; c++) out.push(String.fromCodePoint(c));
  }
  return out;
}

/** @prose
 * ## Noise
 *
 * Strings of the characters Markdown gives meaning to, and the ones that trouble offsets: every
 * line ending, tabs, a byte order mark, a lone surrogate and an astral-plane character. Most of
 * what this draws is nonsense, which is what finds a crash the grammar would never write.
 */
export const MARKDOWN: string[] = [
  ..."abc 1\t\n\r#>-*+_~`$:{}[]()<>!|\\&;\"'.=/@^%?,".split(""),
  "\r\n",
  String.fromCharCode(0xfeff),
  String.fromCharCode(0xd800),
  String.fromCodePoint(0x1f600),
];

export const noise = fc
  .array(fc.constantFrom(...MARKDOWN, "```", "$$", ":::", "---", "${", "<!--", "-->"), {
    maxLength: 80,
  })
  .map((p) => p.join(""));

/** @prose
 * ## Mutations
 *
 * A known document with a few edits: a character inserted, deleted or doubled at random places.
 * Starting from real examples reaches states noise rarely does, such as a table with one cell
 * missing or a fence one backtick short.
 */
export function mutated(documents: readonly string[]): fc.Arbitrary<string> {
  const edit = fc.tuple(
    fc.nat(),
    fc.constantFrom("insert", "delete", "double"),
    fc.constantFrom(...MARKDOWN),
  );
  return fc
    .tuple(fc.constantFrom(...documents), fc.array(edit, { minLength: 1, maxLength: 4 }))
    .map(([doc, edits]) => {
      let out = doc;
      for (const [at, op, c] of edits) {
        const i = out.length ? at % (out.length + 1) : 0;
        if (op === "insert") out = out.slice(0, i) + c + out.slice(i);
        else if (op === "delete") out = out.slice(0, i) + out.slice(i + 1);
        else out = out.slice(0, i) + out.slice(i, i + 1) + out.slice(i);
      }
      return out;
    });
}

/** @prose
 * ## How far a search goes
 *
 * The fuzzer and the edge cases search from one fixed seed, so `pnpm test` is deterministic and a
 * red run replays. `SEARCH` in the environment multiplies every search's runs, and `SEED` moves
 * it elsewhere: `pnpm fuzz` runs fifty times as far, and `SEED=random` draws a new seed in each
 * test file. fast-check prints the seed of any failure, and an edge test prints both settings
 * with its shortest unsettled cases.
 */
export function search(runs: number): { runs: number; seed: number } {
  const times = Number(process.env["SEARCH"] ?? 1);
  const seed = process.env["SEED"];
  return {
    runs: Math.ceil(runs * times),
    seed: seed === "random" ? RANDOM : Number(seed ?? 20260927),
  };
}

// Drawn in JavaScript, since `$RANDOM` is empty in the `sh` that runs scripts on Linux.
const RANDOM = Math.floor(Math.random() * 2 ** 31);
