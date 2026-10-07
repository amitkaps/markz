/** @prose
 * # Timing
 *
 * How markz's speed and memory are measured, shared by `pnpm speed` (`test/speed.ts`), `pnpm size`
 * and the Quality page, which times this commit when the page is generated. It is given the functions to
 * time rather than importing markz, so each caller says what it times.
 *
 * Every figure is warm: the parser has run over the documents for a while before anything is
 * timed, which is what a server or a watch build pays for each document. A figure is the median
 * of repeated passes, with the middle half of the passes as its range, so one pass slowed by a
 * collection doesn't widen it.
 */
import { setFlagsFromString } from "node:v8";
import { runInNewContext } from "node:vm";

export interface Timing {
  /** The median pass, in milliseconds. */
  ms: number;
  /** The middle half of the passes. */
  low: number;
  high: number;
  passes: number;
}

// Each result is kept until the next, so no engine can drop a parse whose output goes unused.
// Exported, so nothing can prove it unread.
export let kept: unknown;

/** Runs `run` over every text in turn until `ms` is spent, so the engine has optimized it. */
export function warm(run: (text: string) => unknown, texts: string[], ms: number): void {
  const start = performance.now();
  while (texts.length) {
    for (const text of texts) {
      kept = run(text);
      if (performance.now() - start >= ms) return;
    }
  }
}

/** @prose
 * ## Groups in turns
 *
 * Several groups of texts are timed in rounds, one pass of each per round, rather than one group
 * after another. A busy stretch on the machine then slows every group alike, so their figures
 * stay in proportion. Timed one after another on a shared build machine, a 100 KB group once came
 * out as slow as a 200 KB one.
 */

/** One unmeasured round, then rounds until each group has had `budgetMs` on average, at least `least`. */
export function time(
  run: (text: string) => unknown,
  groups: string[][],
  budgetMs: number,
  least = 5,
): Timing[] {
  const pass = (texts: string[]) => {
    const start = performance.now();
    for (const text of texts) kept = run(text);
    return performance.now() - start;
  };
  for (const texts of groups) pass(texts);
  const passes: number[][] = groups.map(() => []);
  for (let spent = 0, round = 0; spent < budgetMs * groups.length || round < least; round++) {
    groups.forEach((texts, g) => {
      const ms = pass(texts);
      passes[g]!.push(ms);
      spent += ms;
    });
  }
  return passes.map((p) => {
    p.sort((a, b) => a - b);
    const q = p.length >> 2;
    return { ms: p[p.length >> 1]!, low: p[q]!, high: p[p.length - 1 - q]!, passes: p.length };
  });
}

/** @prose
 * ## One version against another
 *
 * Two versions of markz timed in one process, a pass of each in turn, with the order swapped
 * every pair. Whatever the machine does then slows both alike. Two separate runs promise no such
 * thing, and on unchanged code they have differed by 30% (lessons: Speed). The change is the
 * median of the pairs' ratios.
 *
 * The pairs in one process agree closely, but they share the process's luck with the JIT. On
 * unchanged code one construct could come out 15% apart, and a different one each run. So a
 * caller repeats this in fresh processes and trusts only a change they all show.
 */
export interface Versus {
  /** The median pass of `after`, in milliseconds. */
  ms: number;
  /** How much faster `after` is than `before`, as a fraction: 0.1 is 10% faster. */
  change: number;
}

/** Five unmeasured pairs, then pairs until `budgetMs` is spent, at least `least`. */
export function versus(
  before: (text: string) => unknown,
  after: (text: string) => unknown,
  texts: string[],
  budgetMs: number,
  least = 5,
): Versus {
  const pass = (run: (text: string) => unknown) => {
    const start = performance.now();
    for (const text of texts) kept = run(text);
    return performance.now() - start;
  };
  for (let i = 0; i < 5; i++) {
    pass(before);
    pass(after);
  }
  const afters: number[] = [];
  const ratios: number[] = [];
  for (let spent = 0; spent < budgetMs || ratios.length < least;) {
    const first = ratios.length % 2 ? before : after;
    const a = pass(first);
    const b = pass(first === before ? after : before);
    const [old, now] = first === before ? [a, b] : [b, a];
    afters.push(now);
    ratios.push(old / now);
    spent += a + b;
  }
  afters.sort((x, y) => x - y);
  ratios.sort((x, y) => x - y);
  return { ms: afters[afters.length >> 1]!, change: ratios[ratios.length >> 1]! - 1 };
}

/** @prose
 * ## Retained memory
 *
 * What holding one parsed document keeps alive: the source is parsed `HELD` times with every
 * result held, and the memory after a full collection, less the memory before, divided by `HELD`,
 * is the figure. Memory is the heap plus array buffers. V8 stores a typed array's contents outside
 * the heap, so the heap alone misses the tree's arrays. Every parse gets the same string, so a
 * tree that keeps a reference to its source pays nothing for it. The collector is reached through V8's flags, so no one has to start Node
 * with `--expose-gc`.
 */
const HELD = 20;

const memory = () => {
  const { heapUsed, arrayBuffers } = process.memoryUsage();
  return heapUsed + arrayBuffers;
};

export function retained(parse: (text: string) => unknown, source: string): number {
  setFlagsFromString("--expose-gc");
  const gc = runInNewContext("gc") as () => void;
  // Warm up, so compiled code and caches aren't counted as retained.
  for (let i = 0; i < 3; i++) kept = parse(source);
  kept = undefined;
  gc();
  gc();
  const before = memory();
  const held: unknown[] = [];
  for (let i = 0; i < HELD; i++) held.push(parse(source));
  gc();
  gc();
  const after = memory();
  // Read after measuring, so the results are alive until then.
  if (held.length !== HELD) throw new Error("lost a result");
  return (after - before) / HELD;
}
