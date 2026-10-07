/** @prose
 * # Profile
 *
 * Where markz's time goes, for `pnpm bench --profile`. A bench cell says _that_ something is
 * slow, and this says _where_: self time by area (block pass, inline pass, `html()`) and by
 * function, the same table from one run to the next. Whether a change helped is still the plain
 * bench's job, against `origin/main`.
 *
 * The profiler starts only after the caller's warm-up, so the profile is of optimized code, as
 * every bench figure is. It samples, so a function under `FLOOR` of the samples is noise and isn't
 * listed. V8 inlines small helpers into their callers, and their time is counted there. Profiling
 * with inlining off was ruled out, since it changes the speed being measured.
 */
import { Session } from "node:inspector/promises";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";

/** The sampling interval, in microseconds. */
const INTERVAL = 100;
/** No function under this share of the samples is listed. */
const FLOOR = 0.01;
const TOP = 25;

// Each result is kept until the next, as in `speed.ts`, so no parse can be dropped unused.
export let kept: unknown;

interface Node {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number };
  hitCount?: number;
}

/** A V8 CPU profile, as DevTools and `node --cpu-prof` write it. */
export interface CpuProfile {
  nodes: Node[];
  samples: number[];
}

/** Runs `run` over every text in turn for `ms`, under the profiler. */
export async function profile(
  run: (text: string) => unknown,
  texts: string[],
  ms: number,
): Promise<CpuProfile> {
  const session = new Session();
  session.connect();
  await session.post("Profiler.enable");
  await session.post("Profiler.setSamplingInterval", { interval: INTERVAL });
  await session.post("Profiler.start");
  for (const start = performance.now(); performance.now() - start < ms;) {
    for (const text of texts) kept = run(text);
  }
  const { profile } = await session.post("Profiler.stop");
  session.disconnect();
  return profile as CpuProfile;
}

/** Which part of markz a source file belongs to. */
function area(file: string, name: string): string {
  if (name === "(garbage collector)") return "garbage collection";
  if (file === "src/block.ts" || file === "src/attributes.ts" || file === "src/metadata.ts")
    return "block pass";
  if (file === "src/inline.ts" || file === "src/expression.ts") return "inline pass";
  if (file === "src/html.ts" || file === "src/walk.ts") return "html()";
  if (file === "src/ast.ts") return "tree";
  if (file.startsWith("src/")) return "other markz";
  return "engine";
}

/** The profile's self time as a table: by area, then the top functions, each as a share. */
export function summarize(p: CpuProfile, root: string): string {
  const total = p.samples.length;
  const areas = new Map<string, number>();
  const functions = new Map<string, number>();
  for (const node of p.nodes) {
    const hits = node.hitCount ?? 0;
    const { functionName, url, lineNumber } = node.callFrame;
    if (!hits || functionName === "(idle)") continue;
    const file = url.startsWith("file:") ? relative(root, fileURLToPath(url)) : url;
    const name = functionName || "(anonymous)";
    const a = area(file, name);
    areas.set(a, (areas.get(a) ?? 0) + hits);
    const key = file ? `${name.padEnd(28)} ${file}:${lineNumber + 1}` : name;
    functions.set(key, (functions.get(key) ?? 0) + hits);
  }
  const share = (n: number) => `${((n / total) * 100).toFixed(1)}%`.padStart(7);
  const rows = (m: Map<string, number>, floor = 0) =>
    [...m]
      .filter(([, n]) => n / total >= floor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP)
      .map(([k, n]) => `${share(n)}  ${k}`);
  return [
    `self time, ${total} samples every ${INTERVAL} µs`,
    "",
    ...rows(areas),
    "",
    ...rows(functions, FLOOR),
  ].join("\n");
}
