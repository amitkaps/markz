/** @prose
 * # Complexity
 *
 * markz is linear in its input, and these tests hold it there. Each adversarial pattern is
 * parsed and rendered at a size and at four times that size, and the larger must take less than
 * eight times as long.
 *
 * Linear work takes about four times as long, and quadratic work sixteen. So the check sits
 * between them, with room for a noisy machine. Each size is warmed up and then timed at its best
 * of five, so a garbage collection or a cold JIT doesn't decide it. The patterns start at 5,000
 * repetitions, so the smaller input takes about 6 ms rather than 2, and a busy machine's noise is
 * a smaller part of it. A few milliseconds of slack covers the rest.
 *
 * The corpus's scaling tier, markz's own docs and the public documents repeated to megabytes,
 * guards the ordinary path the same way.
 */
import { describe, expect, it } from "vite-plus/test";
import { html, parse } from "../src/index";
import { PATTERNS } from "./harness/adversarial";
import { mix, repeat } from "./harness/corpus";

const time = (input: string): number => {
  let best = Infinity;
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    html(parse(input));
    best = Math.min(best, performance.now() - start);
  }
  return best;
};

/** How much longer four times the input may take. */
const RATIO = 8;
const SLACK_MS = 10;

function expectLinear(make: (n: number) => string, n: number): void {
  const [smallInput, largeInput] = [make(n), make(4 * n)];
  time(smallInput);
  time(largeInput);
  const small = time(smallInput);
  const large = time(largeInput);
  expect(large, `${small.toFixed(1)} ms, then ${large.toFixed(1)} ms`).toBeLessThan(
    RATIO * small + SLACK_MS,
  );
}

describe("adversarial input", () => {
  it.each(Object.entries(PATTERNS))("%s", (_, make) => expectLinear(make, 5000), 30_000);
});

describe("a large document", () => {
  const text = mix();
  it("stays linear to megabytes", () => expectLinear((n) => repeat(text, n), 1_000_000), 60_000);
});
