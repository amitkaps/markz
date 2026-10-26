/** @prose
 * # Edges, kept for the Quality page
 *
 * The edge search is the slowest part of `pnpm test`, and the Quality page shows what it reached.
 * So `constructs.test.ts` keeps each construct's result in a file, and the page reads it rather
 * than searching again. `verify` runs the tests before the page, so the file is there.
 *
 * The file names the search's runs and seed, and a hash of `src/`, `test/` and `docs/`. One from
 * another search or other files isn't read, and the page searches for itself, so `pnpm quality`
 * still works alone. It sits in `node_modules/.cache`, where nothing clears it but a fresh install.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Reached } from "./cases";

const root = join(import.meta.dirname, "../..");
const FILE = join(root, "node_modules/.cache/markz/edges.json");

interface Kept {
  key: string;
  edges: Record<string, Reached>;
}

/** A hash of the search and every file it reads. */
function keyOf(runs: number, seed: number): string {
  const hash = createHash("sha256").update(`${runs} ${seed}`);
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else hash.update(path.slice(root.length)).update(readFileSync(path));
    }
  };
  for (const dir of ["src", "test", "docs"]) walk(join(root, dir));
  return hash.digest("hex");
}

/** Keeps every construct's result from one search. */
export function keepEdges(runs: number, seed: number, edges: Record<string, Reached>): void {
  const kept: Kept = { key: keyOf(runs, seed), edges };
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(kept));
}

/** The results kept from this search on these files, or undefined. */
export function keptEdges(runs: number, seed: number): Record<string, Reached> | undefined {
  if (!existsSync(FILE)) return undefined;
  const kept = JSON.parse(readFileSync(FILE, "utf8")) as Kept;
  return kept.key === keyOf(runs, seed) ? kept.edges : undefined;
}
