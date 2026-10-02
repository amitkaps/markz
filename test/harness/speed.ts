/** @prose
 * # Timing
 *
 * How markz's speed and memory are measured, shared by `pnpm bench` (`test/speed.ts`) and the
 * site's Quality page, which times this commit's build when the site is built. It is given the
 * functions to time rather than importing markz, so the bench times `src/` and the site the
 * built package.
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

/** One unmeasured pass over `texts`, then passes until `budgetMs` is spent, at least `least`. */
export function time(
  run: (text: string) => unknown,
  texts: string[],
  budgetMs: number,
  least = 5,
): Timing {
  const pass = () => {
    const start = performance.now();
    for (const text of texts) kept = run(text);
    return performance.now() - start;
  };
  pass();
  const passes: number[] = [];
  for (let spent = 0; spent < budgetMs || passes.length < least;) {
    const ms = pass();
    passes.push(ms);
    spent += ms;
  }
  passes.sort((a, b) => a - b);
  const q = passes.length >> 2;
  return {
    ms: passes[passes.length >> 1]!,
    low: passes[q]!,
    high: passes[passes.length - 1 - q]!,
    passes: passes.length,
  };
}

/** @prose
 * ## Retained memory
 *
 * What holding one parsed document keeps alive: the source is parsed `HELD` times with every
 * result held, and the heap after a full collection, less the heap before, divided by `HELD`, is
 * the figure. Every parse gets the same string, so a tree that keeps a reference to its source
 * pays nothing for it. The collector is reached through V8's flags, so no one has to start Node
 * with `--expose-gc`.
 */
const HELD = 20;

export function retained(parse: (text: string) => unknown, source: string): number {
  setFlagsFromString("--expose-gc");
  const gc = runInNewContext("gc") as () => void;
  // Warm up, so compiled code and caches aren't counted as retained.
  for (let i = 0; i < 3; i++) kept = parse(source);
  kept = undefined;
  gc();
  gc();
  const before = process.memoryUsage().heapUsed;
  const held: unknown[] = [];
  for (let i = 0; i < HELD; i++) held.push(parse(source));
  gc();
  gc();
  const after = process.memoryUsage().heapUsed;
  // Read after measuring, so the results are alive until then.
  if (held.length !== HELD) throw new Error("lost a result");
  return (after - before) / HELD;
}
